import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openDatabase} from '../../src/server/database/client.mts';
import {buildApp} from '../../src/server/app.mts';
import {dailyReminders} from '../../src/server/jobs.mts';
import {snapshot,restoreEmpty} from '../../src/server/database/backup.mts';
let db,app,a,b,task,pub,help;
const origin='http://127.0.0.1:4175';
async function login(memberId){const r=await app.inject({method:'POST',url:'/api/session/preview',payload:{memberId},headers:{origin}});assert.equal(r.statusCode,200,r.body);const cookie=r.headers['set-cookie'].split(';')[0];const s=(await app.inject({url:'/api/session',headers:{cookie}})).json();return {cookie,csrf:s.csrfToken,id:memberId};}
async function command(who,method,url,payload={},key=randomUUID()) {return app.inject({method,url,payload,headers:{cookie:who.cookie,'x-csrf-token':who.csrf,'idempotency-key':key,origin}});}
async function state(who){return (await app.inject({url:'/api/state',headers:{cookie:who.cookie}})).json();}
before(async()=>{db=await openDatabase({preview:true,dataDir:':memory:'});app=await buildApp({db,preview:true,origin,rateMax:10000});await app.ready();a=await login('guilherme');b=await login('clara-prado');});
after(async()=>{await app?.close();await db?.close();});
test('identity: seven people, private API, CSRF and origin isolation',async()=>{
 assert.equal((await app.inject('/api/state')).statusCode,401);
 assert.equal((await state(a)).members.length,7);
 const denied=await app.inject({method:'POST',url:'/api/tasks',headers:{cookie:a.cookie},payload:{title:'X'}});assert.equal(denied.statusCode,403);
 const cross=await app.inject({method:'POST',url:'/api/session/preview',headers:{origin:'https://untrusted.test'},payload:{memberId:a.id}});assert.equal(cross.statusCode,403);
 assert.equal((await app.inject({url:'/.env'})).statusCode,404);assert.equal((await app.inject({url:'/src/schema.sql'})).statusCode,404);
});
test('tasks: idempotent creation, retry mismatch, no completion shortcut',async()=>{
 const body={title:'Validar fluxo de coleta',owner_id:a.id,description:'Atividade de teste automatizado',project:'Produto',priority:'Alta'},key=randomUUID();
 const created=await command(a,'POST','/api/tasks',body,key);assert.equal(created.statusCode,200,created.body);task=created.json().id;
 const retry=await command(a,'POST','/api/tasks',body,key);assert.equal(retry.json().id,task);
 assert.equal((await command(a,'POST','/api/tasks',{...body,title:'Outro título'},key)).statusCode,409);
 assert.equal((await state(a)).tasks.filter(t=>t.id===task).length,1);
 const shortcut=await command(a,'PATCH','/api/tasks/'+task,{version:1,progress:100,status:'Feito'});assert.ok(shortcut.statusCode>=400,shortcut.body);
});
test('progress: report required, owner enforced, atomic update and stale conflict',async()=>{
 assert.equal((await command(a,'POST',`/api/tasks/${task}/progress`,{version:1,progress:25,narrative:' ',next_step:'Testar'})).statusCode,400);
 assert.equal((await command(b,'POST',`/api/tasks/${task}/progress`,{version:1,progress:25,narrative:'Avanço',next_step:'Testar'})).statusCode,403);
 const ok=await command(a,'POST',`/api/tasks/${task}/progress`,{version:1,progress:25,narrative:'Roteiro de teste definido',next_step:'Executar com a equipe',status:'Fazendo'});assert.equal(ok.statusCode,200,ok.body);
 const s=await state(b);assert.equal(s.tasks.find(t=>t.id===task).progress,25);assert.equal(s.reports.filter(r=>r.task_id===task).length,1);
 assert.equal((await command(a,'POST',`/api/tasks/${task}/progress`,{version:1,progress:60,narrative:'Concorrente',next_step:'Revisar'})).statusCode,409);
 assert.equal((await command(a,'POST',`/api/tasks/${task}/progress`,{version:2,progress:20,narrative:'Correção',next_step:'Revisar'})).statusCode,400);
 assert.equal((await command(a,'POST',`/api/tasks/${task}/progress`,{version:2,progress:80,narrative:'Concluído?',next_step:'Revisar',status:'Feito'})).statusCode,400);
 assert.equal((await state(a)).reports.filter(r=>r.task_id===task).length,1);
});
test('two simultaneous updates preserve one version and one report',async()=>{
 const before=(await state(a)).reports.length;
 const responses=await Promise.all([30,35].map(progress=>command(a,'POST',`/api/tasks/${task}/progress`,{version:2,progress,narrative:'Teste de concorrência',next_step:'Verificar versão'})));
 assert.deepEqual(responses.map(r=>r.statusCode).sort(),[200,409]);const s=await state(a);assert.equal(s.reports.length,before+1);assert.equal(s.tasks.find(t=>t.id===task).version,3);
});
test('comments: mentions target a member and priority is independent',async()=>{
 const r=await command(b,'POST','/api/comments',{task_id:task,text:'@Guilherme pode revisar o roteiro?',priority:'Alta',mentions:[a.id]});assert.equal(r.statusCode,200,r.body);
 const s=await state(a);assert.ok(s.notifications.some(n=>n.type==='mention'&&n.task_id===task));
 const comment=s.comments.find(c=>c.id===r.json().id);assert.deepEqual(comment.mentions,[a.id]);
 assert.equal((await command(a,'PATCH','/api/comments/'+comment.id,{version:comment.version,priority:'Baixa'})).statusCode,200);
 assert.equal((await state(a)).tasks.find(t=>t.id===task).priority,'Alta');
 const invalid=await command(b,'POST','/api/comments',{task_id:task,text:'Não existe',priority:'Média',mentions:['inexistente']});assert.equal(invalid.statusCode,400);assert.equal((await state(a)).comments.length,1);
});
test('help: notification, destination, assume and resolve without closing task',async()=>{
 const r=await command(a,'POST','/api/help',{task_id:task,text:'Preciso revisar o fluxo com @Clara Prado',priority:'Alta',recipients:[b.id]});assert.equal(r.statusCode,200,r.body);help=r.json().id;
 assert.ok((await state(b)).notifications.some(n=>n.type==='help'&&n.help_id===help));
 assert.equal((await command(b,'PATCH','/api/help/'+help,{version:1,status:'Em atendimento'})).statusCode,200);
 assert.equal((await command(b,'PATCH','/api/help/'+help,{version:2,status:'Resolvido'})).statusCode,403);
 assert.equal((await command(a,'PATCH','/api/help/'+help,{version:2,status:'Resolvido'})).statusCode,200);
 assert.equal((await state(a)).tasks.find(t=>t.id===task).status,'Fazendo');
});
test('publications: all members publish, important events have individual confirmations',async()=>{
 const r=await command(b,'POST','/api/publications',{type:'evento',title:'Revisão da bancada',description:'Trazer resultados do teste',priority:'Alta',starts_at:'2030-01-08T12:00:00-03:00',ends_at:'2030-01-08T13:00:00-03:00',location:'Bancada',url:'https://example.com'});assert.equal(r.statusCode,200,r.body);pub=r.json().id;
 const na=(await state(a)).notifications.find(n=>n.publication_id===pub);const nb=(await state(b)).notifications.find(n=>n.publication_id===pub);assert.ok(na&&nb);
 assert.equal((await command(a,'POST','/api/notifications/'+nb.id+'/confirm')).statusCode,404);
 assert.equal((await command(a,'POST','/api/notifications/'+na.id+'/confirm')).statusCode,200);
 assert.ok((await state(a)).notifications.find(n=>n.id===na.id).confirmed_at);assert.equal((await state(b)).notifications.find(n=>n.id===nb.id).confirmed_at,null);
 assert.equal((await command(a,'PATCH','/api/publications/'+pub,{version:1,title:'Não autorizado'})).statusCode,403);
 const opp=await command(a,'POST','/api/publications',{type:'oportunidade',title:'Edital sem prazo conhecido',description:'Verificar requisitos',priority:'Média'});assert.equal(opp.statusCode,200,opp.body);
});
test('event material changes renotify; typo does not; cancel notification remains',async()=>{
 let s=await state(b),p=s.publications.find(p=>p.id===pub),count=s.notifications.filter(n=>n.publication_id===pub).length;
 let r=await command(b,'PATCH','/api/publications/'+pub,{version:p.version,title:'Revisão da bancada — texto corrigido'});assert.equal(r.statusCode,200,r.body);
 s=await state(b);assert.equal(s.notifications.filter(n=>n.publication_id===pub).length,count);
 p=s.publications.find(p=>p.id===pub);r=await command(b,'PATCH','/api/publications/'+pub,{version:p.version,location:'Nova bancada'});assert.equal(r.statusCode,200,r.body);
 s=await state(b);assert.equal(s.notifications.filter(n=>n.publication_id===pub).length,count+1);
 p=s.publications.find(p=>p.id===pub);r=await command(b,'PATCH','/api/publications/'+pub,{version:p.version,status:'Cancelado'});assert.equal(r.statusCode,200,r.body);
 assert.ok((await state(a)).notifications.some(n=>n.publication_id===pub&&n.title.toLowerCase().includes('cancel')));
});
test('documents: MD import, duplicate detection, no content execution',async()=>{
 const body={title:'Guia de teste',body:'# Guia\n<script>alert(1)</script>',file_name:'guia.md'};const first=await command(a,'POST','/api/documents',body);assert.equal(first.statusCode,200,first.body);
 const again=await command(a,'POST','/api/documents',body);assert.equal(again.json().id,first.json().id);
 assert.equal((await command(a,'POST','/api/documents',{...body,file_name:'unsafe.exe'})).statusCode,400);
 assert.equal((await state(a)).documents.length,1);
 assert.equal((await state(b)).documents.length,0,'Documentos restritos não vazam para colegas');
 const shared=await command(a,'POST','/api/documents',{title:'Compartilhado',body:'# Contexto aprovado para a equipe',file_name:'equipe.md',visibility:'Equipe'});assert.equal(shared.statusCode,200,shared.body);assert.equal((await state(b)).documents.length,1);
});
test('preferences: personal themes are persisted independently',async()=>{
 const r=await command(a,'PATCH','/api/me',{interests:['Vôlei','Matemática'],preferences:{theme:'high-contrast',textScale:150,reducedMotion:true}});assert.equal(r.statusCode,200,r.body);
 assert.equal((await state(a)).me.preferences.theme,'high-contrast');assert.equal((await state(b)).me.preferences.theme,'default');
 assert.equal((await command(a,'PATCH','/api/me',{preferences:{theme:'untrusted'}})).statusCode,400);
 for(const theme of ['protanopia','deuteranopia','tritanopia']){assert.equal((await command(a,'PATCH','/api/me',{preferences:{theme}})).statusCode,200);assert.equal((await state(a)).me.preferences.theme,theme);}
});
test('reminders: weekdays only, one delivery per member/day',async()=>{
 await dailyReminders(db,new Date('2030-01-05T20:00:00Z'));assert.equal((await db.query("SELECT count(*) FROM notifications WHERE type='reminder'")).rows[0].count,0);
 await dailyReminders(db,new Date('2030-01-07T20:00:00Z'));await dailyReminders(db,new Date('2030-01-07T21:00:00Z'));
 assert.equal((await db.query("SELECT count(*) FROM notifications WHERE type='reminder' AND member_id=$1",[a.id])).rows[0].count,1);
});
test('database rollback preserves consistency and audit trail exists',async()=>{
 const before=(await db.query('SELECT count(*) FROM tasks')).rows[0].count;
 await assert.rejects(db.transaction(async tx=>{await tx.query('DELETE FROM idempotency');throw new Error('Simulated failure');}));
 assert.equal((await db.query('SELECT count(*) FROM tasks')).rows[0].count,before);assert.ok((await db.query('SELECT count(*) FROM audit_log')).rows[0].count>0);assert.ok((await db.query('SELECT count(*) FROM idempotency')).rows[0].count>0);
});
test('backup restores business records with integrity and without sessions',async()=>{
 const exported=await snapshot(db),restored=await openDatabase({preview:true,dataDir:':memory:'});
 try{await restoreEmpty(restored,exported);assert.equal((await restored.query('SELECT count(*) FROM tasks')).rows[0].count,(await db.query('SELECT count(*) FROM tasks')).rows[0].count);assert.equal((await restored.query('SELECT count(*) FROM sessions')).rows[0].count,0);await assert.rejects(restoreEmpty(restored,exported),/vazio/);const damaged=JSON.parse(exported);damaged.payload+='x';await assert.rejects(restoreEmpty(restored,JSON.stringify(damaged)),/hash/);}finally{await restored.close();}
});
test('logout revokes session and inactive members lose access',async()=>{
 await command(b,'POST','/api/logout');assert.equal((await app.inject({url:'/api/state',headers:{cookie:b.cookie}})).statusCode,401);
 await db.query('UPDATE members SET active=false WHERE id=$1',[a.id]);assert.equal((await app.inject({url:'/api/state',headers:{cookie:a.cookie}})).statusCode,401);
});
test('embedded database survives restart (preview only)',async()=>{
 const root=resolve('.data');await mkdir(root,{recursive:true});const dir=await mkdtemp(resolve(root,'persistence-test-'));
 try{let local=await openDatabase({preview:true,dataDir:dir});await local.query('UPDATE members SET interests=$1::jsonb WHERE id=$2',[JSON.stringify(['Persistente']),a.id]);await local.close();local=await openDatabase({preview:true,dataDir:dir});assert.deepEqual((await local.query('SELECT interests FROM members WHERE id=$1',[a.id])).rows[0].interests,['Persistente']);await local.close();}finally{await rm(dir,{recursive:true,force:true});}
});
test('production refuses an embedded database or missing configuration',async()=>{
 await assert.rejects(buildApp({db,preview:false,origin:'https://central.example.com'}),/PostgreSQL/);
 await assert.rejects(openDatabase({preview:false}),/DATABASE_URL/);
});
