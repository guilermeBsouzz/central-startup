import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const manifest=JSON.parse(await readFile(new URL('../.data/demo-preview-v1.json',import.meta.url),'utf8'));
const base=manifest.origin,out=new URL('../qa/simulation/',import.meta.url);await mkdir(out,{recursive:true});
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
const errors=[];let context,csrf;
try{
 context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
 assert.equal((await context.request.post(base+'/api/session/preview',{data:{memberId:'guilherme'},headers:{Origin:base}})).status(),200);
 csrf=(await(await context.request.get(base+'/api/session')).json()).csrfToken;
 const state=await(await context.request.get(base+'/api/state')).json();
 const tasks=state.tasks.filter(t=>t.description.startsWith('[Cenário fictício]'));assert.equal(tasks.length,21);
 assert.equal(new Set(tasks.map(t=>t.owner_id)).size,7);
 for(const task of tasks){assert.equal(tasks.filter(t=>t.owner_id===task.owner_id).length,3);const reports=state.reports.filter(r=>r.task_id===task.id);assert.equal(reports.length,task.progress?2:0);if(task.progress)assert.equal(reports.at(-1).progress,task.progress);if(task.status==='Feito')assert.equal(task.progress,100);}
 assert.equal(state.publications.filter(p=>p.description.startsWith('[Cenário fictício]')).length,6);
 assert.equal(state.documents.filter(d=>d.file_name.startsWith('simulacao-volta-')).length,4);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base+'/jornal#jornal');await page.waitForLoadState('networkidle');await page.waitForSelector('dialog[open]');await page.screenshot({path:fileURLToPath(new URL('alert.png',out))});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Simulação',exact:true}).waitFor();assert.ok((await page.locator('body').innerText()).includes('Testar experiência da central'));
 await page.screenshot({path:fileURLToPath(new URL('journal.png',out)),fullPage:true});
 await page.getByRole('link',{name:'Equipe',exact:true}).click();assert.equal(await page.locator('.member-card').count(),7);await page.screenshot({path:fileURLToPath(new URL('team.png',out)),fullPage:true});
 await page.getByRole('link',{name:'Agenda',exact:true}).click();assert.equal(await page.locator('.publication-card').count(),6);await page.screenshot({path:fileURLToPath(new URL('agenda.png',out)),fullPage:true});
 await page.setViewportSize({width:390,height:900});await page.getByRole('link',{name:'Jornal',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:fileURLToPath(new URL('mobile.png',out)),fullPage:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({artificialTasks:tasks.length,members:7,populatedViews:['jornal','equipe','agenda'],browserErrors:errors.length}));
 await writeFile(new URL('results.json',out),JSON.stringify({artificial:true,counts:manifest.summary,verified:['21 tasks, 3 per member','progress matches latest report','completed tasks at 100%','6 publications','4 documents','entry alert','populated journal/team/agenda','mobile without horizontal overflow'],errors},null,2));
}finally{if(context&&csrf)await context.request.post(base+'/api/logout',{data:{},headers:{Origin:base,'x-csrf-token':csrf}}).catch(()=>{});await browser.close();}
