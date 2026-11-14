# Publicar a central

Guia para colocar a VOLTA no ar pela primeira vez. Siga na ordem: cada etapa produz um valor que a seguinte precisa.

Ao final existem três sistemas conversando: a **Vercel** executa o código, um **PostgreSQL gerenciado** guarda os dados e o **Google** confirma quem é cada pessoa. A central não guarda senha de ninguém.

## Antes de começar

| Conta | Para quê | Custo |
|---|---|---|
| Vercel | executar a aplicação | gratuito |
| Neon ✔ | PostgreSQL | gratuito |
| Google Cloud | login dos sete membros | gratuito |

Todas aceitam entrar com a conta do GitHub ou do Google. Nenhuma senha ou segredo precisa passar por outra pessoa: tudo é colado direto nos painéis.

## Por que esta ordem

O Google exige o endereço exato de retorno, e esse endereço só existe depois que a Vercel cria o projeto. Por isso a Vercel vem antes do Google, e o primeiro deploy falha de propósito.

```
banco  →  Vercel (falha com 503)  →  Google  →  variáveis  →  redeploy  →  vínculos
```

## Etapa 1 — Banco de dados ✔ feito

O projeto já existe: **volta-central** (`rapid-bonus-16610317`) no Neon, região São Paulo (`aws-sa-east-1`), PostgreSQL 18.
Painel: <https://console.neon.tech/app/projects/rapid-bonus-16610317/>

A `neon init` escreveu as duas connection strings em `.env.local`, na raiz do repositório, fora do Git:

| Variável | Para quê |
| --- | --- |
| `DATABASE_URL` | **a que vai para a Vercel** — com pooling (tem `-pooler` no host) |
| `DATABASE_URL_UNPOOLED` | conexão direta, para migração ou inspeção pontual |

Para ver o valor sem abrir o arquivo em tela cheia: `neon connection-string`.

Como o banco está em São Paulo, o `vercel.json` fixa a função em `gru1` (mesma cidade). Se a Vercel recusar a região no seu plano, tire a linha `"regions"` do arquivo — o site sobe em `iad1` e cada consulta passa a custar uns 120 ms a mais.

**Por que pooling:** em serverless cada instância abre seu próprio conjunto de conexões. Com a URL direta, algumas visitas simultâneas esgotam o limite do plano gratuito e o site começa a responder 503.

Não crie tabela nenhuma. A central cria o esquema e cadastra os sete membros sozinha, na primeira conexão.

## Etapa 2 — Importar na Vercel

1. Entre na [Vercel](https://vercel.com) com o GitHub.
2. *Add New → Project* e importe `central-startup`.
3. Não mexa em build nem em output: o `vercel.json` do repositório já diz o que fazer.
4. Clique em *Deploy* e espere.

**O deploy vai subir e o site vai responder 503.** É o esperado: sem as variáveis, a central se recusa a funcionar em vez de inventar configuração.

Anote o endereço que a Vercel gerou, algo como `https://central-startup.vercel.app`. Ele é o `PUBLIC_ORIGIN`.

## Etapa 3 — Login do Google

No [Google Auth Platform](https://console.developers.google.com/auth), com o endereço da etapa 2 em mãos:

1. **Branding** — registre a aplicação. Sem isso o console não libera a criação do cliente.
2. **Audience** — escolha **External**. O tipo Internal exige uma organização do Google Cloud, que conta Gmail comum não tem. Pode deixar o status em *Testing*.
3. **Clients** — *Create client*, tipo *Web application*.
4. Em **Authorized redirect URIs**, acrescente exatamente:

   ```
   https://SEU-ENDERECO.vercel.app/auth/callback
   ```

   Sem barra no fim, em HTTPS, com esse caminho. Qualquer diferença vira `redirect_uri_mismatch`.
5. Copie **ID e segredo na hora**. O segredo aparece uma única vez; depois o painel só mostra os quatro últimos caracteres.

A central pede apenas os escopos `openid` e `profile`. Por isso o Google dispensa este projeto de cadastrar usuários de teste, da expiração de sete dias e da verificação de aplicativo.

## Etapa 4 — Variáveis e redeploy

Na Vercel, em *Settings → Environment Variables*, ambiente **Production**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a URL com pooling da etapa 1 |
| `PUBLIC_ORIGIN` | o endereço da etapa 2, sem barra no fim |
| `OIDC_ISSUER` | `https://accounts.google.com` |
| `OIDC_CLIENT_ID` | o ID da etapa 3 |
| `OIDC_CLIENT_SECRET` | o segredo da etapa 3 |

Depois vá em *Deployments*, abra o último e use *Redeploy*. **Variável nova só vale para deploy novo**: sem o redeploy, o site continua em 503.

## Etapa 5 — Conferir

Abra `https://SEU-ENDERECO.vercel.app/health`. A resposta esperada é:

```json
{"status":"ok","mode":"oidc"}
```

Se vier `ok`, o código subiu, o banco respondeu e a descoberta do Google funcionou. Aí abra a raiz do site: a trajetória aparece e `/jornal` leva ao login do Google.

## Etapa 6 — Liberar as sete pessoas

Autenticar no Google não basta: a central só deixa entrar quem tem vínculo. O identificador do Google (`subject`) não aparece em painel nenhum, então ele é descoberto na primeira tentativa.

Para cada pessoa:

1. Ela abre o site e tenta entrar. O Google autentica e a central recusa com *"Esta identidade ainda não foi convidada"*.
2. Você abre os logs da Vercel (*Deployments → o deploy em produção → Runtime Logs*) e procura a linha `Identidade autenticada sem vínculo com um membro`. O campo `oidcSubject` é o valor que você precisa.
3. Com o `.env` local preenchido assim, na raiz do repositório:

   ```
   OIDC_ISSUER=https://accounts.google.com
   ```

   O `DATABASE_URL` não precisa ser repetido: `npm run member:bind` também lê o `.env.local` que a Neon mantém.

   execute, trocando o ID e o subject:

   ```
   npm run member:bind -- guilherme 109876543210987654321
   ```

4. Ela tenta entrar de novo e passa.

Os sete IDs são fixos: `jose-isaias`, `clara-prado`, `amanda`, `julia-alves`, `igor`, `guilherme`, `jose-roberto`.

`.env` e `.env.local` ficam fora do Git, mas o segundo contém a senha do banco de produção. Trate os dois como senha: nada de colar em conversa, issue ou captura de tela.

## Quando algo falha

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Tudo responde 503 | falta variável, ou o redeploy não aconteceu | confira as cinco variáveis em Production e redeploy |
| 503 só às vezes | conexões esgotadas no banco | use a URL com pooling |
| `redirect_uri_mismatch` | o URI no Google não bate | compare caractere a caractere com `PUBLIC_ORIGIN/auth/callback`; mudanças levam até algumas horas |
| "Esta identidade ainda não foi convidada" | falta o vínculo | etapa 6 |
| "Entrada expirada. Inicie novamente." | o login demorou mais de 10 minutos | tente de novo |
| Erro de conexão com o banco | falta `sslmode` ou a URL foi cortada | cole a URL inteira, como o provedor deu |

Os logs ficam em *Deployments → Runtime Logs*. Erros de servidor aparecem lá com a mensagem real; o visitante vê só o texto genérico.

## O que continua pendente

- **Lembretes diários não rodam.** O timer existe no servidor local, mas o handler serverless não o executa. Em produção isso exige uma rota de cron com segredo próprio, ainda não construída.
- **O fluxo de login nunca rodou contra o Google de verdade**, nem tem teste automatizado. O primeiro acesso é o primeiro teste real.
- **Backup não é automático.** `npm run backup` exporta sob demanda; o PITR do provedor é o complemento recomendado.
- **A prévia local continua sendo a prévia local.** O seletor de integrante não autentica ninguém e só funciona em loopback; em produção ele não existe.
