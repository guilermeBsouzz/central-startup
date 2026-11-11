import { randomUUID } from 'node:crypto';
import type {Database} from './db.mts';
export async function dailyReminders(db:Database,now=new Date()){
 return db.transaction(async tx=>{
  const members=(await tx.query('SELECT id,preferences FROM members WHERE active=true')).rows;
  let inserted=0;
  for(const member of members){
   const tz=member.preferences?.timezone||'America/Sao_Paulo';
   const parts=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
   const get=(name:string)=>parts.find(x=>x.type===name)?.value||'';
   if(['Sat','Sun'].includes(get('weekday'))||Number(get('hour'))<16)continue;
   const date=[get('year'),get('month'),get('day')].join('-');
   const pending=(await tx.query(`SELECT id,title FROM tasks t WHERE owner_id=$1 AND status NOT IN ('Feito','Cancelado') AND NOT EXISTS(SELECT 1 FROM reports r WHERE r.task_id=t.id AND (r.created_at AT TIME ZONE $2)::date=$3::date)`,[member.id,tz,date])).rows;
   const key=`reminder:${member.id}:${date}`;
   if(!pending.length){await tx.query('UPDATE notifications SET read_at=COALESCE(read_at,$2),confirmed_at=COALESCE(confirmed_at,$2) WHERE dedupe_key=$1',[key,now.toISOString()]);continue;}
   const ids=(await tx.query(`INSERT INTO notifications(id,member_id,type,title,body,dedupe_key,created_at) VALUES($1,$2,'reminder','Suas atividades precisam de atualização',$3,$4,$5) ON CONFLICT(dedupe_key) DO UPDATE SET body=EXCLUDED.body RETURNING id`,[randomUUID(),member.id,pending.map(t=>t.title).join(' · '),key,now.toISOString()])).rows;
   inserted+=ids.length;
  }
  await tx.query('DELETE FROM sessions WHERE expires_at<$1',[now.toISOString()]);
  await tx.query('DELETE FROM oidc_flows WHERE expires_at<$1',[now.toISOString()]);
  return inserted;
 });
}
