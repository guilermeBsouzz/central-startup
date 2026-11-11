import {openDatabase} from './db.mts';
import {randomUUID} from 'node:crypto';
const [memberId,subject]=process.argv.slice(2);
if(!memberId||!subject||!process.env.DATABASE_URL||!process.env.OIDC_ISSUER)throw new Error('Uso: npm run member:bind -- ID_DO_MEMBRO SUBJECT_OIDC. Exige DATABASE_URL, OIDC_ISSUER e identidade verificada pelo mantenedor.');
const db=await openDatabase({url:process.env.DATABASE_URL,preview:false});
try{
 await db.transaction(async tx=>{
  const old=(await tx.query('SELECT id FROM members WHERE id=$1 FOR UPDATE',[memberId])).rows[0];
  if(!old)throw new Error('Membro não encontrado.');
  await tx.query('UPDATE members SET oidc_sub=$1 WHERE id=$2',[process.env.OIDC_ISSUER+'|'+subject,memberId]);
  await tx.query('DELETE FROM sessions WHERE member_id=$1',[memberId]);
  await tx.query('INSERT INTO audit_log(id,actor_id,action,entity_type,entity_id,after_data) VALUES($1,$2,$3,$4,$2,$5::jsonb)',[randomUUID(),memberId,'identity.bound.by_operator','member',JSON.stringify({method:'operator-cli',sessionsRevoked:true})]);
 });
 console.log('Identidade vinculada; sessões anteriores revogadas.');
}finally{await db.close();}
