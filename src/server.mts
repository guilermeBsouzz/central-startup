import {openDatabase} from './db.mts';
import {buildApp} from './app.mts';
import {dailyReminders} from './jobs.mts';
const preview=process.argv.includes('--preview');
if(preview&&process.env.NODE_ENV==='production')throw new Error('Prévia não pode executar em NODE_ENV=production.');
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4175);
if(preview&&!['127.0.0.1','::1'].includes(host))throw new Error('Prévia só pode escutar em loopback.');
const db=await openDatabase({url:process.env.DATABASE_URL,dataDir:process.env.DATA_DIR,preview});
const app=await buildApp({db,preview,origin:process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`,logger:true});
await app.listen({host,port});
let pending=false;
async function tick(){if(pending)return;pending=true;try{await dailyReminders(db);}catch(err){app.log.error({err},'Falha nos lembretes');}finally{pending=false;}}
await tick();const timer=setInterval(tick,60000);timer.unref();
async function shutdown(){clearInterval(timer);await app.close();await db.close();}
process.once('SIGINT',()=>void shutdown());process.once('SIGTERM',()=>void shutdown());
