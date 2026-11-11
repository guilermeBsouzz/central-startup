'use strict';
const KEY='volta-central-demo-v1';
const PEOPLE=['Ana','Bruno','Clara','Diego','Eva','Felipe','Gabriela'];
const STATES=['Backlog','A fazer','Fazendo','Esperando revisão','Em revisão','Feito','Cancelado','Duplicate'];
const seed=()=>({version:1,person:'Ana',following:Object.fromEntries(PEOPLE.map(p=>[p,['Produto','Negócio']])),read:{},tasks:[
 {id:'DEMO-01',title:'Revisar o fluxo de entrada dos documentos',description:'Conferir a origem e a versão de cada documento antes de disponibilizar o conteúdo à equipe.',owner:'Ana',project:'Produto',state:'Fazendo',priority:'Alta',due:'2026-11-09',source:'doc-1',history:[]},
 {id:'DEMO-02',title:'Consolidar hipóteses do mercado',description:'Separar informações verificadas das hipóteses usadas na análise de mercado.',owner:'Bruno',project:'Negócio',state:'Esperando revisão',priority:'Normal',due:'',source:'doc-2',history:[]},
 {id:'DEMO-03',title:'Conferir o índice de decisões',description:'O índice não lista a proposta de decisão existente. Conferir as duas fontes sem alterar o status por inferência.',owner:'Ana',project:'Produto',state:'A fazer',priority:'Normal',due:'',source:'doc-3',history:[]},
 {id:'DEMO-04',title:'Validar a leitura da equipe no celular',description:'Conferir seleção, contexto e retorno à lista em uma tela pequena.',owner:'Clara',project:'Produto',state:'Fazendo',priority:'Normal',due:'',source:'doc-1',history:[]},
 {id:'DEMO-05',title:'Organizar as fontes do estudo',description:'Identificar versão, responsável e escopo de cada fonte do estudo.',owner:'Diego',project:'Negócio',state:'Feito',priority:'Baixa',due:'',source:'doc-2',history:[]}
],docs:[
 {id:'doc-1',title:'Guia de entrada dos documentos',origin:'GitHub · exemplo',version:'v1 · principal',state:'Vigente',project:'Produto',owner:'Ana',body:'# Guia de entrada\n\nImporte somente os documentos escolhidos para o projeto.\n\n## Origem e versão\nCada documento preserva seu título, responsável, origem e versão. Alterações em revisão aparecem separadas do conteúdo vigente.\n\n## Conferência\nRevise a extração antes de usar um trecho como evidência de uma tarefa.',reference:'docs/guia-de-entrada.md · versão demonstrativa'},
 {id:'doc-2',title:'Estudo de mercado',origin:'GitHub · exemplo',version:'v2 · em revisão',state:'Em revisão',project:'Negócio',owner:'Bruno',body:'# Estudo de mercado\n\nEsta é uma alteração proposta, ainda em revisão.\n\nOs números apresentados precisam de referência e confirmação do responsável antes de serem usados em documentos finais.\n\nA versão vigente continua sendo a v1.',reference:'documents/mercado.md · alteração demonstrativa'},
 {id:'doc-3',title:'Como registrar uma decisão',origin:'Arquivo local · exemplo',version:'v1 · proposta',state:'Proposta',project:'Produto',owner:'Ana',body:'# Registro de decisão\n\nStatus: Proposta\n\n## Contexto\nA equipe precisa encontrar o motivo de uma escolha sem reconstruir conversas antigas.\n\n## Decisão proposta\nRegistrar contexto, alternativas, evidências e responsável.\n\nA existência desta seção não indica que a decisão foi aprovada.',reference:'decisoes/0001-registro.md · versão demonstrativa'}
],events:[
 {id:'event-1',title:'Bruno enviou o estudo para revisão',text:'A proposta atualiza as hipóteses de mercado. A versão anterior continua vigente até a revisão.',owner:'Bruno',project:'Negócio',source:'doc-2',kind:'review',at:'2026-11-09T07:10:00-03:00',supplement:false},
 {id:'event-2',title:'Clara publicou uma atualização do produto',text:'O roteiro de navegação no celular está pronto para uma primeira leitura da equipe.',owner:'Clara',project:'Produto',task:'DEMO-04',kind:'progress',at:'2026-11-09T07:30:00-03:00',supplement:false}
]});
let state,storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(KEY));state=saved?.version===1&&Array.isArray(saved.tasks)&&Array.isArray(saved.docs)&&Array.isArray(saved.events)&&PEOPLE.includes(saved.person)?saved:seed();}catch{state=seed();}
let view='jornal',selected=null,query='',ownerFilter='mine',statusFilter='all',toastTimer;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const matches=(...strings)=>strings.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
const time=s=>new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(s));
const date=s=>s?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(new Date(s+'T12:00:00-03:00')):'Sem prazo';
const stamp=()=>new Date().toISOString();
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;notify('Não foi possível salvar no navegador. Esta sessão continua disponível.');}}
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function tag(value){const color=/revisão/i.test(value)?'orange':value==='Feito'?'green':value==='Proposta'?'yellow':value==='Vigente'?'teal':'';return `<span class="tag ${color}">${esc(value)}</span>`;}
function readKey(id){return `${state.person}:${id}`;}
function hasRead(id){return Boolean(state.read[readKey(id)]);}
function followed(project){return(state.following[state.person]||[]).includes(project);}
function docById(id){return state.docs.find(d=>d.id===id);}
function taskById(id){return state.tasks.find(t=>t.id===id);}
const PERSON_COLORS=['#316950','#237783','#7660A0','#A45C46','#5B743A','#926D34','#805A78'];
function memberStrip(){return `<div class="member-strip-intro"><span>Sete pessoas. <br>Sete olhares.</span><small>Escolha seu contexto</small></div><div class="member-options">${PEOPLE.map((p,i)=>{const count=state.tasks.filter(t=>t.owner===p&&!['Feito','Cancelado','Duplicate'].includes(t.state)).length;return `<button class="member-choice ${p===state.person?'chosen':''}" data-person="${esc(p)}" aria-pressed="${p===state.person}" aria-label="Ver como ${esc(p)}: ${count} tarefas abertas" style="--person-color:${PERSON_COLORS[i]}"><span class="member-orbit" aria-hidden="true"><span>${esc(p[0])}</span></span><span class="member-name">${esc(p)}<small>${count} ${count===1?'tarefa':'tarefas'}</small></span></button>`;}).join('')}</div>`;}
function contextMap(){
 const all=state.tasks.filter(t=>!['Cancelado','Duplicate'].includes(t.state)),tasks=all.slice(0,7),sources=[...new Set(tasks.map(t=>docById(t.source)?t.source:''))];
 const ys=new Map(sources.map((id,i)=>[id,120+i*(sources.length>1?300/(sources.length-1):0)])),color=PERSON_COLORS[PEOPLE.indexOf(state.person)];
 const links=tasks.map((t,i)=>{const own=t.owner===state.person,y=105+i*(tasks.length>1?340/(tasks.length-1):0),sy=ys.get(docById(t.source)?t.source:'');return `<path data-task-edge="${esc(t.id)}" class="context-link ${own?'own-link':''} ${docById(t.source)?'':'missing-link'}" d="M 92 ${sy} C 205 ${sy}, 240 ${y}, 350 ${y}" stroke="${own?color:'#26211E'}"/><a href="#view-content" data-graph-task="${esc(t.id)}" class="map-task" aria-label="Abrir tarefa ${esc(t.title)}, responsável ${esc(t.owner)}"><rect x="337" y="${y-22}" width="215" height="68" class="map-task-hit"/><circle cx="350" cy="${y}" r="${own?8:5}" fill="${own?color:'#FAF6F3'}" stroke="#26211E"/><text x="369" y="${y-4}" class="map-person">${esc(t.owner)}</text><text x="369" y="${y+14}" class="map-task-name">${esc(t.title.length>23?t.title.slice(0,21)+'…':t.title)}</text><text x="369" y="${y+30}" class="map-task-state">${esc(t.state)}</text></a>`;}).join('');
 const nodes=sources.map(id=>{const d=docById(id),y=ys.get(id);return `<g class="map-source"><rect x="30" y="${y-20}" width="62" height="41"/><path d="M 43 ${y-7} H 78 M 43 ${y} H 78 M 43 ${y+7} H 66"/><text x="30" y="${y+43}" class="map-source-name">${esc(d?d.title.split(' ').slice(0,3).join(' '):'Sem documento')}</text><text x="30" y="${y+60}" class="map-source-state">${esc(d?d.state:'Contexto a vincular')}</text></g>`;}).join('');
 return `<figure class="context-map"><div class="map-heading"><span>Como o trabalho se conecta</span><span class="map-key"><i style="background:${color}"></i>${esc(state.person)}</span></div>${tasks.length?`<svg viewBox="0 0 560 530" role="group" aria-label="Mapa da equipe: ${tasks.length} tarefas e ${sources.length} pontos de contexto"><text x="30" y="42" class="map-column-label">Documentos</text><text x="350" y="42" class="map-column-label">Tarefas e responsáveis</text>${links}${nodes}</svg>`:'<p class="empty">Crie uma tarefa para começar a conectar o trabalho.</p>'}<figcaption><span>${tasks.length}${all.length>tasks.length?' de '+all.length:''} tarefas no mapa</span><span>${sources.includes('')?'Tracejado: documento não vinculado.':'Cada linha é um vínculo documental.'}</span></figcaption></figure>`;
}
function feedItem(id,title,text,meta,kind){return `<button class="feed-item ${selected?.id===id?'selected':''} ${hasRead(id)?'read-item':''}" data-open="${kind}" data-id="${esc(id)}">${hasRead(id)?'<span class="read-icon">Lido ✓</span>':''}<span class="item-title">${esc(title)}</span>${text?`<p>${esc(text)}</p>`:''}<span class="meta">${meta}</span></button>`;}
function render(){
 const names={jornal:'Jornal',tarefas:'Tarefas',conhecimento:'Conhecimento',fontes:'Fontes'};
 document.querySelectorAll('.nav').forEach(n=>{n.classList.toggle('active',n.dataset.view===view);n.setAttribute('aria-current',n.dataset.view===view?'page':'false');});
 $('#persona').value=state.person;$('#follow-product').checked=followed('Produto');$('#follow-business').checked=followed('Negócio');
 $('#breadcrumb').textContent='Equipe / '+names[view];
 document.body.dataset.view=view;
 $('#greeting').textContent=view==='jornal'?`Bom dia, ${state.person}.`:'Volta / central da equipe';
 $('#page-title').textContent={jornal:'O trabalho ganha contexto.',tarefas:'Trabalho em movimento.',conhecimento:'O que a equipe sabe.',fontes:'De onde vem o contexto.'}[view];
 $('#page-description').textContent={jornal:'O que mudou nos projetos, o que ainda precisa de revisão e os próximos passos que dependem de você.',tarefas:'Responsáveis, estados e contexto para dar continuidade ao que precisa acontecer.',conhecimento:'Documentos de referência, propostas em revisão e as decisões que sustentam o trabalho.',fontes:'Cada informação tem uma origem. Aqui, você acompanha o que está disponível e o que ainda falta.'}[view];
 $('#hero-graphic').innerHTML=view==='jornal'?contextMap():'';
 $('#member-strip').innerHTML=memberStrip();
 $('#view-content').innerHTML=view==='jornal'?journal():view==='tarefas'?tasks():view==='conhecimento'?knowledge():sources();
}
function journal(){
 const mine=state.tasks.filter(t=>t.owner===state.person&&!['Feito','Cancelado','Duplicate'].includes(t.state)&&matches(t.title,t.description,t.project));
 const events=state.events.filter(e=>!e.supplement&&followed(e.project)&&matches(e.title,e.text));
 const updates=state.events.filter(e=>e.supplement&&(e.owner===state.person||followed(e.project))&&matches(e.title,e.text));
 const docs=state.docs.filter(d=>followed(d.project)&&matches(d.title,d.body));
 const priorities=mine.map(t=>feedItem(t.id,t.title,t.description,`${tag(t.state)}<span>${esc(t.id)} · ${esc(t.project)}</span><span>${esc(date(t.due))}</span>`,'task')).join('');
 const colleagues=events.map(e=>feedItem(e.id,e.title,e.text,`<span>${esc(e.project)} · ${time(e.at)}</span>${tag(e.kind==='review'?'Em revisão':'Atualização')}`,'event')).join('');
 const documentItems=docs.slice(0,3).map(d=>feedItem(d.id,d.title,d.state==='Proposta'?'Proposta registrada. Aprovação ainda não confirmada.':d.state==='Em revisão'?'Existe uma alteração proposta, separada da versão vigente.':'Documento de referência para o trabalho da equipe.',`${tag(d.state)}<span>${esc(d.origin)}</span>`,'doc')).join('');
 return `<div class="dashboard"><section class="edition" aria-label="Jornal personalizado"><div class="edition-band"><span>Volta / edição pessoal</span><span>Corte de exemplo · 08:00 BRT</span></div><div class="edition-body"><div class="edition-intro"><div><h2>Uma equipe, em contexto.</h2><p>Seu trabalho, o que avançou por perto e as fontes que ajudam a seguir.</p></div><span class="sun-icon" aria-hidden="true">☀</span></div><h3 class="section-title">Suas tarefas agora <small>${mine.length} ${mine.length===1?'tarefa':'tarefas'}</small></h3>${priorities||'<div class="empty">Nenhuma tarefa neste recorte. Crie uma tarefa ou ajuste a busca.</div>'}<h3 class="section-title">Perto do seu trabalho <small>Projetos acompanhados</small></h3>${colleagues||'<div class="empty">Sem atualizações neste recorte.</div>'}<h3 class="section-title">Conhecimento em circulação <small>Com origem</small></h3>${documentItems||'<div class="empty">Nenhum documento neste recorte.</div>'}${updates.length?`<section class="supplement"><h3 class="section-title">Após o corte <small>${updates.length} ${updates.length===1?'atualização':'atualizações'}</small></h3>${updates.map(e=>feedItem(e.id,e.title,e.text,`<span>${esc(e.project)} · ${time(e.at)}</span>${tag('Atualização local')}`,'event')).join('')}</section>`:''}</div></section><aside class="context-column" aria-label="Contexto selecionado">${selected?detail(selected):defaultContext(mine)}</aside></div>`;
}
function defaultContext(mine){const review=state.docs.filter(d=>['Proposta','Em revisão','Validação pendente'].includes(d.state)&&followed(d.project));return `<section class="context-block"><div class="context-heading">Com você, agora <span>${mine.length}</span></div><h2>O próximo passo tem contexto.</h2><p>Abra uma tarefa para conferir sua origem, editar os campos ou contar o que avançou.</p>${mine.slice(0,3).map(t=>`<div class="focus-task"><span aria-hidden="true">○</span><div><button data-open="task" data-id="${esc(t.id)}">${esc(t.title)}</button><small>${esc(t.id)} · ${esc(t.state)}</small></div></div>`).join('')||'<p>Nenhuma tarefa neste recorte.</p>'}</section><section class="context-block note-block"><div class="context-heading">Antes de tomar como certo <span>${review.length}</span></div><h2>Nem toda versão é definitiva.</h2><p>${review.length} ${review.length===1?'documento pede':'documentos pedem'} revisão no seu recorte.</p>${review.map(d=>`<button class="review-link" data-open="doc" data-id="${esc(d.id)}"><span>${esc(d.title)}</span>${tag(d.state)}</button>`).join('')}</section>`;}
function tasks(){
 const filtered=state.tasks.filter(t=>(ownerFilter==='all'||t.owner===(ownerFilter==='mine'?state.person:ownerFilter))&&(statusFilter==='all'||t.state===statusFilter)&&matches(t.title,t.id,t.description,t.project,t.owner));
 return `<div class="filters"><label>Responsável <select id="owner-filter"><option value="mine" ${ownerFilter==='mine'?'selected':''}>Minhas tarefas</option><option value="all" ${ownerFilter==='all'?'selected':''}>Toda a equipe</option>${PEOPLE.map(p=>`<option ${ownerFilter===p?'selected':''}>${esc(p)}</option>`).join('')}</select></label><label>Estado <select id="status-filter"><option value="all">Todos os estados</option>${STATES.map(s=>`<option ${statusFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label><span class="result-count">${filtered.length} ${filtered.length===1?'tarefa encontrada':'tarefas encontradas'}</span></div><div class="table-wrap"><table class="task-table"><thead><tr><th>Tarefa</th><th class="table-state">Estado</th><th class="owner-cell">Responsável</th><th>Prazo</th></tr></thead><tbody>${filtered.map(t=>`<tr><td><span class="task-id">${esc(t.id)} · ${esc(t.project)}</span><button data-open="task" data-id="${esc(t.id)}">${esc(t.title)}</button></td><td>${tag(t.state)}</td><td class="owner-cell">${esc(t.owner)}</td><td>${esc(date(t.due))}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">Nenhuma tarefa encontrada. Ajuste os filtros ou crie uma tarefa.</td></tr>'}</tbody></table></div><p class="local-note">As tarefas deste protótipo são locais. Nenhum card é criado no Linear ou no GitHub.</p>`;
}
function knowledge(){const docs=state.docs.filter(d=>matches(d.title,d.body,d.project,d.origin));return `<div class="document-grid"><section class="doc-list" aria-label="Documentos">${docs.map((d,i)=>`<button class="feed-item ${selected?.id===d.id?'selected':''}" data-open="doc" data-id="${esc(d.id)}"><span class="doc-number">${String(i+1).padStart(2,'0')} / ${esc(d.project)}</span><span class="item-title">${esc(d.title)}</span><p>${esc(d.origin)} · ${esc(d.version)}</p><span class="meta">${tag(d.state)}<span>Responsável: ${esc(d.owner)}</span></span></button>`).join('')||'<div class="empty">Nenhum documento encontrado. Importe um arquivo .md ou .txt.</div>'}</section><aside class="context-column">${selected?.kind==='doc'?detail(selected):'<section class="context-block"><h2>O documento e o seu contexto.</h2><p>Selecione uma fonte para ler o conteúdo, conferir sua versão e abrir as tarefas relacionadas.</p><button class="secondary" data-import>Importar .md ou .txt</button></section>'}</aside></div>`;}
function sources(){return `<section class="source-card"><h2>GitHub ${tag('Exemplo')}</h2><p>Documentos versionados e alterações em revisão. As fontes desta demonstração são fictícias; o protótipo não consulta sua conta.</p><ul><li>Conteúdo vigente e propostas em contextos separados.</li><li>A tarefa pode citar um documento para preservar contexto.</li><li>Uma versão é diferente de uma atualização de progresso.</li></ul><button class="secondary" data-nav="conhecimento">Explorar documentos</button></section><section class="source-card"><h2>Linear ${tag('Exemplo')}</h2><p>Os estados refletem o fluxo pesquisado, incluindo revisão e cancelamento. Aqui, as tarefas são salvas somente no navegador.</p><button class="secondary" data-nav="tarefas">Explorar tarefas</button></section><section class="source-card"><h2>Arquivos locais ${tag('Disponível no protótipo')}</h2><p>Importe Markdown ou texto de até 1 MB. O conteúdo é lido e salvo neste navegador, sem envio externo. PDF, Word e imagens ainda não são extraídos.</p><button class="primary" data-import>Importar arquivo</button></section>`;}
function detail(selection){
 let body='';const {kind,id}=selection;
 if(kind==='task'){
  const t=taskById(id);if(!t)return '';
  const doc=docById(t.source),own=t.owner===state.person,updates=state.events.filter(e=>e.task===id);
  body=`<span class="tag outline">${esc(t.id)} · ${esc(t.project)}</span><h2>${esc(t.title)}</h2><div class="meta">${tag(t.state)}<span>${esc(t.priority)} prioridade</span></div><p class="description">${esc(t.description||'Sem descrição.')}</p><ul class="detail-list"><li>Responsável: ${esc(t.owner)}</li><li>Prazo: ${esc(date(t.due))}</li><li>Fonte: tarefa local de demonstração</li></ul>${doc?`<h3 class="section-title">Documento de contexto</h3><button class="feed-item" data-open="doc" data-id="${esc(doc.id)}">${esc(doc.title)}<p>${esc(doc.version)}</p></button>`:''}<div class="detail-actions"><button class="primary" data-edit="${esc(id)}" ${own?'':'disabled'}>Editar tarefa</button><button class="secondary" data-update="${esc(id)}" ${own?'':'disabled'}>Publicar atualização</button></div>${!own?'<p class="form-note">Somente o responsável edita nesta demonstração. Troque o perfil no topo para explorar esse fluxo.</p>':''}<h3 class="section-title">Atualizações publicadas <small>${updates.length}</small></h3>${updates.map(e=>`<p>${esc(e.text)}<br><small>${esc(e.owner)} · ${time(e.at)}</small></p>`).join('')||'<p>Nenhuma atualização publicada.</p>'}<h3 class="section-title">Histórico de campos <small>${t.history.length}</small></h3><ul class="detail-list">${t.history.slice(-4).reverse().map(h=>`<li>${esc(h.actor)} · ${time(h.at)}<br>${esc(h.summary)}</li>`).join('')||'<li>Nenhuma alteração de campos registrada.</li>'}</ul>`;
 }else if(kind==='doc'){
  const d=docById(id);if(!d)return '';const linked=state.tasks.filter(t=>t.source===id);
  body=`<div class="meta">${tag(d.state)}<span>${esc(d.project)}</span></div><h2 class="file-heading">${esc(d.title)}</h2><p>${esc(d.origin)}<br>${esc(d.version)} · ${esc(d.owner)}</p>${d.state==='Em revisão'?'<p class="tag orange">Alteração proposta. Não substitui a versão vigente.</p>':''}${d.state==='Proposta'?'<p class="tag yellow">Aprovação não confirmada</p>':''}<div class="doc-body">${esc(d.body)}</div><h3 class="section-title">Origem registrada</h3><p class="form-note">${esc(d.reference)}</p><h3 class="section-title">Tarefas relacionadas <small>${linked.length}</small></h3>${linked.map(t=>`<button class="feed-item" data-open="task" data-id="${esc(t.id)}">${esc(t.title)}<p>${esc(t.owner)} · ${esc(t.state)}</p></button>`).join('')||'<p>Nenhuma tarefa vinculada.</p>'}`;
 }else{
  const e=state.events.find(x=>x.id===id);if(!e)return '';body=`<div class="meta">${tag(e.supplement?'Após o corte':'Edição original')}<span>${esc(e.project)}</span></div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p>${e.next?`<h3 class="section-title">Próximo passo</h3><p>${esc(e.next)}</p>`:''}<p class="form-note">Publicado por ${esc(e.owner)} · ${time(e.at)} BRT</p>${e.task?`<button class="secondary" data-open="task" data-id="${esc(e.task)}">Abrir tarefa de origem</button>`:''}${e.source?`<button class="secondary" data-open="doc" data-id="${esc(e.source)}">Conferir documento de origem</button>`:''}`;
 }
 return `<section class="context-block context-detail"><div class="context-heading"><span>Contexto / ${kind==='task'?'tarefa':kind==='doc'?'documento':'atualização'}</span><button class="icon-button" data-close-context aria-label="Fechar contexto">×</button></div>${body}<div class="detail-actions"><button class="secondary small-button" data-read="${esc(id)}">${hasRead(id)?'Marcar como não lido':'Marcar como lido'}</button></div></section>`;
}
function openDetail(kind,id){selected={kind,id};if(view==='jornal'||view==='conhecimento'){render();if(innerWidth<851){$('#dialog-detail').innerHTML=detail(selected);$('#detail-dialog').showModal();}}else{$('#dialog-detail').innerHTML=detail(selected);$('#detail-dialog').showModal();}}
let returnFocus=null;
function openTask(id){
 const t=id?taskById(id):null;if(t&&t.owner!==state.person)return notify('Esta tarefa é de outro responsável.');
 returnFocus=document.activeElement;$('#task-form').reset();$('#task-id').value=t?.id||'';$('#task-dialog-title').textContent=t?'Editar tarefa':'Criar tarefa';
 $('#task-owner').innerHTML=PEOPLE.map(p=>`<option ${p===(t?.owner||state.person)?'selected':''}>${esc(p)}</option>`).join('');
 $('#task-state').innerHTML=STATES.map(s=>`<option ${s===(t?.state||'A fazer')?'selected':''}>${esc(s)}</option>`).join('');
 $('#task-source').innerHTML='<option value="">Sem documento</option>'+state.docs.map(d=>`<option value="${esc(d.id)}" ${d.id===t?.source?'selected':''}>${esc(d.title)}</option>`).join('');
 if(t){$('#task-title').value=t.title;$('#task-description').value=t.description;$('#task-project').value=t.project;$('#task-priority').value=t.priority;$('#task-due').value=t.due;}
 $('#task-dialog').showModal();$('#task-title').focus();
}
function openUpdate(id){const t=taskById(id);if(!t||t.owner!==state.person)return;returnFocus=document.activeElement;$('#update-form').reset();$('#update-task-id').value=id;$('#update-context').textContent=t.id+' · '+t.title;$('#update-dialog').showModal();$('#update-text').focus();}
document.addEventListener('click',e=>{
 const person=e.target.closest('[data-person]');if(person){state.person=person.dataset.person;selected=null;save();render();document.querySelector(`[data-person="${CSS.escape(state.person)}"]`)?.focus();return;}
 const graph=e.target.closest('[data-graph-task]');if(graph){e.preventDefault();selected={kind:'task',id:graph.dataset.graphTask};render();$('#dialog-detail').innerHTML=detail(selected);$('#detail-dialog').showModal();return;}
 const nav=e.target.closest('.nav[data-view],[data-nav]');if(nav){e.preventDefault();view=nav.dataset.view||nav.dataset.nav;selected=null;render();return;}
 const open=e.target.closest('[data-open]');if(open){if($('#detail-dialog').open)$('#detail-dialog').close();openDetail(open.dataset.open,open.dataset.id);return;}
 const edit=e.target.closest('[data-edit]');if(edit){if($('#detail-dialog').open)$('#detail-dialog').close();openTask(edit.dataset.edit);return;}
 const update=e.target.closest('[data-update]');if(update){if($('#detail-dialog').open)$('#detail-dialog').close();openUpdate(update.dataset.update);return;}
 const read=e.target.closest('[data-read]');if(read){state.read[readKey(read.dataset.read)]=!hasRead(read.dataset.read);save();render();if($('#detail-dialog').open)$('#dialog-detail').innerHTML=detail(selected);notify('É apenas uma marca de leitura. A tarefa não mudou.');return;}
 if(e.target.closest('[data-close-context]')){selected=null;$('#detail-dialog').close();render();return;}
 if(e.target.closest('[data-import]'))$('#file-input').click();
 if(e.target.closest('.close-dialog'))e.target.closest('dialog').close();
});
$('#task-form').addEventListener('submit',e=>{
 e.preventDefault();const id=$('#task-id').value,old=taskById(id),title=$('#task-title').value.trim();if(!title)return; if(old&&old.owner!==state.person)return notify('Esta tarefa é de outro responsável.');
 const data={title,description:$('#task-description').value.trim(),owner:$('#task-owner').value,project:$('#task-project').value,state:$('#task-state').value,priority:$('#task-priority').value,due:$('#task-due').value,source:$('#task-source').value};
 if(old){const changes=Object.keys(data).filter(k=>old[k]!==data[k]);if(changes.length){old.history.push({actor:state.person,at:stamp(),summary:changes.map(k=>`${k}: ${old[k]||'—'} → ${data[k]||'—'}`).join('; ')});Object.assign(old,data);}}
 else{data.id='LOCAL-'+Date.now().toString(36).toUpperCase();data.history=[];state.tasks.unshift(data);}
 save();$('#task-dialog').close();selected={kind:'task',id:old?.id||data.id};render();notify(storageAvailable?'Tarefa salva neste navegador. Nenhuma atualização de progresso foi publicada.':'Tarefa disponível nesta sessão; armazenamento indisponível.');
});
$('#update-form').addEventListener('submit',e=>{
 e.preventDefault();const t=taskById($('#update-task-id').value);if(!t||t.owner!==state.person)return;const text=$('#update-text').value.trim(),next=$('#update-next').value.trim();if(!text||!next)return;
 state.events.push({id:'local-event-'+Date.now(),title:`${state.person} publicou uma atualização`,text,next,owner:state.person,project:t.project,task:t.id,kind:'progress',at:stamp(),supplement:true});save();$('#update-dialog').close();view='jornal';selected=null;render();notify('Atualização publicada localmente em “Após o corte”.');
});
$('#persona').innerHTML=PEOPLE.map(p=>`<option>${esc(p)}</option>`).join('');
$('#persona').addEventListener('change',e=>{state.person=e.target.value;selected=null;save();render();});
$('#search').addEventListener('input',e=>{query=e.target.value;render();});
$('#new-task').addEventListener('click',()=>openTask());
$('#import-button').addEventListener('click',()=>$('#file-input').click());
function highlightMap(id){const map=$('.context-map');if(!map)return;map.classList.toggle('is-inspecting',Boolean(id));map.querySelectorAll('[data-task-edge]').forEach(edge=>edge.classList.toggle('highlighted',edge.dataset.taskEdge===id));}
document.addEventListener('pointerover',e=>{const task=e.target.closest('[data-graph-task]');if(task)highlightMap(task.dataset.graphTask);});
document.addEventListener('pointerout',e=>{const task=e.target.closest('[data-graph-task]');if(task&&!task.contains(e.relatedTarget))highlightMap(null);});
document.addEventListener('focusin',e=>{const task=e.target.closest('[data-graph-task]');if(task)highlightMap(task.dataset.graphTask);});
document.addEventListener('focusout',e=>{if(e.target.closest('[data-graph-task]'))highlightMap(null);});
document.addEventListener('change',e=>{
 if(e.target.id==='owner-filter'){ownerFilter=e.target.value;render();}
 if(e.target.id==='status-filter'){statusFilter=e.target.value;render();}
 if(['follow-product','follow-business'].includes(e.target.id)){state.following[state.person]=[$('#follow-product').checked?'Produto':null,$('#follow-business').checked?'Negócio':null].filter(Boolean);save();render();}
});
$('#file-input').addEventListener('change',async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 if(!/\.(md|txt)$/i.test(file.name))return notify('Formato não suportado neste protótipo. Use .md ou .txt.');
 if(file.size>1024*1024)return notify('O limite deste protótipo é 1 MB por arquivo.');
 try{const body=await file.text();if(!body.trim())return notify('O arquivo está vazio. Nenhum documento foi importado.');
 const duplicate=state.docs.find(d=>d.fileName===file.name&&d.body===body);if(duplicate){view='conhecimento';selected={kind:'doc',id:duplicate.id};render();return notify('Este arquivo já foi importado. Documento existente aberto.');}
 const importedAt=stamp();const doc={id:'local-doc-'+Date.now(),title:body.match(/^#\s+(.+)$/m)?.[1]||file.name,origin:'Arquivo local',version:'Cópia importada · '+new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(new Date(importedAt)),state:'Validação pendente',project:'Produto',owner:state.person,body,fileName:file.name,importedAt,reference:file.name+' · cópia local; data da origem não informada'};
 state.docs.push(doc);save();view='conhecimento';selected={kind:'doc',id:doc.id};render();notify('Arquivo importado neste navegador. Revise o conteúdo antes de usá-lo.');
 }catch{notify('Não foi possível ler o arquivo. Tente um arquivo .md ou .txt válido.');}
});
$('#reset').addEventListener('click',()=>{if(!confirm('Restaurar os dados de demonstração? As tarefas, leituras e importações locais serão removidas.'))return;state=seed();view='jornal';selected=null;query='';$('#search').value='';save();render();notify('Demonstração restaurada.');});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{if(document.querySelector('dialog[open]'))return;if(d.id==='detail-dialog'&&selected){document.querySelector(`#view-content [data-open][data-id="${CSS.escape(selected.id)}"]`)?.focus();}else if(returnFocus?.isConnected)returnFocus.focus();});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
document.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='/'){e.preventDefault();$('#search').focus();}
 if(['1','2','3','4'].includes(e.key)){view=['jornal','tarefas','conhecimento','fontes'][Number(e.key)-1];selected=null;render();}
});
render();
