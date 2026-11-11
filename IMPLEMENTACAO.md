# Implementação v0.3 — 11/11/2026

## Entregue no código

API Fastify/TypeScript com banco relacional, migrações, transações, auditoria, idempotência e conflito por versão. Prévia em PGlite persistente; adaptador `pg` usa PostgreSQL de implantação. As sete pessoas estão cadastradas com IDs estáveis, sem vínculo a um provedor real. Login corporativo continua indefinido pela equipe; a entrada OIDC existe no código, mas não foi homologada com um provedor.

Atividades com relatórios e percentual atômicos; comentários e prioridade própria; pedidos de ajuda por destinatário/menção; agenda de eventos/oportunidades; notificações e confirmação individual; lembretes agrupados de segunda a sexta; documentos MD/TXT restritos ou compartilhados explicitamente. IsaiasOS permanece etapa final.

## Evidência desta rodada

- `npm test`: **16 cenários passaram**, cobrindo sessão/CSRF/origem, criação idempotente, progresso obrigatório, duas edições simultâneas, comentários/menções, ajuda, eventos/reavisos/cancelamento, leitura documental autorizada, preferências, lembretes, rollback, backup/restauração, revogação, persistência após reinício e recusa de configuração inadequada em produção.
- `npm exec tsc -- --noEmit`: passou na integração de backend.
- Dependências instaladas e travadas no `package-lock.json`; auditoria do npm da instalação retornou 0 vulnerabilidades conhecidas naquele momento.
- Testes executados em PostgreSQL embarcado, não em servidor PostgreSQL hospedado. Autenticação OIDC externa e piloto com a equipe não foram executados.
- `npm run check`: passou para TypeScript, cliente e trajetória.
- `npm run test:ui`: **19 cenários passaram no Chrome**, incluindo entrada demonstrativa, popup/Escape, prioridades e percentuais visíveis, sete membros/histórico do navegador, criação e relatório pelo formulário, comentário com menção, pedido de ajuda, cinco paletas com pares de contraste medidos, reflow 390/320 px, texto a 200%, trajetória preservada e ausência de erros de navegador. Capturas e resultados em `qa/platform/`.
- **Total desta versão: 35 cenários (16 API + 19 navegador)**. Os testes da interface usaram banco em memória isolado; os registros sintéticos das capturas não foram inseridos na prévia de uso.
- As 50 verificações antigas permanecem como histórico do protótipo anterior, sem serem apresentadas como cobertura desta versão.

## Rastreabilidade

| IDs | Estado |
|---|---|
| V03-01 | Persistência e isolamento transacional testados localmente; PostgreSQL hospedado, provedor e identidades reais pendentes |
| V03-02 / 09 | Interface e temas implementados, amostras de contraste e reflow testadas; teste com leitor de tela e avaliação completa de acessibilidade pendentes |
| V03-03 / 04 / 05 / 06 / 07 | Fluxos implementados; API e cenários essenciais de interface passaram; piloto com sete membros pendente |
| V03-08 | Nomes/interesses e preferências persistentes; cadastro não significa autenticação individual real |
| V03-10 | Conhecimento MD/TXT com escopo autor/equipe; painel vivo, sem snapshot de edição diária, GitHub/Linear ou extração PDF/DOCX |
| V03-11 | Adiado para a etapa final, conforme usuário |

## Operação e limites

`npm start` inicia prévia em loopback, padrão 4175. Nesta rodada a prévia de integração usa **4176** para coexistir com a anterior. Não usar o seletor demonstrativo como login de produção. O servidor de prévia mantém dados em `.data/preview-v03` nessa instância; o padrão é `.data/preview`. O lock impede dois processos abrindo o mesmo PGlite. Backup exige parar a prévia e restauração exige destino vazio; hash é integridade acidental, não autenticação do arquivo.

A API não consulta GitHub/Linear, não gera documentos e não integra IsaiasOS. Sem agendamento de backup, monitoramento de produção ou calendário de feriados. Não há publicação externa nem alteração de repositórios/serviços da equipe. O jornal é explicitamente um painel vivo, sem afirmar que é uma edição congelada.

Referências: [plano](../requisitos/central-startup/plano-v0.3.md), [decisões](DECISOES-v0.3.md), [operação](README.md).

## Evolução visual e voz

Sete universos gráficos originais em `personality.js`, referências em [REFERENCIAS-VISUAIS.md](REFERENCIAS-VISUAIS.md). Subtítulos genéricos, blocos de instruções permanentes e tags de interesses usadas como decoração foram substituídos por arte pessoal; a indicação de prévia permanece compacta e abre contexto sob demanda. Símbolo redesenhado e consistente em todas as entradas.

`voice.js` adiciona ditado no relato/próximo passo, sem criar relatório automaticamente, inferir percentual ou afirmar integração IsaiasOS. Reconhecimento só começa após consentimento e clique; fechamento do formulário ou saída da página interrompe a captura. O serviço de reconhecimento pertence ao navegador, pode ser remoto e falhar. Testes de ditado são simulados; fala real/microfone não foram utilizados nesta rodada.

Os 19 cenários de interface incluem os anteriores e a remoção de blocos repetidos, presença das sete colagens/IDs SVG únicos, preferência neutra, animação por interação, consentimento/transcrição em rascunho, parada ao fechar e fallback sem API de voz. A revisão não equivale a uma auditoria WCAG completa.

## Redesign Cyera / Matéria em movimento

Crítica e direção em [DIRECAO-CYERA.md](DIRECAO-CYERA.md). Comparação visual/runtime da referência por REA e duas análises paralelas de agentes. Cena original por agente especializado, composição e integração pelo principal. Entrada, login, jornal e páginas de trabalho agora pertencem ao mesmo sistema. Arte pessoal anterior permanece nos cartões da equipe; cores operacionais e permissões não mudam.

Nova suíte: **10 cenários de experiência** passaram, além dos **19 de interface** e **16 de API**: **45 ao todo**. Capturas desktop/mobile e resultados em `qa/studio/`; o fallback SVG foi testado com WebGL indisponível, e a prévia no Chrome renderizou WebGL. Sem erros de navegador nas suítes. Isso não substitui avaliação com os sete membros, homologação OIDC ou auditoria WCAG completa.

## Revisão 2 da experiência — mundo contínuo

Direção e auditoria em [DIRECAO-CYERA.md](DIRECAO-CYERA.md#revisão-2--mundo-contínuo-11112026-segunda-rodada). Arquivos alterados: `orbit-scene.js` (reescrito), `studio.css` (reescrito, sem camadas de correção), `workspace.js`, `journey.html`, `arrival.js`, `tests/studio.mjs`. Novos: `scripts/capture-redesign.mjs`, `scripts/capture-variants.mjs`, `scripts/contact-sheet.mjs`. Versão anterior desses arquivos em `historico/studio-v1/`. API, esquema, domínio e dados não foram tocados.

Evidência executada nesta rodada: `npm run check` passou; `npm test` **16**; `npm run test:ui` **19**; `npm run test:studio` **12** (dois cenários novos: palco/âncora/contexto de retomada e reaproveitamento do canvas entre páginas). **47 cenários**. `node scripts/check-demo.mjs` confirmou as 21 atividades fictícias e as três telas preenchidas. Capturas em `qa/redesign/` (1440, 900, 390 e 320 px; sem WebGL; alto contraste; neutro; texto a 200%; quatro personas), sem erros de console e sem rolagem horizontal. As variações de preferência foram capturadas em banco em memória; a prévia recebeu apenas sessões demonstrativas, encerradas ao final.

Mudanças de comportamento no cliente: a atividade em destaque passa a ser a de maior prioridade (depois, prazo mais próximo); agenda em ordem cronológica; troca de página volta ao topo; “Último registro” abre expandido no relatório; José Isaías e José Roberto são saudados como Isaías e Roberto.

## Revisão 3 — cartazes 2D

Direção em [DIRECAO-CYERA.md](DIRECAO-CYERA.md). Reescritos: `personality.js`, `orbit-scene.js`; alterados: `studio.css` (seções de tokens, palco, chegada, larguras e nova seção de cena), `workspace.js`, `journey.html`, `arrival.js`, `tests/studio.mjs`. Novo: `scripts/probe-motion.mjs`. Versão 3D em `historico/studio-v2-3d/`.

Executado: `npm run check` passou; `npm test` **16**; `npm run test:ui` **19**; `npm run test:studio` **12** (o cenário de pausa agora confere que todas as animações da cena ficam em `paused`); `node scripts/check-demo.mjs` confirmou as 21 atividades fictícias; `node scripts/probe-motion.mjs` confirmou que as animações avançam e congelam na pausa. Capturas em 1440, 900, 390 e 320 px e das sete personas em `qa/redesign/`, sem erros de console nem rolagem horizontal. Contraste das sete paletas não foi medido por ferramenta; os fundos foram escolhidos escuros o bastante para texto creme, o que ainda precisa de verificação formal.
