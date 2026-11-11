# Decisões do núcleo v0.3

11/11/2026. Escopo: aplicação local e caminho de implantação, sem publicar serviços.

1. **Monólito modular.** Node 24/TypeScript executado nativamente, Fastify para HTTP, SQL parametrizado e migrações transacionais; cliente HTML/CSS/JS sem nova SPA/framework. Motivo: reaproveitar a trajetória e evitar reescrita por estética.
2. **Banco único.** PostgreSQL compartilhado em produção; PGlite (PostgreSQL embarcado) somente para prévia/testes porque não há servidor PostgreSQL/Docker instalado nesta máquina. Ambos usam o mesmo esquema e comandos SQL. PGlite é de processo único, protegido por lock; não é substituto de homologação no PostgreSQL de implantação. Migração 1 cria o domínio, migração 2 introduz visibilidade documental sem mesclar concessões por hash.
3. **Identidade honesta.** Sem provedor corporativo definido, nenhuma credencial real foi inventada. Prévia em loopback permite explorar sessões de membros; produção recusa modo prévia e exige OIDC/HTTPS/PostgreSQL. A biblioteca OIDC faz descoberta, PKCE, estado, nonce e validação de token; somente identidade previamente vinculada entra. Chaves de sessão ficam hasheadas no banco.
4. **Prioridade separada.** Tarefa, comentário e publicação possuem prioridades próprias. Percentual não é produtividade. Relato e percentual são uma transação, assim como menção/pedido e notificações. Chaves idempotentes e versões protegem reenvios/conflitos.
5. **Notificação interna primeiro.** Entregas no mesmo banco/transação, um modal de eventos por entrada, confirmação por membro e lembretes agrupados em rotina do próprio serviço. Sem broker, websocket, email ou aplicativo de mensagens nesta entrega.
6. **Documentos restritos por padrão.** Importação só MD/TXT até 1 MB, texto escapado na interface; compartilhamento com equipe explícito. Não há indexação externa ou execução de documento. ACL detalhada por grupo/trecho e fontes externas entram na próxima etapa de conhecimento.
7. **Jornal vivo explicitamente.** Primeiro entregar ações atuais corretas. Snapshot diário, corte editorial, fontes GitHub/Linear e IsaiasOS continuam pendentes; a tela não deve afirmar que é edição congelada.
8. **Backup mínimo verificável.** Exportação lógica consistente, hash de integridade e restauração em destino vazio; sessões não voltam. Backup gerenciado/agendado e objetivos RPO/RTO só são aceitos após ambiente real.
