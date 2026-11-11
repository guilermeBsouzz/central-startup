const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {chromium}=require(require.resolve('playwright-core',{paths:[path.join(os.homedir(),'AppData/Roaming/npm/node_modules/rea-agents')]}));
const base=(process.env.TEST_URL||'http://127.0.0.1:4173').replace(/\/$/,''),out=path.join(__dirname,'../qa/journey'),results=[];
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'no-preference'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
await page.goto(base);await page.waitForSelector('.has-motion');await page.waitForTimeout(300);
assert.equal(await page.locator('.milestone').count(),5);results.push('Five sourced chapters');
const offset=()=>page.locator('#route-progress').evaluate(e=>parseFloat(e.style.strokeDashoffset));const initial=await offset();assert.ok(initial>0);
await page.screenshot({path:path.join(out,'desktop.png')});
await page.locator('#plataforma').scrollIntoViewIfNeeded();await page.waitForTimeout(800);const middle=await offset();assert.ok(middle<initial&&middle>0);await page.screenshot({path:path.join(out,'timeline.png')});results.push('Scroll advances line');
await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(350);assert.equal(await offset(),0);assert.equal(await page.locator('.is-reached').count(),5);results.push('Line reaches final milestone');
await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(350);assert.ok(await offset()>middle);await page.keyboard.press('PageDown');await page.waitForTimeout(450);assert.ok(await page.evaluate(()=>scrollY)>0);results.push('Reverse scroll and native keyboard navigation');
for(const stage of await page.locator('.milestone').all()){await stage.scrollIntoViewIfNeeded();await page.waitForTimeout(180);}
assert.ok(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));results.push('Every image loads');assert.deepEqual(errors,[]);results.push('No page errors or missing resources');
await page.locator('.finish-button').click();await page.waitForSelector('.edition');assert.ok(page.url().endsWith('/jornal'));await page.locator('a[href="/"]').last().click();await page.waitForSelector('.journey-hero');results.push('Entry and dashboard links work');
for(const width of [390,320]){const mobile=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});await mobile.goto(base);await mobile.waitForTimeout(200);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await mobile.locator('.milestone.is-visible').count(),5);assert.equal(await mobile.locator('#route-progress').evaluate(e=>Number(e.style.strokeDashoffset)),0);await mobile.locator('#visao').scrollIntoViewIfNeeded();await mobile.screenshot({path:path.join(out,'mobile-'+width+'.png')});await mobile.close();results.push('Responsive and reduced motion '+width);}
await page.goto(base+'/jornal/');assert.ok(page.url().endsWith('/jornal'));results.push('Dashboard canonical redirect');
}finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({passed:results.length,results},null,2));}console.log(JSON.stringify({passed:results.length,results}));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
