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

O arquivo contém informações privadas; guarde-o fora de pastas públicas. O hash detecta alteração acidental, não substitui criptografia nem assinatura. Em produção, complemente com backups gerenciados/PITR do provedor e ensaio de restauração. Não há agendamento automático de backup neste núcleo. Se uma queda deixar `.volta-lock`, confirme que nenhum processo está usando a `DATA_DIR` antes de remover exclusivamente esse arquivo; não apague os dados.

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

## Experiência “Matéria em movimento”

[A crítica e a direção visual](design/DIRECAO-CYERA.md) documentam a comparação com a Cyera e as decisões originais: escultura 3D de fita/material, sete acentos pessoais, tipografia local Space Grotesk/Manrope, chegada imersiva e área clara de trabalho. Nenhum modelo, fonte proprietária, imagem ou rastreador da referência foi reutilizado. Licenças das fontes abertas em `src/client/assets/fonts/*-OFL.txt`.

A versão 3D foi preservada em `archive/studio-v2-3d/`. A cena atual usa SVG e animações CSS originais; nenhuma página atual carrega Three.js. Pausa, movimento reduzido, área fora da tela e aba oculta suspendem movimento. A cena não representa produtividade nem estado da equipe. A evolução visual e as verificações de cada rodada estão registradas em [Implementação](history/IMPLEMENTACAO.md).

Na segunda rodada a cena passou a ocupar o topo inteiro de cada página (palco), posicionada por uma âncora do layout, com luz em faixas, órbitas de rastreio e três planos de profundidade; o jornal abre com “Onde você parou”. Capturas históricas em `artifacts/qa/redesign/`. Novas capturas ficam em `test-results/redesign/`, geradas por `node scripts/qa/capture-redesign.mjs` e `node scripts/qa/capture-variants.mjs`.

`npm run test:studio` cobre renderer único, pausa, fim do movimento, filtro de colega sem impersonação, recursos locais, fallback, saída mobile e trajetória. O banco e os registros fictícios existentes foram preservados. IsaiasOS e login real continuam com os limites documentados anteriormente.
## Entrada da Vercel

`src/app.mts` exporta um handler HTTP padrão para a Vercel, com inicialização única por instância e sem abrir porta ou iniciar timers. A fábrica `buildApp` continua disponível para prévia local e testes. Configure `DATABASE_URL` (PostgreSQL externo), `PUBLIC_ORIGIN` (URL HTTPS do site), `OIDC_ISSUER`, `OIDC_CLIENT_ID` e `OIDC_CLIENT_SECRET`. O retorno OIDC deve ser `PUBLIC_ORIGIN/auth/callback`; as identidades dos membros precisam ser vinculadas antes do acesso. Não publique `.env` nem `.data`.

Sem configuração válida, a entrada responde 503 genérico e registra o erro nos logs do servidor. O handler não executa o timer local de lembretes: em hospedagem serverless, o agendamento continua pendente de configuração externa. Validação da entrada: `node --test tests/integration/vercel-entry.mjs`; isso não substitui um teste no ambiente publicado com PostgreSQL e OIDC reais.


## Saídas de verificação

Testes e scripts de QA gravam novas capturas em `test-results/`, ignorado pelo Git. O acervo já versionado fica em `artifacts/qa/`. Para atualizar esse acervo intencionalmente, defina `QA_OUTPUT_DIR=artifacts/qa` antes de executar o comando correspondente. Execute os comandos desta página a partir da raiz do repositório.
