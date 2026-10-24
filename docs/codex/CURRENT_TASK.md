# CURRENT_TASK.md — autorização ativa da AI Product Factory

Este documento registra **somente a tarefa vigente** no CRM. O histórico da tarefa anterior de Relatórios & Insights está preservado integralmente no Git no blob `d5ef70fa250c150c9b9ed3c5eba2045d19ff2069` do commit `463a37d93cd19ef3335ef6dd4c2421761de4f230` (`docs/codex/CURRENT_TASK.md`). O arquivo de arquivo `docs/codex/archive/CURRENT_TASK_FULL_BEFORE_PROOF1_2026-10-23.md` preserva o histórico anterior. Nenhum histórico concede autorização de escrita atual.

## Tarefa autorizada (24/10/2026) — Prova 2 da Factory: entrada do Service Desk no CRM

- Fonte da decisão arquitetural: operador determinou que Service Desk é **módulo do CRM InfoDive**, aproveitando infraestrutura GitHub/Vercel/Supabase existente. Não criar projeto ou Vercel separado.
- Issue funcional/critério de aceite: https://github.com/leandrosilveiradepaula/crm-infodive/issues/194
- Escopo técnico registrado sob a identidade OWNER: https://github.com/leandrosilveiradepaula/crm-infodive/issues/194#issuecomment-6390960882
- Origem do trabalho: **novo** Start OWNER na Factory, na issue operacional #1055, com auditoria e geração atual. A PR original do Service Desk #10 permanece evidência histórica falhada em navegador, sem transferência de status.
- Base autorizada: branch `preview/hardening-release-candidate` no SHA `463a37d93cd19ef3335ef6dd4c2421761de4f230`, ou sucessor **explicitamente repinado** no Control Plane após validação nativa exata do CRM. PR base humana de Preview #56; não usar `main` como base de implementação.
- Restrição de arquitetura: sessão existente do CRM com `getSession()` e `organizationId`; não copiar `tenant_id` nem banco/auth do repositório Service Desk.

### Objetivo funcional delimitado

Implementar uma **entrada real de navegação** para o futuro módulo Service Desk: link acessível no menu do CRM e rota protegida `/service-desk` que usa a sessão atual para admitir apenas usuários autenticados com `userId` e `organizationId` confiáveis. A página deve informar honestamente que **abrir e consultar chamados ainda não estão habilitados** enquanto o backend não for integrado. Não criar/listar tickets falsos, não simular sucesso de API, não exibir identificadores internos de organização e não colocar botões sem ação.

A Factory precisa implementar o código por sua própria rota de execução após Discovery/Product Spec/Planning e backlog real. A documentação de entrada produzida pelo operador não é implementação do módulo nem evidencia de Preview.

### Escopo máximo de escrita

1. `src/components/layout/Sidebar.tsx` — link e semântica de navegação mobile/collapsed.
2. `src/app/(dashboard)/service-desk/page.tsx` — rota protegida reutilizando infraestrutura existente (arquivo novo).
3. `src/lib/service-desk/entry-guard.ts` — guard puro opcional, sem credenciais (arquivo novo).
4. `src/lib/service-desk/entry-guard.test.ts` — testes determinísticos de admissão e ausência de autorização (arquivo novo).
5. `docs/codex/CURRENT_TASK.md` — apenas identidade/recibos do candidato, se necessário.

**Não tocar** outros arquivos: especialmente migrations/schema Supabase, RLS, RBAC, autenticação/sessão existente, APIs/integrações, dependências, templates, n8n, CI/workflows, secrets, Vercel config, pipelines, vendas, cálculos e dados de produção. Não introduzir novas variáveis de ambiente. Sem gravação no Supabase em nenhum ambiente. Se a funcionalidade exigir ampliar escopo ou acesso, parar com blocker explícito, sem permissão implícita.

### Critérios de aceite da implementação da Factory

1. Entrada no menu principal navegável, rotulada e acessível; `aria-current`, foco visível, menu recolhido e mobile preservados.
2. Rota `/service-desk` usando `getSession` do CRM e falhando fechada para `!isLoggedIn`, `!userId` ou `!organizationId`; sem aceitar identificação de organização de query string, corpo HTTP ou browser. Não alterar login.
3. Estado de indisponibilidade funcional explícito e verdadeiro para abertura/listagem de tickets, sem dados fictícios nem CTA inerte.
4. Testes determinísticos do guard e navegação; `npm ci`, TypeScript, lint, `npm test`, build e browser smoke CRM sem relaxar checks existentes.
5. Start OWNER auditado, Product Stage, backlog, execução Direct/roteamento pela Factory, código/commit/PR atribuídos ao runtime, CI exata, reviews e Preview SHA-exato com evidência legítima. Caso não haja sessão autenticada de homologação, declarar blocker de browser, nunca simular PASS.
6. Release em produção continua **exclusivamente gate humano**. Integração na branch de Preview pode ocorrer somente após gates legítimos e não autoriza merge da PR #56 para `main`.

### Governança e custo

Commits/PRs de **código** estão autorizados apenas dentro dos paths acima, em branch não produtiva com PR para `preview/hardening-release-candidate`, **executados pela Factory**, não manualmente pelo ChatGPT. Sem benchmarks, sem paid probes, sem nova compra ou alteração de orçamento. Gates e reserva reais prevalecem.

Este arquivo substitui a tarefa anterior para **novas** jornadas; não modifica runs, Change Sets ou evidências históricas da Prova 1. Não confundir uma landing page modular validada com Service Desk comercial pronto. A Prova 2 segue aberta até todos os gates válidos.
