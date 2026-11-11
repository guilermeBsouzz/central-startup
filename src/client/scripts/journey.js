'use strict';
(()=>{
 const timeline=document.querySelector('#timeline'),svg=document.querySelector('#timeline-svg'),base=document.querySelector('#route-base'),progress=document.querySelector('#route-progress'),bead=document.querySelector('#route-bead');
 const stages=[...document.querySelectorAll('.milestone')],dots=stages.map(s=>s.querySelector('.milestone-dot')),headerFill=document.querySelector('#header-fill'),positionStage=document.querySelector('#position-stage'),positionPercent=document.querySelector('#position-percent');
 const labels=['Pesquisa e propósito','Visão computacional','Plataforma','Rastreabilidade','Equipe'];
 const media=matchMedia('(prefers-reduced-motion: reduce)');let length=0,points=[],top=0,start=0,end=1,frame=0,measureFrame=0;
 function measure(){
  const rect=timeline.getBoundingClientRect();top=rect.top+scrollY;const mobile=innerWidth<=760;
  points=dots.map(dot=>{const r=dot.getBoundingClientRect();return{x:r.left+r.width/2-rect.left,y:r.top+r.height/2-rect.top};});
  if(!points.length)return;
  svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
  const first=points[0],last=points.at(-1);start=Math.max(8,first.y-95);end=Math.min(rect.height-10,last.y+140);
  let d=`M ${first.x} ${start} L ${first.x} ${first.y}`;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],dy=b.y-a.y,bend=(mobile?10:54)*(i%2?1:-1);d+=` C ${a.x+bend} ${a.y+dy*.32}, ${b.x-bend} ${a.y+dy*.68}, ${b.x} ${b.y}`;}
  d+=` L ${last.x} ${end}`;base.setAttribute('d',d);progress.setAttribute('d',d);length=progress.getTotalLength();progress.style.strokeDasharray=String(length);update();
 }
 function update(){
  frame=0;const viewport=innerHeight,focus=scrollY+viewport*.58;const travel=Math.max(1,end-start),fraction=Math.max(0,Math.min(1,(focus-top-start)/travel));
  const documentTravel=Math.max(1,document.documentElement.scrollHeight-viewport),pageFraction=Math.max(0,Math.min(1,scrollY/documentTravel));
  headerFill.style.transform=`scaleX(${pageFraction})`;positionPercent.textContent=Math.round(pageFraction*100)+'%';
  let active=-1;
  stages.forEach((stage,i)=>{const rect=stage.getBoundingClientRect(),reached=top+points[i]?.y<=focus;stage.classList.toggle('is-reached',reached);if(reached)active=i;
   if(!media.matches){const shift=Math.max(-9,Math.min(9,(rect.top+rect.height/2-viewport/2)*.025));stage.style.setProperty('--media-shift',shift.toFixed(1)+'px');}
  });
  positionStage.textContent=active<0?'O começo':labels[active];
  if(length){progress.style.strokeDashoffset=String(media.matches?0:length*(1-fraction));const p=progress.getPointAtLength(length*(media.matches?1:fraction));bead.setAttribute('cx',p.x);bead.setAttribute('cy',p.y);bead.style.opacity=fraction>0||media.matches?'1':'0';}
  const scan=document.querySelector('.scan-light');if(scan&&!media.matches){const rect=stages[1].getBoundingClientRect();const scanFraction=Math.max(0,Math.min(1,(viewport-rect.top)/(viewport+rect.height)));scan.style.top=(8+scanFraction*77)+'%';}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(()=>{measureFrame=0;measure();});}
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('is-visible');});},{threshold:.08,rootMargin:'0px 0px -6% 0px'});
 stages.forEach(stage=>observer.observe(stage));
 function preference(){document.body.classList.toggle('has-motion',!media.matches);if(media.matches)stages.forEach(s=>{s.classList.add('is-visible');s.style.setProperty('--media-shift','0px');});queueMeasure();}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',queueMeasure,{passive:true});media.addEventListener('change',preference);
 document.querySelectorAll('img').forEach(img=>{if(!img.complete)img.addEventListener('load',queueMeasure,{once:true});});
 new ResizeObserver(queueMeasure).observe(timeline);document.fonts?.ready.then(queueMeasure);preference();measure();
})();
