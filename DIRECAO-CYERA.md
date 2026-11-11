# VOLTA — matéria em movimento

## Crítica do estado anterior

A marca tinha cores reconhecíveis, mas a composição ainda era a de um dashboard pronto: uma saudação grande, um retângulo ilustrado e uma sequência de cartões arredondados. A personalização mudava a imagem, sem transformar a experiência. Prioridade, relato, documento e evento disputavam atenção com superfícies semelhantes. O excesso de caixas fragmentava o trabalho; a arte parecia aplicada depois. A grade da equipe se comportava como catálogo. A inspiração editorial com serifas e papel já não atendia à nova referência imersiva.

## O que foi observado na referência

[Cyera AI Guardian](https://secure-the-unknown.cyera.com/) foi aberta em navegador real, inclusive a ação “Begin Your Mission”. A cena inicial usa volume, profundidade, tipografia de grande escala e um universo ilustrado contínuo. A ação inicia outra composição com órbitas e o objeto central: a imagem participa da narrativa, em vez de ser um banner. Evidências REA: `ev_4621c0a258ba9e7463058bc288767f6ad1910fed7b745253d28218d8b1a365e6` e `ev_656dc81d3f08027bcb5b101430c220a3d1cbd65fad9d895bd76ab921dacf2179`; as capturas não registraram erros de página.

O HTML anexado e arquivos companheiros foram tratados como dados. A inspeção estática identificou referências a Haffer/Season, Theatre.js e cenas Space/Dusk/Horizon; isso não comprova uso específico em cada interação. Nenhum arquivo de fonte, modelo, ilustração ou script proprietário da Cyera será reutilizado. O carregamento e os movimentos da campanha não são requisitos para entrar no trabalho diário da VOLTA.

## Conceito original e escolhas

**Matéria em movimento:** uma fita/ciclo tridimensional de materiais recuperados, fragmentos facetados e luz mineral. A VOLTA transforma o que seria descarte em continuidade; a equipe transforma informação dispersa em próximo passo. Esse é o vínculo entre universo visual e produto. A escultura não simula porcentagem, crescimento ou atividade da equipe.

Paleta: petróleo `#071F22`, verde profundo `#173F35`, lima mineral `#D8ED91`, cobre `#C7A383`, papel frio `#F3F5EF` e tinta `#163436`. Cor emocional vive na cena; prioridade continua em tokens próprios, texto e símbolo. As sete assinaturas gráficas pessoais permanecem, enquanto o espaço e os objetos passam a ter uma linguagem comum.

Tipografia: Space Grotesk nos títulos e Manrope na leitura, abertas e servidas localmente. Escala expressiva na entrada, hierarquia compacta nas páginas de trabalho. Não copiar Haffer ou Season. Nenhuma informação operacional deve ser escrita sobre a região mais complexa da cena.

Composição: cabeçalho enxuto → espaço de chegada com cena e próxima ação real → mesa clara de trabalho. No jornal, atenção e ajuda precedem atividades; agenda fica condensada por tempo e relatos mostram autoria. Atividades deixam de parecer cartões promocionais e viram linhas de trabalho com ações diretas. Equipe mantém personalização e progresso, sem ranking. A entrada histórica e sua linha de scroll permanecem como percurso opcional.

```
marca / navegação / notificações / perfil
saudação + próxima ação       ciclo de materiais 3D
integrantes para acompanhar / pausa de cena
┌ mesa de trabalho clara ──────────────────────────┐
│ importante / ajuda                              │
│ atividades com progresso          agenda        │
│ relatos da equipe e autoria                     │
└─────────────────────────────────────────────────┘
```

## Interação que merece retorno

Retomar a atividade de maior prioridade do próprio membro; ver o último próximo passo no contexto; abrir o trabalho de um colega sem trocar de identidade; responder a pedidos; confirmar eventos; conferir relatos recentes com autoria. Não adicionar pontuação, streaks, urgência artificial, comemoração de produtividade ou mensagens que afirmem motivação medida. O objetivo emocional é uma hipótese de design a validar com os sete membros.

## Limites técnicos e acessibilidade

Uma cena WebGL compartilhada por página, com fallback vetorial original, limite de densidade e de quadros. Pausa explícita, movimento reduzido, parada fora da área visível e ausência de bloqueio de scroll. Texto, formulários, barra de progresso, menções, ditado, notificações, documentos e API continuam funcionando sem WebGL. Nenhum áudio automático. Alto contraste e cores forçadas priorizam leitura. Reconhecimento de voz continua opcional, consentido e revisável; IsaiasOS segue pendente da etapa final.

Revisão contra o genérico: não adotar um fundo roxo com astronauta nem apenas recolorir os cartões. A ousadia está na escultura e na passagem espacial para a mesa de trabalho; o restante ganha disciplina e propósito. O critério de sucesso é visual e funcional, não a quantidade de efeitos ou bibliotecas.

## Verificação da entrega

45 cenários aprovados: 16 API, 19 interface e 10 específicos da experiência. A inspeção final no Chrome confirmou renderer WebGL, mesa preenchida com os dados de simulação, sete membros e largura mobile de 390 CSS px sem transbordamento. O caminho sem WebGL foi validado separadamente com fallback SVG, incluindo a trajetória de cinco etapas. Textos, fluxos de relatórios/voz, comentários, ajuda, eventos e documentos continuaram cobertos. Fontes e biblioteca são servidas localmente; nenhum rastreador da referência foi incorporado.

A interface atual usa `workspace.css` para estrutura/base e `studio.css` para o sistema visual consolidado; `expressive.css` anterior está preservado como histórico, mas saiu do carregamento. Comparação anterior em `qa/studio/before.png`; capturas atuais em `qa/studio/journal.png`, `team.png`, `mobile.png`, `arrival.png` e `login.png`. Testes em `qa/platform/results.json` e `qa/studio/results.json`.

## Revisão 2 — mundo contínuo (11/11/2026, segunda rodada)

### Auditoria da versão anterior

- **Forte:** paleta e tipografia já próprias; domínio, relatórios obrigatórios, ditado, alertas e temas sólidos; cena com limites de custo (DPR 1,5, 24 fps, pausa, fallback).
- **Genérico:** a escultura vivia em um retângulo na metade direita — exatamente a “arte anexada” que a referência não tem. O título do jornal (“Sua próxima volta começa aqui”) era um slogan repetido a cada visita, sem informação.
- **Hierarquia:** três botões lima idênticos na lista competiam com a ação do topo; relatos em cartões iguais com percentual solto; agenda em grade de cartões fora de ordem cronológica; metadados em 11–12 px.
- **Arte contra uso:** material em PBR + ACES clareava e desbotava a paleta; a chegada de 4,8 s recomeçava a cada atualização automática da tela.
- **Risco de regressão:** seletores usados por 45 cenários, CSP `style-src 'self'` (sem estilos inline), identidade de sessão, rascunhos e diálogos. Todos preservados.

### O que foi extraído da referência (princípios, não assets)

Reaberta em navegador real: carregamento, cena inicial, ação “Begin Your Mission” e rolagem. Princípios adotados: (1) o mundo ocupa o quadro inteiro e passa por trás do cabeçalho; (2) três planos de profundidade, com silhuetas próximas cortando a borda; (3) iluminação em faixas, de ilustração, numa única família de cor com um acento; (4) a composição muda depois de uma ação, mas o objeto é o mesmo; (5) texto entra por linha. Não adotados: tela de carregamento, rolagem sequestrada, introdução obrigatória, roxo, astronauta, fontes, textos, rastreadores.

### Direção aplicada

- **Palco.** `.stage-world` cobre o topo de cada página (cabeçalho incluso). O layout só posiciona um `[data-scene-anchor]`; a cena lê esse retângulo e coloca a escultura ali. A composição de cada breakpoint pertence ao CSS, não ao WebGL.
- **Matéria.** Fita torcida em três faces (lima, acento pessoal, cobre) com luz em quatro faixas (`MeshToonMaterial`), sem tone mapping para a paleta chegar fiel. Três **órbitas de rastreio** em linha fina com uma conta que as percorre: a rastreabilidade da VOLTA, não uma métrica. Fragmentos distantes em verde profundo, médios coloridos, próximos como silhuetas na borda.
- **Sete acentos.** Além da cor, cada pessoa tem uma família de formas nos fragmentos (barras de velocidade, moedas, módulos, molduras, esferas e tetraedros, cubos…). A mesma cor identifica autoria em avatares, relatos e cartões da equipe. Modo neutro remove a cena e as colagens.
- **Movimento.** Primeira chegada ≤ 4,8 s (câmera recua, fragmentos convergem, contas percorrem). Trocar de página move a mesma escultura para a nova âncora em 1,4 s. Atualizações da mesma página não reanimam. Ponteiro e rolagem nativa dão paralaxe e param sozinhos. 24 fps, DPR ≤ 1,5, pausa, aba oculta, fora da tela e movimento reduzido continuam valendo. Composições pequenas (< 300 px) mostram só a fita, para nada cruzar o texto.
- **Jornal.** O título é a saudação com o nome; logo abaixo, **“Onde você parou”**: atividade de maior prioridade, o próximo passo já registrado, progresso e prazo, com “Retomar atividade”. É o motivo real para voltar: contexto, não slogan.
- **Folha de trabalho.** Uma ação primária por tela. Atividades em linhas (prioridade, título, responsável com acento, progresso, ação). Relatos com autoria, “de X% → Y%” e o próximo passo visível. Agenda cronológica com data grande; “Sem prazo” quando não há prazo. Texto de leitura em 15–16 px, metadados ≥ 13 px.
- **Entrada e trajetória.** Mesmo mundo. No login o cartão fica à frente da cena; na trajetória o título ocupa a largura e a fita sangra pela direita. Roadmap de cinco capítulos e linha SVG intactos.

### Bibliotecas

Nenhuma dependência nova. Three.js 0.187 (já instalado), CSS e Web Animations API. GSAP/ScrollTrigger, Theatre.js e Lenis foram avaliados e dispensados: não há linha do tempo que o código atual não mantenha em poucas linhas, e a rolagem é nativa.

### Limites desta rodada

Avaliação com os sete membros, leitor de tela e auditoria WCAG completa continuam pendentes. As capturas automatizadas rodam em Chrome headless; a taxa de quadros não foi medida em hardware modesto. Login real, PostgreSQL hospedado, GitHub/Linear, PDF/DOCX, edição congelada e IsaiasOS seguem como estavam: não implementados.

## Revisão 3 — cartazes 2D por pessoa (11/11/2026, terceira rodada)

Retorno do Guilherme sobre a revisão 2: faltavam cor, personalização, hierarquia e contraste; a fita 3D foi rejeitada; as colagens da equipe, a frase do rodapé e o bloco do topo “não faziam sentido”. Pedido: tudo em 2D, bem animado.

- **Sem 3D.** A cena WebGL saiu. `orbit-scene.js` virou um controlador de ~30 linhas (liga a âncora, pausa, suspende fora da tela). Three.js continua em `package.json`, mas nenhuma página o carrega mais; a versão 3D está em `historico/studio-v2-3d/`.
- **Cor por pessoa.** Cada integrante tem um mundo de cor (fundo, tom profundo, dois acentos): azul/lima (Guilherme), vermelho (Clara), magenta (Amanda), petróleo/ouro (Júlia), verde (Igor), laranja queimado (Isaías), roxo/menta (Roberto). Todo o topo, o cabeçalho e o fundo da página assumem essa cor; entrada, trajetória e modo neutro usam o verde VOLTA.
- **Cartazes legíveis.** `personality.js` foi refeito: objetos reconhecíveis em vez de colagem abstrata (bola de vôlei sobre a rede, π, Σ e gráfico; balança, microfone e carro de corrida; velas, moedas e balões; gráfico em alta, lâmpada, foguete e broto; bola, claquete, casa e maleta; rede neural, terminal, sol e mandacaru; fliperama, luvas, corações de pixel e chip). A mesma arte aparece no topo de quem está logado e no cartão da equipe (anima ao passar o mouse ou focar).
- **Movimento.** Só CSS: entrada em sequência (pop), depois laços com função (a bola percorre a parábola, a balança oscila, o carro cruza a pista, as velas crescem, a claquete bate). Pausa congela tudo; movimento reduzido e fora da tela também. Sem `requestAnimationFrame`.
- **Hierarquia do topo.** Saudação em uma linha → cartão claro “Continue de onde parou” (prioridade, título, próximo passo registrado, progresso, botão escuro “Retomar atividade”) → “Criar atividade” secundário. A arte fica na sua coluna e nunca cruza o texto.
- **Removido.** Frase “volta — o trabalho continua.” do rodapé; estado “pressionado” sem sentido na faixa de integrantes (agora “Ver atividades de”, sem a própria pessoa).

Mudança em relação ao combinado antes: os laços agora são contínuos (antes paravam em 4,8 s). É consequência direta do pedido “bem animado”; a pausa explícita e o movimento reduzido continuam disponíveis.
