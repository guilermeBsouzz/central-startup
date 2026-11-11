'use strict';
(()=>{
 const media=matchMedia('(prefers-reduced-motion: reduce)');let paused=false;
 const mount=()=>{const host=document.querySelector('[data-volta-scene]');if(host)window.VoltaOrbit?.mount(host,{persona:'volta',paused});};
 addEventListener('volta-orbit-ready',mount);media.addEventListener('change',mount);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-arrival-pause]');if(!button)return;paused=!paused;window.VoltaOrbit?.pause(paused);button.textContent=paused?'Retomar cena':'Pausar cena';button.setAttribute('aria-pressed',String(paused));});
 mount();
})();
