# VOLTA — central da equipe

Central com trajetória em `/` e área de trabalho em `/jornal`. Node.js 24, Fastify, TypeScript e PostgreSQL; a prévia local usa PGlite.

## Executar

Na raiz do repositório:

```sh
npm ci
npm start
```

Abra http://127.0.0.1:4175. No Windows, `iniciar.cmd` inicia a mesma prévia. O acesso demonstrativo funciona somente em loopback; os dados persistem em `.data/preview`, fora do Git.

## Estrutura

| Pasta | Responsabilidade |
|---|---|
| `src/client/` | Páginas, scripts, estilos e recursos do navegador |
| `src/server/` | Aplicação HTTP, domínio, lembretes e banco |
| `scripts/` | Administração, demonstração e ferramentas de QA |
| `tests/` | Testes atuais de integração e navegador |
| `docs/` | Arquitetura, operação, design e registros de implementação |
| `archive/` | Protótipos e testes históricos, fora do runtime |
| `artifacts/qa/` | Evidências históricas versionadas |

## Verificar

```sh
npm run check
npm test
npm run test:ui
npm run test:studio
```

Os testes de navegador usam Chrome; configure `CHROME_PATH` em outro ambiente. Novas capturas ficam em `test-results/`, ignorado pelo Git.

## Documentação

- [Arquitetura e regras de organização](docs/architecture/ARQUITETURA.md)
- [Operação, produção, backup e demonstração](docs/OPERACAO.md)
- [Decisões do núcleo](docs/architecture/DECISOES-v0.3.md)
- [Direção visual](docs/design/DIRECAO-CYERA.md)
- [Registro de implementação](docs/history/IMPLEMENTACAO.md)
- [Créditos dos recursos](src/client/assets/CREDITOS.md)

Produção exige PostgreSQL externo, HTTPS e OIDC configurado. A homologação com provedor real permanece pendente; veja o guia de operação.
