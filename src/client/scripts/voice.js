'use strict';
(()=>{
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 let active=null;
 const microphone='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>';
 function controls(name,label){return `<div class="voice-control" data-voice-field="${name}"><button type="button" data-voice-target="${name}" ${Recognition?'':'disabled'} aria-pressed="false">${microphone}<span>${Recognition?'Ditar '+label:'Ditado indisponível'}</span></button><span class="voice-state" role="status"></span><p class="voice-preview"></p></div>`;}
 function stop(abort=false){if(active){const run=active;active=null;if(abort)run.accepting=false;try{abort?run.engine.abort():run.engine.stop();}catch{try{run.engine.abort();}catch{}}run.button.setAttribute('aria-pressed','false');run.button.querySelector('span').textContent=run.label;run.box.classList.remove('is-listening');if(abort)run.state.textContent='Ditado encerrado.';}}
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-voice-target]');if(!button||!Recognition)return;
  if(active?.button===button){stop();return;}
  stop(true);const form=button.closest('form'),field=form?.elements.namedItem(button.dataset.voiceTarget);if(!(field instanceof HTMLTextAreaElement))return;
  const consent=form.querySelector('[name="voiceConsent"]');if(!consent?.checked){if(consent?.closest('details'))consent.closest('details').open=true;const message=form.querySelector('[data-voice-consent-status]');if(message)message.textContent='Marque a autorização de ditado antes de ativar o microfone.';consent?.focus();return;}
  const box=button.closest('.voice-control'),state=box.querySelector('.voice-state'),preview=box.querySelector('.voice-preview'),label=button.querySelector('span').textContent;
  const engine=new Recognition(),run={engine,button,box,state,label,accepting:true};engine.lang='pt-BR';engine.interimResults=true;engine.continuous=true;let lastFinal=-1;
  active=run;state.textContent='Conectando ao reconhecimento…';preview.textContent='';
  engine.onstart=()=>{if(active!==run){engine.abort();return;}button.setAttribute('aria-pressed','true');button.querySelector('span').textContent='Parar ditado';box.classList.add('is-listening');state.textContent='Ouvindo. Toque em parar para encerrar.';};
  engine.onresult=event=>{
   if(!run.accepting||!field.isConnected||!form.closest('dialog')?.open)return;
   let interim='';
   for(let i=event.resultIndex;i<event.results.length;i++){
    const result=event.results[i],text=result[0].transcript.trim();
    if(result.isFinal&&i>lastFinal){lastFinal=i;if(text){const separator=field.value&&!/\s$/.test(field.value)?' ':'';field.value+=separator+text;field.dispatchEvent(new Event('input',{bubbles:true}));}}
    else if(!result.isFinal)interim+=text+' ';
   }preview.textContent=interim;
  };
  engine.onerror=event=>{state.textContent=({'not-allowed':'Microfone não autorizado. Digite ou altere a permissão do navegador.','audio-capture':'Nenhum microfone disponível.','network':'Reconhecimento sem conexão. O texto digitado foi preservado.','no-speech':'Nenhuma fala reconhecida. Tente novamente.','aborted':'Ditado encerrado.'})[event.error]||'Não foi possível reconhecer a fala. Você pode continuar digitando.';};
  engine.onend=()=>{if(active===run)active=null;button.setAttribute('aria-pressed','false');button.querySelector('span').textContent=label;box.classList.remove('is-listening');preview.textContent='';if(state.textContent.startsWith('Ouvindo')||state.textContent.startsWith('Conectando'))state.textContent='Ditado encerrado. Revise antes de publicar.';};
  try{engine.start();}catch{active=null;state.textContent='Ditado indisponível nesta sessão. Continue digitando.';}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(true);});
 addEventListener('pagehide',()=>stop(true));
 window.VoltaVoice={controls,supported:!!Recognition,stop};
})();
