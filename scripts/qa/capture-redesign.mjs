// Capturas de revisão visual contra a prévia em execução. Cria apenas uma sessão demonstrativa e a encerra.
import {chromium} from '@playwright/test';import {mkdir} from 'node:fs/promises';
import {qaPath} from '../lib/qa-paths.mjs';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4176',out=qaPath('redesign')+'/',only=process.argv[2];await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const shots=[['desktop',1440,900],['tablet',900,1100],['mobile-390',390,844],['mobile-320',320,700]];
const problems=[];
for(const [name,width,height] of shots){
 if(only&&!name.startsWith(only))continue;
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});let csrf;
 const page=await context.newPage();page.on('pageerror',e=>problems.push(name+' pageerror '+e.message));page.on('console',m=>{if(m.type()==='error')problems.push(name+' console '+m.text());});
 const settle=async()=>{await page.waitForLoadState('networkidle');await page.waitForTimeout(1600);};
 const overflow=async label=>{const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth,bad:[...document.querySelectorAll('body *')].filter(e=>!e.closest('.stage-world')).map(e=>({c:e.tagName+'.'+(e.className?.baseVal??e.className),r:Math.round(e.getBoundingClientRect().right)})).filter(e=>e.r>innerWidth+1).slice(0,6)}));if(o.sw>o.w)problems.push(`${name} ${label} overflow ${JSON.stringify(o)}`);};
 try{
  await page.goto(base+'/');await settle();await page.screenshot({path:`${out}${name}-trajetoria.png`});await overflow('trajetoria');
  await page.goto(base+'/jornal');await settle();await page.screenshot({path:`${out}${name}-login.png`});await overflow('login');
  console.log(name,'renderer',await page.locator('[data-volta-scene]').getAttribute('data-renderer'));
  await context.request.post(base+'/api/session/preview',{data:{memberId:process.env.MEMBER||'guilherme'},headers:{Origin:base}});csrf=(await(await context.request.get(base+'/api/session')).json()).csrfToken;
  await page.goto(base+'/jornal#jornal');await page.reload();await page.waitForLoadState('networkidle');await page.waitForTimeout(400);if(await page.locator('dialog[open]').count()){await page.screenshot({path:`${out}${name}-alerta.png`});await page.keyboard.press('Escape');}
  await settle();await page.screenshot({path:`${out}${name}-jornal-topo.png`});await page.screenshot({path:`${out}${name}-jornal.png`,fullPage:true});await overflow('jornal');
  for(const [hash,label] of [['atividades','atividades'],['equipe','equipe'],['agenda','agenda'],['conhecimento','conhecimento']]){await page.goto(base+'/jornal#'+hash);await page.waitForTimeout(1900);await page.screenshot({path:`${out}${name}-${label}.png`,fullPage:name!=='desktop'||label!=='equipe'});await overflow(label);}
  await page.getByRole('link',{name:'Atividades',exact:true}).click();await page.locator('.task-card .item-title').first().click();await page.waitForTimeout(600);await page.screenshot({path:`${out}${name}-atividade.png`,fullPage:true});await overflow('atividade');
  const progress=page.getByRole('button',{name:'Atualizar progresso',exact:true});if(await progress.count()){await progress.first().click();await page.waitForTimeout(400);await page.screenshot({path:`${out}${name}-relatorio.png`});await page.keyboard.press('Escape');}
 }finally{if(csrf)await context.request.post(base+'/api/logout',{data:{},headers:{Origin:base,'x-csrf-token':csrf}}).catch(()=>{});await context.close();}
}
await browser.close();console.log(JSON.stringify({problems},null,1));
