// Variações de preferência em banco em memória (não toca a prévia) e personas na prévia (somente sessão).
import {chromium} from '@playwright/test';import {mkdir} from 'node:fs/promises';import {randomUUID} from 'node:crypto';
import {openDatabase} from '../../src/server/database/client.mts';import {buildApp} from '../../src/server/app.mts';
import {qaPath} from '../lib/qa-paths.mjs';
const out=qaPath('redesign')+'/',base='http://127.0.0.1:4189',preview=process.env.PREVIEW_URL||'http://127.0.0.1:4176';await mkdir(out,{recursive:true});
const db=await openDatabase({preview:true,dataDir:':memory:'}),app=await buildApp({db,preview:true,origin:base,rateMax:10000});await app.listen({host:'127.0.0.1',port:4189});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const problems=[];
try{
 async function session(options,init){const context=await browser.newContext(options);if(init)await context.addInitScript(init);await context.request.post(base+'/api/session/preview',{data:{memberId:'guilherme'},headers:{origin:base}});const csrf=(await(await context.request.get(base+'/api/session')).json()).csrfToken;
  const command=async(method,path,data)=>{const r=await context.request.fetch(base+path,{method,data,headers:{origin:base,'x-csrf-token':csrf,'idempotency-key':randomUUID()}});if(r.status()!==200)throw new Error(await r.text());return r.json();};
  const page=await context.newPage();page.on('pageerror',e=>problems.push(e.message));page.on('console',m=>{if(m.type()==='error')problems.push(m.text());});return{context,command,page};}
 const open=async(page,hash='jornal')=>{await page.goto(base+'/jornal#'+hash);await page.reload();await page.waitForLoadState('networkidle');if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');await page.waitForTimeout(700);};
 const flat=async(page,label)=>{if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))problems.push('overflow '+label);};
 const seed=await session({viewport:{width:1440,height:900}});
 const task=await seed.command('POST','/api/tasks',{title:'Revisar o roteiro da bancada',description:'Registro sintético para captura de variações.',owner_id:'guilherme',project:'Produto',priority:'Alta'});
 await seed.command('POST',`/api/tasks/${task.id}/progress`,{version:1,progress:35,narrative:'Roteiro revisado em parte.',next_step:'Conferir a etapa de coleta com Clara.',status:'Fazendo'});
 await seed.command('PATCH','/api/me',{preferences:{reducedMotion:true}});
 const noGL=()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(kind==='webgl2'||kind==='webgl')return null;return get.call(this,kind,...args);};};
 const fb=await session({viewport:{width:1440,height:900}},noGL);await open(fb.page);await fb.page.screenshot({path:out+'var-fallback-svg.png'});console.log('fallback',await fb.page.locator('[data-volta-scene]').getAttribute('data-renderer'));
 await fb.page.setViewportSize({width:390,height:844});await open(fb.page);await fb.page.screenshot({path:out+'var-fallback-svg-mobile.png'});await flat(fb.page,'fallback mobile');
 await fb.page.goto(base+'/');await fb.page.waitForLoadState('networkidle');await fb.page.screenshot({path:out+'var-fallback-trajetoria-mobile.png'});await fb.context.close();
 await seed.command('PATCH','/api/me',{preferences:{theme:'high-contrast'}});await open(seed.page);await seed.page.screenshot({path:out+'var-alto-contraste.png'});
 await seed.command('PATCH','/api/me',{preferences:{theme:'default',artMode:'neutral'}});await open(seed.page);await seed.page.screenshot({path:out+'var-neutro.png'});
 await seed.command('PATCH','/api/me',{preferences:{artMode:'personal',textScale:200}});await seed.page.setViewportSize({width:640,height:900});await open(seed.page);await seed.page.screenshot({path:out+'var-texto-200.png',fullPage:true});await flat(seed.page,'texto 200% em 640');
 await seed.page.setViewportSize({width:1280,height:900});await open(seed.page);await flat(seed.page,'texto 200% em 1280');await open(seed.page,'atividades');await flat(seed.page,'texto 200% atividades');
 await seed.command('PATCH','/api/me',{preferences:{textScale:100}});await seed.page.setViewportSize({width:1440,height:900});await open(seed.page,'atividade/'+task.id);
 await seed.page.getByRole('button',{name:'Atualizar progresso',exact:true}).click();await seed.page.waitForTimeout(300);await seed.page.screenshot({path:out+'var-relatorio.png'});await seed.context.close();
 for(const member of ['clara-prado','jose-roberto','amanda','igor','julia-alves','jose-isaias']){const context=await browser.newContext({viewport:{width:1440,height:760},reducedMotion:'reduce'});let csrf;try{await context.request.post(preview+'/api/session/preview',{data:{memberId:member},headers:{Origin:preview}});csrf=(await(await context.request.get(preview+'/api/session')).json()).csrfToken;const page=await context.newPage();page.on('pageerror',e=>problems.push(e.message));await page.goto(preview+'/jornal#jornal');await page.waitForLoadState('networkidle');if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');await page.waitForTimeout(600);await page.screenshot({path:`${out}persona-${member}.png`});}finally{if(csrf)await context.request.post(preview+'/api/logout',{data:{},headers:{Origin:preview,'x-csrf-token':csrf}}).catch(()=>{});await context.close();}}
}finally{await browser.close();await app.close();await db.close();}
console.log(JSON.stringify({problems}));
