// Confere se as animações CSS da cena realmente avançam e se a pausa as congela.
import {chromium} from '@playwright/test';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4176';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});let csrf;
try{await context.request.post(base+'/api/session/preview',{data:{memberId:'guilherme'},headers:{Origin:base}});csrf=(await(await context.request.get(base+'/api/session')).json()).csrfToken;
 const page=await context.newPage();await page.goto(base+'/jornal#jornal');await page.waitForLoadState('networkidle');if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');await page.waitForTimeout(1500);
 const sample=()=>page.evaluate(()=>{const g=s=>getComputedStyle(document.querySelector('.scene-deck '+s));return{ball:g('.a-ball').offsetDistance,spin:g('.a-spin').transform,float:g('.a-float').transform,running:document.getAnimations().filter(a=>a.playState==='running').length};});
 const a=await sample();await page.waitForTimeout(400);const b=await sample();
 await page.getByRole('button',{name:'Pausar cena',exact:true}).click();await page.waitForTimeout(100);const c=await sample();await page.waitForTimeout(400);const d=await sample();
 console.log(JSON.stringify({moving:a.ball!==b.ball&&a.spin!==b.spin&&a.float!==b.float,pausedFrozen:c.ball===d.ball&&c.spin===d.spin,a,b,runningWhilePaused:d.running},null,1));
 await page.getByRole('button',{name:'Retomar cena',exact:true}).click();await page.waitForTimeout(700);await page.screenshot({path:'qa/redesign/desktop-jornal-meio-movimento.png'});
}finally{if(csrf)await context.request.post(base+'/api/logout',{data:{},headers:{Origin:base,'x-csrf-token':csrf}}).catch(()=>{});await browser.close();}
