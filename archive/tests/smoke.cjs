const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const playwrightPath=require.resolve('playwright-core',{paths:[path.join(os.homedir(),'AppData/Roaming/npm/node_modules/rea-agents')]});
const {chromium}=require(playwrightPath);
const output=path.join(__dirname,'../../test-results/archive');fs.mkdirSync(output,{recursive:true});
const base=(process.env.TEST_URL||'http://127.0.0.1:4173').replace(/\/$/,'')+'/jornal';
const results=[],errors=[];
const record=(name,detail)=>results.push({name,status:'passed',detail});
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('volta-central-demo-v1')));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',locale:'pt-BR'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('.edition');
  assert.equal(await page.locator('#persona option').count(),7);record('Journal and seven demo personas');
  await page.screenshot({path:path.join(output,'desktop.png'),fullPage:true});
  await page.locator('#new-task').click();await page.locator('#task-title').fill('Tarefa local do teste');await page.locator('#task-description').fill('Verificar persistência e origem.');await page.locator('#task-source').selectOption('doc-1');await page.locator('#task-form button[type=submit]').click();
  let data=await state(page);const task=data.tasks.find(x=>x.title==='Tarefa local do teste');assert.ok(task);const id=task.id;assert.equal(task.source,'doc-1');assert.equal(data.events.length,2);record('Create local task with document; no fabricated progress');
  await page.reload();await page.waitForSelector('.edition');assert.ok((await state(page)).tasks.some(x=>x.id===id));record('Task survives reload');
  await page.locator(`.edition [data-open=task][data-id="${id}"]`).click();await page.locator(`[data-edit="${id}"]`).click();await page.locator('#task-title').fill('Tarefa editada do teste');await page.locator('#task-state').selectOption('Em revisão');await page.locator('#task-form button[type=submit]').click();
  data=await state(page);assert.equal(data.tasks.find(x=>x.id===id).state,'Em revisão');assert.equal(data.tasks.find(x=>x.id===id).history.length,1);assert.equal(data.events.length,2);record('Edit fields and preserve raw review status separately from progress');
  await page.locator(`[data-update="${id}"]`).click();await page.locator('#update-text').fill('Conferência de versão concluída no protótipo.');await page.locator('#update-next').fill('Revisar o documento relacionado.');await page.locator('#update-form button[type=submit]').click();
  data=await state(page);assert.equal(data.events.length,3);assert.ok(data.events.at(-1).supplement);assert.equal(await page.locator('.supplement').count(),1);record('Publish progress into separate after-cut supplement');
  await page.locator(`.edition [data-open=task][data-id="${id}"]`).click();await page.locator(`[data-read="${id}"]`).click();data=await state(page);assert.equal(data.tasks.find(x=>x.id===id).state,'Em revisão');assert.ok(data.read['Ana:'+id]);record('Reading does not complete task');
  await page.locator('#persona').selectOption('Bruno');assert.equal(await page.locator(`.edition [data-open=task][data-id="${id}"]`).count(),0);record('Journal is personalized by task owner');
  await page.locator('[data-view=tarefas]').click();await page.locator('#owner-filter').selectOption('Ana');await page.locator('#status-filter').selectOption('Em revisão');assert.equal(await page.locator('tbody tr').count(),1);record('Filter by responsible member and exact workflow status');
  await page.locator('#persona').selectOption('Ana');await page.locator('#new-task').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#task-dialog').evaluate(d=>d.open),false);record('Escape closes native dialog');
  const text='# Documento do teste\n\n<script>window.bad=true</script>\nTexto de origem.';
  await page.locator('#file-input').setInputFiles({name:'teste.md',mimeType:'text/markdown',buffer:Buffer.from(text)});await page.waitForSelector('.doc-body');data=await state(page);assert.equal(data.docs.length,4);assert.equal(await page.evaluate(()=>window.bad),undefined);assert.ok((await page.locator('.doc-body').textContent()).includes('<script>'));record('Import Markdown safely as text');
  await page.locator('#file-input').setInputFiles({name:'teste.md',mimeType:'text/markdown',buffer:Buffer.from(text)});await page.waitForTimeout(100);assert.equal((await state(page)).docs.length,4);record('Exact reimport does not duplicate document');
  await page.locator('#file-input').setInputFiles({name:'teste.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.0 demo')});await page.waitForTimeout(100);assert.equal((await state(page)).docs.length,4);assert.ok((await page.locator('#toast').textContent()).includes('Formato não suportado'));record('Unsupported PDF is rejected explicitly');
  await page.locator('#search').fill('nenhumresultadoxyz');assert.ok((await page.locator('#view-content').textContent()).includes('Nenhum documento encontrado'));await page.locator('#search').fill('');record('Search empty state');
  for(const width of [390,320]){
   const mobile=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(base);await mobile.waitForSelector('.edition');
   const widths=await mobile.evaluate(()=>({page:document.documentElement.scrollWidth,view:innerWidth}));assert.ok(widths.page<=widths.view,JSON.stringify(widths));
   await mobile.locator('.edition [data-open=task]').first().click();assert.equal(await mobile.locator('#detail-dialog').evaluate(d=>d.open),true);await mobile.keyboard.press('Escape');
   if(width===390)await mobile.screenshot({path:path.join(output,'mobile.png'),fullPage:true});record('Mobile '+width+'px: no page overflow, detail and Escape');await mobile.close();
  }
  assert.deepEqual(errors,[]);record('No uncaught page errors');
 }finally{await browser.close();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,pageErrors:errors},null,2));}
 console.log(JSON.stringify({passed:results.length,pageErrors:errors.length,output}));
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
