# Acervo de protótipos

Esta pasta preserva fontes e verificações de versões anteriores. Nenhum arquivo daqui é carregado pelo runtime atual nem faz parte dos comandos de aceitação em `npm test`, `test:ui` e `test:studio`.

| Pasta | Conteúdo |
|---|---|
| `prototype-v0.2/` | Protótipo editorial com estado local no navegador |
| `studio-v1/` | Fontes da primeira composição visual |
| `studio-v2-3d/` | Fontes da composição com cena 3D |
| `tests/` | Verificações antigas de smoke, editorial, visual e trajetória |

As versões de studio são recortes de arquivos alterados, não aplicações completas que possam ser iniciadas de forma independente. Seus caminhos e dependências devem ser interpretados no contexto da rodada registrada em [Implementação](../docs/history/IMPLEMENTACAO.md).

Os testes antigos dependem de uma instalação global do REA e de contratos anteriores da interface. Eles são registros históricos; a execução contra o servidor atual não representa a aceitação desta versão. Use `tests/` na raiz para verificar a aplicação atual.

Capturas e resultados antigos permanecem em [artifacts/qa](../artifacts/qa/). Consulte a [arquitetura atual](../docs/architecture/ARQUITETURA.md) para contribuir no código ativo.
