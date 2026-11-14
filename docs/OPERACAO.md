# VOLTA — central da equipe

Entrada animada em `/`; área de trabalho em `/jornal`. O núcleo v0.3 usa API, banco SQL e sessões de servidor. A versão anterior está preservada em `archive/prototype-v0.2/`, fora da aplicação atual. A organização do código está descrita em [Arquitetura](architecture/ARQUITETURA.md).

## Rodar a prévia no Windows

Requer Node.js 24 ou superior:

```cmd
cd "C:\Users\Inteli\Documents\engenharia reversa\central-startup"
npm ci
npm start
```

Abra http://127.0.0.1:4175. `iniciar.cmd` inicia a mesma prévia. `Ctrl+C` encerra o servidor. Não execute dois processos usando a mesma `DATA_DIR`.

A prévia é restrita a loopback. O seletor inicial abre sessões demonstrativas dos sete membros; **não é autenticação real**. Os dados de teste são compartilhados entre as sessões deste servidor e persistem em `.data/preview`, fora do Git. Não inserir documentos confidenciais nesta prévia, mesmo com visibilidade restrita: qualquer pessoa com acesso à máquina pode iniciar a sessão demonstrativa de outro membro.

## Núcleo disponível

- Sete membros com artes SVG originais inspiradas nos seus interesses, opção visual neutra e preferências individuais.
- Atividades com prioridade Alta/Média/Baixa, responsável, prazo e progresso.
- Relatório obrigatório na mudança de percentual, autoria, próximo passo, histórico e conflito de edição explícito. Atalho direto na lista e ditado opcional em português no relato e no próximo passo.
- Comentários prioritários, menções e pedidos de ajuda com notificação por destinatário.
- Eventos/oportunidades, alertas importantes e confirmação individual persistente.
- Lembrete agrupado de segunda a sexta após 16h, America/Sao_Paulo, enquanto o servidor está ativo; não inclui calendário de feriados. Retomar o servidor no mesmo dia recupera a execução, sem duplicar entrega.
- Importação de MD/TXT até 1 MB, restrita ao autor por padrão ou compartilhada com a equipe por escolha explícita. Documentos não são executados.
- Temas de contraste/daltonismo, texto ampliado e movimento reduzido.

## Configuração real

Sem provedor de login definido pela equipe, produção permanece pendente. `npm run start:production` exige PostgreSQL em `DATABASE_URL`, origem HTTPS em `PUBLIC_ORIGIN` e OIDC configurado. Copie `.env.example` para `.env` e preencha fora do Git. O callback é `PUBLIC_ORIGIN/auth/callback`. Não há cadastro público automático. Após confirmar a identidade no provedor, um operador autorizado pode vincular ID de membro e subject:

```cmd
npm run member:bind -- guilherme SUBJECT_CONFIRMADO_NO_PROVEDOR
```

O vínculo é escopado ao emissor configurado em `OIDC_ISSUER`, auditado e revoga sessões anteriores. Os sete cadastros iniciais não estão vinculados a identidades externas. Cookies de produção são HttpOnly/Secure, com CSRF nas mutações; nunca habilitar prévia em servidor público.

## Testar e recuperar

```cmd
npm run check
npm test
npm run test:ui
```

Os testes de API usam PostgreSQL embarcado em memória. A suíte nova não depende do REA global. O navegador dos testes de UI usa Chrome instalado nesta máquina; configure `CHROME_PATH` em outro ambiente. Scripts antigos em `archive/tests/` documentam o protótipo anterior e não são aceites desta versão. Capturas/resultados anteriores estão preservados em `artifacts/qa/`.

Backup lógico do esquema atual, com dados de negócio e auditoria, sem restaurar sessões ou desafios OAuth. Na prévia, pare o servidor antes de executar:

```cmd
npm run backup -- export .data/backups/volta.json
```

Restaure **somente em um banco novo/vazio**, com `DATA_DIR` diferente ou `DATABASE_URL` de um banco vazio:

```cmd
set DATA_DIR=.data/recuperacao
npm run backup -- restore-empty .data/backups/volta.json
```

O arquivo contém informações privadas; guarde-o fora de pastas públicas. O hash detecta alteração acidental, não substitui criptografia nem assinatura. Em produção, complemente com backups gerenciados/PITR do provedor e ensaio de restauração. Não há agendamento automático de backup neste núcleo.

Falhas de inicialização (por exemplo, porta ocupada) fecham o banco e liberam `.volta-lock`. Um encerramento abrupto ainda pode deixar esse arquivo. Ele contém o PID do processo: confirme que esse processo encerrou e que nenhuma outra instância usa a mesma `DATA_DIR` antes de remover exclusivamente o bloqueio; não apague o diretório do banco. Na prévia padrão, consulte o PID com `Get-Content .data/preview/.volta-lock` e o processo com `Get-Process -Id PID` no PowerShell. A mensagem `.env not found. Continuing without it.` é informativa: a prévia funciona sem `.env`.

## Limites e rastreabilidade

O jornal atual é um painel vivo dos registros do banco; ainda não é uma edição diária congelada. GitHub/Linear não estão conectados à API, PDF/DOCX/OCR e geração documental não estão implementados. IsaiasOS permanece etapa final, sem endpoint fictício. Não foi validado login OIDC com provedor real nem PostgreSQL hospedado; homologação externa e piloto com os sete membros ainda são necessários.

O plano v0.3 original fica no diretório externo `requisitos/central-startup/plano-v0.3.md` e não integra este repositório. Consulte também o [registro de implementação](history/IMPLEMENTACAO.md), a [trajetória](design/TRAJETORIA.md) e os [créditos](../src/client/assets/CREDITOS.md). Não houve publicação ou alteração de GitHub/Linear nesta implementação.

## Arte e voz

[Referências e direção por membro](design/REFERENCIAS-VISUAIS.md): cordel/redes, automobilismo/oratória, colagem financeira, arquitetura de negócios, cinema/encontros, anime/geométrico e arcade. Arte original, sem imagens de franquias ou obras copiadas. O símbolo foi unificado entre entrada, central e favicon. Textos explicativos repetidos foram retirados; estados, erros e informações de consentimento continuam contextuais.

Ditado usa `SpeechRecognition`/`webkitSpeechRecognition` quando disponível. Exige ação e autorização explícita; o navegador pode enviar áudio ao seu serviço de reconhecimento e precisar de conexão. A VOLTA não recebe nem armazena áudio. O texto é apenas acrescentado ao rascunho e precisa ser revisado/publicado pelo membro. Indisponibilidade ou falha preservam a digitação. IsaiasOS ainda não processa esse material.

Transições em navegação, diálogos e controles respeitam a preferência do sistema e movimento reduzido do perfil. Os testes de voz usam reconhecimento simulado, sem acessar microfone; não representam teste acústico ou homologação do serviço do navegador.

## Cenário fictício preenchido

A prévia atual contém um lote artificial: 21 atividades (3 por membro), 38 relatos, 13 comentários, 7 pedidos de ajuda, 3 eventos, 3 oportunidades e 4 documentos. Dados e atribuições não representam trabalho real. O cabeçalho identifica a simulação; descrições preservam a identificação de cenário fictício.

`npm run demo:seed` carrega somente prévia loopback (padrão 4176; sobrescreva `PREVIEW_URL` para outra porta). Usa a API autorizada, chaves idempotentes e manifesto local em `.data/demo-preview-v1.json`; repetir mantém os registros e não sobrescreve edições. Não apague esse manifesto para tentar recarregar o mesmo lote. Nenhum dado anterior é apagado.

`node scripts/demo/check-demo.mjs` valida a carga na prévia em execução. Novas capturas e `results.json` ficam em `test-results/simulation/`. A evidência anterior está preservada em `artifacts/qa/simulation/`. A carga foi executada duas vezes na rodada original para conferir repetição sem duplicatas; jornal, equipe, agenda e versão mobile foram verificados, sem erros de navegador. O alerta importante aparece ao entrar numa nova sessão; numa sessão já aberta, consulte Notificações.

## Experiência visual

[A crítica e a direção visual](design/DIRECAO-CYERA.md) registram a comparação com a Cyera e as três rodadas até aqui. A direção atual, da terceira rodada, é um cartaz 2D por integrante: cada pessoa tem um mundo de cor próprio e objetos reconhecíveis dos seus interesses, em SVG original animado por CSS. Entrada, trajetória e modo neutro usam o verde VOLTA com o ciclo de materiais. Tipografia local Space Grotesk/Manrope, com licenças em `src/client/assets/fonts/*-OFL.txt`. Nenhum modelo, fonte proprietária, imagem ou rastreador da referência foi reutilizado.

A versão 3D foi preservada em `archive/studio-v2-3d/`; a dependência Three.js saiu do projeto em 13/11/2026. Não há canvas, WebGL nem laço de quadros: todo o movimento é CSS. Pausa explícita, movimento reduzido, área fora da tela e aba oculta suspendem a animação. A cena não representa produtividade nem estado da equipe. A evolução visual e as verificações de cada rodada estão registradas em [Implementação](history/IMPLEMENTACAO.md).

A cena ocupa o topo de cada página, posicionada por uma âncora do layout, e o jornal abre com “Continue de onde parou”: a atividade de maior prioridade e o próximo passo já registrado. Capturas históricas em `artifacts/qa/redesign/`. Novas capturas ficam em `test-results/redesign/`, geradas por `node scripts/qa/capture-redesign.mjs` e `node scripts/qa/capture-variants.mjs`; `node scripts/qa/probe-motion.mjs` confere que as animações avançam e congelam na pausa.

`npm run test:studio` cobre cena única por página, pausa que congela todas as animações, ausência de laço de quadros, filtro de colega sem impersonação, recursos locais, operação sem WebGL, saída mobile e trajetória. O banco e os registros fictícios existentes foram preservados. IsaiasOS e login real continuam com os limites documentados anteriormente.
## Entrada da Vercel

`src/app.mts` exporta um handler HTTP padrão para a Vercel, com inicialização única por instância e sem abrir porta ou iniciar timers. A fábrica `buildApp` continua disponível para prévia local e testes. Configure `DATABASE_URL` (PostgreSQL externo), `PUBLIC_ORIGIN` (URL HTTPS do site), `OIDC_ISSUER`, `OIDC_CLIENT_ID` e `OIDC_CLIENT_SECRET`. O retorno OIDC deve ser `PUBLIC_ORIGIN/auth/callback`; as identidades dos membros precisam ser vinculadas antes do acesso. Não publique `.env` nem `.data`.

Sem configuração válida, a entrada responde 503 genérico e registra o erro nos logs do servidor.
### Arquivos de publicação

`api/index.ts` é a função que a Vercel executa: o runtime cria uma função por arquivo em `api/`, e esse arquivo apenas reexporta o handler de `src/app.mts`. `vercel.json` encaminha todas as rotas para essa função e declara `includeFiles: src/**`, necessário porque o servidor lê arquivos em tempo de execução: as páginas, estilos, scripts e fontes de `src/client/` e o `schema.sql` da migração. Sem esse include, a primeira requisição falha ao ler o esquema. `.vercelignore` mantém fora do envio o acervo de capturas, os documentos, os testes e o `archive/`.

`package.json` declara `"type": "module"` para que `api/index.ts` seja tratado como ES module; `engines.node` fixa a major 24.

### Passo a passo

1. Crie o PostgreSQL gerenciado e guarde a URL de conexão **com pool**: em serverless cada instância abre seu próprio pool e, sem pooling, o banco esgota conexões.
2. Configure o provedor de login. A equipe escolheu o Google; a seção "Provedor escolhido" abaixo tem o passo a passo.
3. Vincule o projeto da Vercel a este repositório e defina as cinco variáveis no ambiente de produção.
4. Publique. Na primeira conexão o próprio servidor cria o esquema e cadastra os sete membros; não há migração manual.
5. Vincule cada identidade com `npm run member:bind`, apontando `DATABASE_URL` para o banco de produção. Enquanto um membro não estiver vinculado, o provedor autentica mas a central recusa a entrada.
### Descobrir o subject para o vínculo

O `member:bind` exige o subject do provedor, que não aparece em nenhum painel. O caminho é: a pessoa tenta entrar uma vez e recebe "Esta identidade ainda não foi convidada"; o servidor registra `oidcIssuer` e `oidcSubject` nos logs da hospedagem; o operador lê o valor ali e executa o vínculo. O registro só acontece nesse caminho de recusa e o subject sozinho não dá acesso a nada.

Os lembretes diários continuam sem agendamento: o handler não roda o timer e não existe rota de cron protegida. Em hospedagem serverless isso exige uma rota dedicada com segredo próprio, decisão ainda não tomada. O handler não executa o timer local de lembretes: em hospedagem serverless, o agendamento continua pendente de configuração externa. Validação da entrada: `node --test tests/integration/vercel-entry.mjs`; isso não substitui um teste no ambiente publicado com PostgreSQL e OIDC reais.


## Saídas de verificação

Testes e scripts de QA gravam novas capturas em `test-results/`, ignorado pelo Git. O acervo já versionado fica em `artifacts/qa/`. Para atualizar esse acervo intencionalmente, defina `QA_OUTPUT_DIR=artifacts/qa` antes de executar o comando correspondente. Execute os comandos desta página a partir da raiz do repositório.

### Provedor escolhido: Entrar com o Google

Conferido no documento de descoberta em 14/11/2026: o emissor é exatamente `https://accounts.google.com`, com PKCE S256, `client_secret_basic` e os escopos `openid` e `profile` — tudo o que a central usa, sem necessidade de habilitar nada a mais.

Configuração no Google Auth Platform, em `console.developers.google.com/auth`:

1. **Branding**: registre a aplicação. Esse registro é pré-requisito para criar o cliente.
2. **Audience**: escolha o tipo **External**. O tipo Internal exige uma organização do Google Cloud, que uma conta Gmail comum não tem.
3. **Clients**: *Create client*, tipo *Web application*. O segredo aparece uma única vez, na criação; depois o painel mostra só os quatro últimos caracteres.
4. **URI de redirecionamento autorizado**: `PUBLIC_ORIGIN/auth/callback`, exatamente, em HTTPS e sem barra no fim. Divergência de esquema, caminho ou barra final gera `redirect_uri_mismatch`. A alteração pode levar de cinco minutos a algumas horas para valer.

Como a central pede apenas `openid` e `profile`, o projeto pode ficar com status *Testing* sem cadastrar usuários de teste e sem a expiração de sete dias, e não precisa passar pela verificação de aplicativo: é a exceção que o Google documenta para "Entrar com o Google" com esses escopos. Quem controla o acesso é o vínculo de identidade da própria central — autenticar no Google não basta para entrar.

Variáveis correspondentes: `OIDC_ISSUER=https://accounts.google.com`, com o ID e o segredo do cliente criado acima.
