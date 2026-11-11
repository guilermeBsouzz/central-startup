# Evidências versionadas

`qa/` preserva capturas e resultados das rodadas anteriores. Os arquivos mantêm seu conteúdo original; datas, contagens e caminhos internos pertencem à execução que os produziu.

Testes e ferramentas atuais gravam novas saídas em `test-results/`, ignorado pelo Git. Para atualizar este acervo intencionalmente, defina `QA_OUTPUT_DIR=artifacts/qa` antes de executar a suíte ou ferramenta de captura.

Consulte [Operação](../docs/OPERACAO.md) para os comandos e [Implementação](../docs/history/IMPLEMENTACAO.md) para o contexto histórico.
