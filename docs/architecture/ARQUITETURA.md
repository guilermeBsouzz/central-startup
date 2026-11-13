# Arquitetura do repositório

A aplicação é um monólito modular: um servidor Fastify, SQL compartilhado entre PostgreSQL e PGlite e um cliente HTML/CSS/JS sem etapa de compilação. A organização separa código executável, ferramentas, documentação e acervo histórico.

## Diagnóstico e decisões

A raiz reunia arquivos estáticos atuais, um protótipo anterior, documentos de várias rodadas e capturas de testes. O backend também concentrava suas entradas, persistência e comandos administrativos na mesma pasta. A reorganização estabelece destinos claros sem trocar frameworks, dependências, esquema ou URLs públicas.

## Mapa de pastas

```text
central-startup/
├── src/
│   ├── app.mts                # entrada compatível com Vercel
│   ├── client/
│   │   ├── pages/             # journey.html e workspace.html
│   │   ├── scripts/           # comportamento do navegador
│   │   ├── styles/            # estilos atuais e compatíveis
│   │   ├── assets/            # imagens, fontes, licenças e créditos
│   │   └── favicon.svg
│   └── server/
│       ├── app.mts            # fábrica HTTP, identidade e composição
│       ├── server.mts         # processo local e ciclo de vida
│       ├── static.mts         # allowlist de recursos e URLs
│       ├── domain.mts         # regras e rotas de negócio
│       ├── jobs.mts           # lembretes agrupados
│       ├── types.d.mts        # extensões de tipos Fastify
│       └── database/
│           ├── client.mts     # adaptadores, migrações e membros iniciais
│           ├── schema.sql     # esquema inicial
│           └── backup.mts     # snapshot e restauração vazia
├── scripts/
│   ├── admin/                 # backup e vínculo de identidade
│   ├── demo/                  # carga e verificação do cenário fictício
│   ├── lib/qa-paths.mjs        # destino compartilhado das saídas de QA
│   ├── qa/                    # capturas e inspeção visual
│   └── check.mjs              # verificação de fontes atuais
├── tests/
│   ├── integration/           # API, entrada Vercel e recursos estáticos
│   └── e2e/                   # fluxos reais no navegador
├── docs/
│   ├── architecture/          # este mapa e decisões
│   ├── design/                # direção, referências e trajetória
│   ├── history/               # registros das rodadas anteriores
│   └── OPERACAO.md
├── archive/                   # fontes e testes descontinuados
├── artifacts/qa/              # evidências históricas versionadas
├── .data/                     # persistência privada local, ignorada
├── test-results/              # saídas novas de QA, ignoradas
├── server.cjs                 # entrada local de compatibilidade
└── iniciar.cmd                # atalho Windows
```

## Limites e dependências

`src/server/app.mts` compõe identidade, domínio e entrega de recursos. `domain.mts` recebe o contrato de banco que utiliza; não inicia processos nem importa o cliente do navegador. `database/client.mts` é o ponto de seleção do adaptador e carregamento do esquema. `database/backup.mts` exporta operações de persistência, enquanto `scripts/admin/` contém a interface de linha de comando.

O processo local em `src/server/server.mts` abre a porta, executa o agendamento e encerra os recursos. O handler exportado por `src/app.mts` mantém inicialização preguiçosa e não inicia porta nem timers na importação.

`src/client/` é uma organização física dos recursos. O servidor entrega somente os caminhos registrados em `static.mts`, com as restrições de acesso existentes. Essa pasta não deve receber bancos, segredos, documentos importados, backups ou capturas internas. A estrutura de diretórios não concede acesso HTTP automaticamente.

Os recursos privados ficam em `src/client/` para passar pelo servidor e evitar uma pasta publicada automaticamente pela hospedagem.

## Compatibilidade

- `/`, `/index.html` e `/journey.html` continuam entregando a trajetória.
- `/jornal` continua entregando a central e `/jornal/` mantém seu redirecionamento.
- As URLs dos scripts, estilos, `/assets/` e favicon permanecem estáveis; seus destinos físicos mudaram.
- `/expressive.css` e `/vendor/three.*` foram retirados em 13/11/2026 e respondem 404: nenhuma página os carregava. As fontes antigas estão em `archive/`.
- `src/app.mts` preserva o handler padrão e os exports usados pela integração. `server.cjs`, os comandos npm e `iniciar.cmd` continuam sendo entradas públicas do projeto.
- `.data/preview`, o manifesto da demonstração e os destinos de backup não são movidos.

## Mapa da migração

| Antes | Agora |
|---|---|
| HTML, JS e CSS ativos na raiz | `src/client/pages/`, `src/client/scripts/`, `src/client/styles/` |
| `assets/`, `favicon.svg` | `src/client/assets/`, `src/client/favicon.svg` |
| `src/db.mts`, `src/schema.sql`, `src/backup.mts` | `src/server/database/` |
| Demais módulos do backend em `src/` | `src/server/`, com entrada Vercel preservada |
| `src/backup-cli.mts`, `src/bind-member.mts` | `scripts/admin/` |
| Scripts de demonstração e captura misturados | `scripts/demo/` e `scripts/qa/` |
| Testes atuais e antigos misturados | `tests/integration/`, `tests/e2e/` e `archive/tests/` |
| `index.html`, `app.js`, `style.css`, `editorial.css` antigos | `archive/prototype-v0.2/` |
| `historico/` | `archive/studio-v1/` e `archive/studio-v2-3d/` |
| Documentos na raiz | `docs/`, com README de navegação na raiz |
| `qa/` | Acervo em `artifacts/qa/`; novas saídas em `test-results/` |

## Regras de manutenção

1. Coloque código do navegador em `src/client/` e código do servidor em `src/server/`. Entradas na raiz devem apenas encaminhar para a implementação.
2. Registre novos recursos HTTP na allowlist de `static.mts`; não exponha diretórios inteiros por conveniência.
3. Mantenha arquivos dependentes da localização do módulo resolvidos com `import.meta.url`. Caminhos de dados configurados pelo operador mantêm sua semântica de execução pela raiz.
4. Coloque comandos operacionais em `scripts/admin/`, dados demonstrativos em `scripts/demo/` e ferramentas visuais em `scripts/qa/`. Use `scripts/lib/qa-paths.mjs` para resolver os destinos das saídas de QA.
5. Use `tests/integration/` para comportamento de servidor e `tests/e2e/` para fluxos no navegador. O acervo em `archive/` não participa da aceitação atual.
6. Grave saídas geradas em `test-results/`. Use `QA_OUTPUT_DIR=artifacts/qa` somente para atualizar intencionalmente a evidência versionada.
7. Atualize links e este mapa quando um arquivo mudar de responsabilidade. Separe novos módulos por necessidade concreta, sem criar camadas vazias.

## Verificação

Execute na raiz:

```sh
npm run check
npm test
npm run test:ui
npm run test:studio
```

As suítes usam bancos isolados de teste. Configure `CHROME_PATH` para os testes de navegador quando o Chrome não estiver no caminho padrão. A validação local não substitui a homologação de PostgreSQL e OIDC externos descrita em [Operação](../OPERACAO.md).

Verificação da reorganização em 11/11/2026: TypeScript e sintaxe de 21 arquivos JavaScript passaram; 22 cenários de integração, 19 de interface e 12 de experiência passaram. A entrada local `server.cjs` respondeu ao health check e às rotas principais; exportação e restauração pela CLI funcionaram em bancos em memória. A suíte de interface passou a aguardar a renderização dos sete membros após a navegação antes de verificar sua quantidade.
