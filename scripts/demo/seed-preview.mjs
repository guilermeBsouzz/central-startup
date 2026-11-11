import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const base=new URL(process.env.PREVIEW_URL||'http://127.0.0.1:4176');
if(base.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(base.hostname))throw new Error('A carga fictícia só pode acessar uma prévia em loopback.');
const health=await fetch(new URL('/health',base));if(!health.ok||(await health.json()).mode!=='preview')throw new Error('O destino não é uma prévia. Nenhum registro foi inserido.');
const manifestPath=resolve('.data/demo-preview-v1.json');await mkdir(dirname(manifestPath),{recursive:true});
let manifest;try{manifest=JSON.parse(await readFile(manifestPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;manifest={batch:'volta-simulation-v1',anchor:new Date().toISOString(),origin:base.origin,records:{}};}
if(manifest.origin!==base.origin)throw new Error('Este lote pertence a outra origem. Use o mesmo PREVIEW_URL.');
await writeFile(manifestPath,JSON.stringify(manifest,null,2));
const marker='[Cenário fictício]',members=['jose-isaias','clara-prado','amanda','julia-alves','igor','guilherme','jose-roberto'];
const names=['José Isaías','Clara Prado','Amanda','Júlia Alves','Igor','Guilherme','José Roberto'];
const anchor=new Date(manifest.anchor),day=offset=>{const d=new Date(anchor);d.setUTCDate(d.getUTCDate()+offset);return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);};
const when=(offset,hour=14)=>day(offset)+`T${String(hour).padStart(2,'0')}:00:00-03:00`;
const sessions=new Map();
for(const id of members){
 const response=await fetch(new URL('/api/session/preview',base),{method:'POST',headers:{'Content-Type':'application/json',Origin:base.origin},body:JSON.stringify({memberId:id})});
 if(!response.ok)throw new Error('Não foi possível abrir sessão de simulação.');
 const cookie=response.headers.get('set-cookie').split(';')[0];const session=await(await fetch(new URL('/api/session',base),{headers:{cookie}})).json();sessions.set(id,{cookie,csrf:session.csrfToken});
}
async function api(member,path,method='GET',data,key){
 const session=sessions.get(member);const r=await fetch(new URL(path,base),{method,headers:{cookie:session.cookie,'x-csrf-token':session.csrf,'Content-Type':'application/json',Origin:base.origin,...(key?{'Idempotency-Key':manifest.batch+':'+key}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});
 const result=await r.json();if(!r.ok)throw new Error(`${method} ${path}: ${r.status} ${result.error}`);return result;
}
async function create(member,path,body,key){const result=await api(member,path,'POST',body,key);manifest.records[key]=result.id;await writeFile(manifestPath,JSON.stringify(manifest,null,2));return result;}
// These assignments are fictional scenarios, not the members' actual roles or commitments.
const briefs=[
 [['Integrar leitura dos sensores',65,'Fazendo','Tecnologia','Leitura da bancada responde ao roteiro de teste.','Comparar os sinais com o registro manual.'],['Avaliar erros do classificador',35,'Fazendo','Tecnologia','Amostras sintéticas foram separadas por material.','Revisar os casos com baixa confiança.'],['Especificar contrato do IsaiasOS',0,'A fazer','Tecnologia','','Definir entradas e saídas com o mantenedor.']],
 [['Revisar termo do piloto',80,'Em revisão','Operação','A minuta fictícia recebeu observações da equipe.','Conferir os pontos em aberto antes da aprovação.'],['Preparar apresentação para parceiros',45,'Fazendo','Negócio','A narrativa do piloto e o roteiro visual estão montados.','Ensaiar a apresentação com o time.'],['Organizar revisão de documentos',20,'Fazendo','Operação','Os documentos de exemplo foram classificados por assunto.','Validar a lista de responsáveis pela revisão.']],
 [['Consolidar fluxo de caixa do piloto',70,'Fazendo','Finanças','A estrutura de entradas e saídas simuladas está organizada.','Revisar as premissas com Júlia.'],['Comparar cotações dos componentes',100,'Feito','Finanças','O comparativo fictício foi revisado e concluído.','Arquivar a versão revisada.'],['Organizar despesas de prototipagem',15,'Fazendo','Finanças','As categorias de despesas foram definidas.','Preencher os exemplos de comprovação.']],
 [['Construir cenário de custos',60,'Fazendo','Finanças','Os custos fictícios foram separados entre fixos e variáveis.','Testar um segundo cenário de utilização.'],['Avaliar chamada de inovação',30,'Fazendo','Negócio','Os critérios da oportunidade simulada foram organizados.','Comparar o escopo com o roteiro do piloto.'],['Planejar próxima rodada do piloto',0,'A fazer','Negócio','','Propor critérios de entrada para a próxima rodada.']],
 [['Validar montagem da bancada',50,'Fazendo','Operação','Metade do checklist de montagem foi percorrida.','Repetir o ensaio com materiais de formatos diferentes.'],['Preparar roteiro de coleta',25,'Fazendo','Operação','O roteiro inicial e os pontos de observação estão definidos.','Revisar a sequência com Guilherme.'],['Concluir checklist de segurança do ensaio',100,'Feito','Operação','O checklist de exemplo foi completado para esta simulação.','Revisar novamente antes de qualquer ensaio real.']],
 [['Testar experiência da central',75,'Fazendo','Produto','A navegação principal e os formulários foram percorridos.','Validar o percurso com os sete perfis.'],['Ajustar acessibilidade dos formulários',40,'Fazendo','Produto','Contraste e ordem de foco foram revisados em uma primeira rodada.','Testar ampliação e leitura por teclado.'],['Documentar navegação e estados',20,'Fazendo','Produto','Os principais caminhos foram listados.','Adicionar os estados de erro e recuperação.']],
 [['Validar controle do protótipo',55,'Fazendo','Tecnologia','A sequência básica respondeu ao ensaio sintético.','Repetir o teste após a calibração.'],['Calibrar sensores da bancada',35,'Fazendo','Tecnologia','A primeira série de medições fictícias foi organizada.','Conferir a repetibilidade com José Isaías.'],['Testar transmissão dos registros',100,'Feito','Tecnologia','O roteiro de envio e recebimento fictício foi concluído.','Guardar os exemplos para uma regressão futura.']]
];
const tasks=[];
for(let slot=0;slot<3;slot++)for(let i=0;i<members.length;i++){
 const [title,progress,status,project,narrative,next]=briefs[i][slot],key=`task:${i}:${slot}`;
 const created=await create(members[i],'/api/tasks',{title,description:`${marker} Dados artificiais para explorar a interface. Não representa atribuição, compromisso, resultado ou avaliação real de ${names[i]}.\n\nObjetivo do exemplo: ${next}`,owner_id:members[i],project,priority:slot===0?'Alta':slot===1?'Média':'Baixa',due_date:day(slot===0?1:slot===1?3:7)},key);
 tasks.push({id:created.id,owner:members[i],i,slot,progress,status,narrative,next,key});
}
for(const phase of [1,2])for(const task of tasks){if(!task.progress)continue;
 const progress=phase===1?Math.max(5,Math.floor(task.progress*.4)):task.progress;
 await create(task.owner,`/api/tasks/${task.id}/progress`,{version:phase,progress,narrative:phase===1?`${marker} Roteiro inicial definido e primeiras verificações registradas.`:`${marker} ${task.narrative}`,next_step:task.next,status:phase===1?'Fazendo':task.status},task.key+':report:'+phase);
}
for(let i=0;i<members.length;i++){
 const target=tasks.find(t=>t.i===(i+1)%7&&t.slot===0);
 await create(members[i],'/api/comments',{task_id:target.id,text:`${marker} @${names[(i+1)%7]}, consigo revisar esta etapa antes do próximo ensaio. Você pode compartilhar os pontos em aberto?`,priority:i%3===0?'Alta':i%3===1?'Média':'Baixa',mentions:[target.owner]},`comment:${i}`);
 const own=tasks.find(t=>t.i===i&&t.slot===0),recipient=members[(i+1)%7];
 const help=await create(members[i],'/api/help',{task_id:own.id,text:`${marker} @${names[(i+1)%7]}, preciso de uma segunda leitura para validar o próximo passo: ${own.next}`,priority:i%2===0?'Alta':'Média',recipients:[recipient]},`help:${i}`);
 if(i<3){const state=await api(recipient,'/api/state');const current=state.helpRequests.find(h=>h.id===help.id);if(current.version===1&&current.status==='Aberto')await api(recipient,'/api/help/'+help.id,'PATCH',{version:1,status:'Em atendimento'});}
}
const publications=[
 {type:'evento',title:'Simulação · Ensaio integrado do piloto',description:`${marker} Encontro fictício para revisar montagem, coleta e interface. Traga os pontos em aberto do seu roteiro.`,priority:'Alta',starts_at:when(1,14),ends_at:when(1,15),location:'Bancada de prototipagem — cenário de demonstração'},
 {type:'evento',title:'Simulação · Revisão de produto',description:`${marker} Conversa de exemplo sobre os testes da central e acessibilidade.`,priority:'Média',starts_at:when(3,10),ends_at:when(3,11),location:'Sala da equipe — cenário de demonstração'},
 {type:'evento',title:'Simulação · Troca de aprendizados',description:`${marker} Espaço fictício para compartilhar dúvidas e aprendizados da rodada.`,priority:'Baixa',starts_at:when(5,16),ends_at:when(5,17),location:'Encontro de equipe — cenário de demonstração'},
 {type:'oportunidade',title:'Simulação · Chamada de inovação circular',description:`${marker} Oportunidade inventada para demonstrar prioridade e prazo. Não há edital real ou inscrição disponível.`,priority:'Alta',deadline:when(10,18)},
 {type:'oportunidade',title:'Simulação · Parceria com laboratório',description:`${marker} Cenário fictício de uma parceria para ensaios; não representa acordo com instituição.`,priority:'Média',deadline:when(14,18)},
 {type:'oportunidade',title:'Simulação · Mostra de protótipos',description:`${marker} Cenário fictício para explorar oportunidades sem prazo definido.`,priority:'Baixa'}
];
for(let i=0;i<publications.length;i++){
 const p=await create(members[i],'/api/publications',{...publications[i],url:''},`publication:${i}`);
 await create(members[(i+1)%7],'/api/comments',{publication_id:p.id,text:`${marker} Vamos avaliar a participação depois da revisão do roteiro.`,priority:'Média',mentions:[members[i]]},`publication-comment:${i}`);
}
const docs=[['Roteiro do piloto','Objetivo\nPercorrer um ensaio fictício de reconhecimento, coleta e registro.\n\nSequência\n1. Conferir a bancada.\n2. Escolher materiais de referência.\n3. Registrar observações.\n4. Compartilhar impedimentos.','igor'],['Critérios de reconhecimento','Critérios ilustrativos\nSeparar material, registrar ambiguidades e pedir revisão quando houver dúvida.\n\nEste texto não atesta precisão de modelo nem funcionamento de hardware.','jose-isaias'],['Premissas financeiras','Premissas de demonstração\nCategorias: componentes, montagem, transporte e manutenção.\n\nNenhum valor real ou previsão financeira foi usado nesta amostra.','amanda'],['Roteiro de apresentação','Proposta de exemplo\nProblema → fluxo do piloto → aprendizados → próximos passos.\n\nMaterial fictício, ainda sujeito à revisão humana.','clara-prado']];
for(let i=0;i<docs.length;i++){const [title,body,owner]=docs[i];await create(owner,'/api/documents',{title:title+' (simulação)',body:`# ${title}\n\n${marker} Documento artificial, não aprovado como evidência real.\n\n${body}`,file_name:`simulacao-volta-${i+1}.md`,visibility:'Equipe'},`document:${i}`);}
const state=await api('guilherme','/api/state');const summary={tasks:tasks.length,reports:tasks.filter(t=>t.progress>0).length*2,comments:7+publications.length,helpRequests:7,publications:publications.length,documents:docs.length,notificationsForGuilherme:state.notifications.length};
manifest.summary=summary;await writeFile(manifestPath,JSON.stringify(manifest,null,2));
for(const id of members)await api(id,'/api/logout','POST',{});
console.log(JSON.stringify({origin:base.origin,artificial:true,...summary},null,2));
