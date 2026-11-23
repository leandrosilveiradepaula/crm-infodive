# CURRENT_TASK — 2026-11-23: CENTRAL CONFIGURABLE DESIGN SYSTEM CORE (DS0–DS1 + Pipeline drawer pilot)

**Explicit owner authorization:** 2026-11-23 direction to prioritize a single globally configurable Design System (colors, fonts, title sizes, radii, shadows, gradient roles and geometry), followed by “prossiga”. This task supersedes local module-by-module visual retouching as the immediate priority. It does NOT authorize Supabase migrations, production deployment or human merge.

**Repository baseline:** main at a9097aac7c53548f6f0983265c24a90c513b8746. Existing PR #220 is an independent G1 UX DRAFT; do not change its branch or merge it. Open one substantial separate PR for this central core against main, then reconcile #220 later.

**Allowed in this scope:** src/design-system/**; src/app/globals.css; src/app/layout.tsx ONLY to resolve the centrally loaded font; src/components/ui/** for shared UI primitives; src/components/layout/PageHeader.tsx; src/components/pipeline/ViewDealModal.tsx as an end-to-end reference migration; relevant tests under test/**, scripts/**, package.json, .github/workflows/crm-validation.yml to enforce hardcode policy; docs/ux/** and root AGENTS.md/MEMORY.md/docs/codex/CURRENT_TASK.md. Keep untouched all business/server/API actions, RBAC, RLS, migrations, integration and production environment.

**Deliverables:** one authoritative CSS token source with light/dark, semantic aliases and Tailwind 4 mapping; shared typography and base components; no locally defined gradients in the Pipeline drawer; versioned migration plan and per-file debt inventory; a CI guard preventing growth in local hardcoded colors/type/radius/shadows/gradients. Existing nonmigrated visual debt remains explicitly PENDING: run 45239400879 measured 196 affected UI files and 5,536 matching style occurrences. Do not claim global UX acceptance.

**Required validation:** TypeScript, unit tests, build, design-token guard and real synthetic accessibility/browser QA on the same candidate SHA through existing workflows. No false PASS for runtime admin configurator, WCAG across unconverted modules, or production deployment. The PR remains DRAFT while checks and visual gates are pending. A human approves merge into main.

---

# CURRENT_TASK — 2026-11-19: RESTORE UX SOURCE OF TRUTH (documentation and skills ONLY)

**Authorization:** the owner explicitly requested permanent preservation of every UI/UX obligation, AGENTS.md and MEMORY.md instructions, the Clinia visual references, and the UI/UX skill, BEFORE restarting the redesign. This source-of-truth stage is not an authorization to change application screens, database, environments, or production.

**Background:** PRs #215–#218 are merged in main (baseline c04754c9fc9a2800f8cfb34a8db75ac92dd7ec78). B4 authenticated QA #87 passed technically. After reviewing the production interface, the owner explicitly rejected the visual result: modules, navigation, visual patterns and fidelity to the provided Clinia reference remain inconsistent. The claim "UX/UI modernization complete" is withdrawn; technical QA PASS does not equal UX acceptance.

**Permitted for THIS stage:** AGENTS.md, MEMORY.md, this CURRENT_TASK.md, docs/ux/**, a clear notice in docs/ui/B4_INTEGRATED_QA.md, and .agents/skills/** needed for reusable UX review. Record visual requirements, inventories, execution plan, acceptance gates and provenance. Publish one cohesive branch/PR; keep merge exclusively human.

**Prohibited for THIS stage:** changing UI components, app layouts, product flows, customer data, migrations, RLS/auth, environment variables, production, integrations, paid calls, Factory or unrelated repos. Do not copy user-supplied Clinia screenshots into this public repository. Original references remain in private ChatGPT Library.

**Required durable outcome:** root governance points to one authoritative visual contract and reference manifest; a persistent memory of state and failure mode; reusable local agent skill; phased implementation with evidence-based acceptance and honest status. The active task must be replaced with a scoped redesign execution authorization before application refactoring begins.


## NEXT TASK — automatically authorized AFTER human merge of PR #219

The owner has already requested that the agent perform the entire UI/UX redesign, not hand back a plan or request repeated "prossiga" approvals. The present task authorizes source-of-truth preservation on PR #219 only. Once PR #219 is merged by a human and its instructions exist on main, this CONDITIONAL task becomes active without requiring a new human prompt.

**Goal:** finish G0–G5 described in docs/ux/UX_RECOVERY_PLAN.md for the ORIGINAL Infodive CRM: compare the saved Clinia screenshots, close the navigation/IA gaps, consolidate shell, commercial workspaces, operational workspaces, analytics/admin and certify actual visual and functional QA. The screenshots define observed interaction patterns, not clinical business features. Use both .agents/skills/crm-clinia-ux and .agents/skills/ui-ux-pro-max. The executable scripts and full data tables of UI/UX Pro Max are included.

**Allowed application code after activation:** scoped UI presentation files in src/app/(dashboard)/**, src/components/**, src/app/globals.css, relevant UI tests under test/**, authenticated E2E automation/workflows where necessary, and docs/ux/** to record evidence. Keep each PR a substantial end-to-end route-family block with real before/after QA; never open cosmetic PRs just to advance a counter. Preserve login, public proposal and PDF layouts unless specifically needed and reviewed.

**Hard boundaries:** no direct changes to Supabase/migrations/RLS, server actions, API logic, authorization, customer data, currencies, exchange rates, existing CRM product workflows, external integration, secrets, Factory or production. No blind npm install, paid cloud action or preview outside approved quota. If product-wide consistency requires changing business logic, stop ONLY that affected subtask and document a real separate authorization gate; continue safe UI work autonomously.

**Required acceptance before asking a human to merge:** complete route-family functional regression; real authenticated synthetic QA on same commit SHA; comparative visual inspection against original Clinia references, desktop/mobile/light/dark, accessible keyboard and WCAG AA; no P0/P1 discrepancy; documented source-current-target differences. Do not declare release accepted on CI green alone.

**Human gate:** merging each substantial PR into main remains exclusively human. No auto-merge, forced history, production deployment/migration or destructive database change. The agent must keep working autonomously until a real external gate, not stop after each small edit.

---

# CURRENT_TASK — CRM #214 B4: QA integrado e preparação segura da liberação visual

**Autorização:** programa de modernização visual do CRM Infodive acordado pelo proprietário em 17/11/2026 e rastreado em [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). B4 é o fechamento de QA da modernização, **não** uma alteração de negócio nem uma autorização de release. Branch exclusiva `ux-ui/crm214-b4-integrated-qa`, criada no commit B3 revisado e com CI verde `4158fd3be3190464359eae5c9ac02f491fa9dc4d`. PRs cumulativas #215 (B0+B1), #216 (B2), #217 (B3) ainda dependentes de merge humano na ordem correta. PR #213 da Factory é outra trilha e continua intocada.

## Resultado obrigatório

Preparar evidência de que a **interface real do CRM**, e não apenas o harness isolado, funciona e é visualmente consistente nas rotas e operações críticas. Implementar os instrumentos de QA seguros e corrigir regressões exclusivamente de UI dentro deste bloco; **não falsificar prova de autenticação nem substituir Preview por screenshots fictícios**. Se faltarem ambiente de teste, sessão de teste ou autorização de Preview, concluir tudo que for possível sem acesso e registrar exatamente o gate humano, sem inventar PASS.

## Execução B4 em bloco completo

1. **Inventário de smoke E2E**: mapear todas as rotas existentes sob `src/app/(dashboard)/**`, definir casos de navegação/autorização, estados loading/empty/erro, modais, filtros, leitura de tabelas, views, keyboard, mobile/desktop, claro/escuro, e progredir até cobertura dos módulos. Priorizar Dashboard, Pipeline/Kanban e drawer de oportunidade, Leads/Contatos/Empresas, Atividades, Contratos/Propostas, Produtos, Vendas, Relatórios, Metas/Comissões, Automação, Inbox, Service Desk/KB, Settings e Integrações.
2. **Ambiente segregado:** verificar existência de Preview Vercel do **SHA exato** e de contas/tenant de teste com dados fictícios. Se ausentes, não usar ambientes, segredos nem credenciais de produção. Não desativar autenticação/middleware, não copiar `.env`, não criar sessões artificiais como se fossem reais. Configurar a suíte para aceitar URL de teste e sessão legítima fornecidas por meio seguro (CI environment secrets), sem exibir valores e sem publicar traces com dados pessoais.
3. **Automação de validação:** criar testes Playwright E2E operando com rotas Next reais e login de teste autorizado; cenários read-only por padrão; para testar escrita de negócio, **somente** ambiente isolado com tenant/credenciais de teste e autorização específica. Verificar gates de permissão com perfis já existentes, sem alterar policies ou permissões.
4. **Qualidade visual:** screenshots por viewport desktop 1440x960 e mobile 390x844, light/dark, regressões de layout, overflow, contraste/axe A/AA, sem `incomplete` tratado como PASS, navegação por teclado (incl. drag/drop), foco, estado vazio/loading/erro, navegação entre módulos. Persistir evidência sanitizada e vinculada ao **mesmo SHA e Preview deployment ID** quando houver Preview autorizado. Não armazenar dados reais em artefatos.
5. **QA técnico:** `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `git diff --check`; analisar conflitos de mudanças cumulativas e compatibilidade com a PR #213 sem alterar sua trilha. Corrigir problemas reais de apresentação; não se limitar a relatório.
6. **Gate de release:** somente após evidência real e QA, recomendar o merge humano **#215 → #216 → #217** nessa ordem, com reconciliação de diff e CI do SHA integrado em cada etapa. Preferir preservar a linhagem Git dos commits originais ou documentar explicitamente como lidar com squash; nunca auto-merge, nunca alterar a `main` pelo Codex. B4 só deve ser declarado concluído para release quando as rotas reais e os perfis exigidos foram validados.
7. **Handoff de produto reutilizável:** produzir apenas checklist técnico para futura cópia limpa, sem criar repositório novo, sem publicar produto clínico/WhatsApp e sem replicar dados, credenciais ou configurações internas.

## Arquivos permitidos e proibições

- Permitidos: testes E2E, runners/fixtures **fictícias** sob `test/**` ou `tests/**`, configurações de ferramentas de teste sem segredos, relatórios/evidências sanitizadas `docs/ui/**`, correções comprovadamente necessárias em arquivos de apresentação `src/app/(dashboard)/**`, `src/components/**` e tokens `src/app/globals.css` com testes.
- Não alterar negócios em `src/services/**`, `src/types/**`, `src/app/api/**`, server actions, auth/RBAC, Supabase/SQL/RLS/migrations, dados, fórmulas/moedas, integrações financeiras, Factory, PR #213, variáveis de ambiente produtivas ou segredos. Nenhum deploy de produção nem chamada paga.
- Sem Preview/deploy remoto automaticamente; verificar custos/cota e autorização de alvo/teste antes de eventual Preview. Se o Preview de B4 depender de liberação externa, registrar dependência claramente.
- **Não criar PR somente para documentação ou evidência parcial.** Criar PR B4 **draft** somente se a entrega incluir testes E2E reutilizáveis e/ou correções efetivas, com dependência declarada #215/#216/#217; caso contrário, consolidar checklist/evidência no trabalho local/issue e informar gate necessário.
- Sem reabrir B0/B1/B2/B3 para pequenas PRs cosméticas. Ações autorizadas precisam servir diretamente à validação/funcionalidade da interface.

## Critérios de aceite de B4

- Suíte E2E real, sem bypass de auth, por módulos e perfis relevantes, com resultados vinculados ao SHA/Preview (ou bloqueio externo explícito).
- Visual desktop/mobile light/dark e axe, regressões funcionais sem vazamento de dados ou alteração de regras de negócio.
- CI verde no SHA final, e evidência auditável, com aprovação humana antes de qualquer release.
- Nenhum merge em `main`, deploy produtivo, migração, integração externa ou cópia para o CRM genérico feitos pelo Codex.

---

# CURRENT_TASK — CRM #214 B3: padronização visual de todos os módulos restantes

**Escopo e autorização:** programa de modernização integral de UX/UI do CRM Infodive acordado pelo proprietário em 17/11/2026 e documentado na [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). Esta autorização técnica B3 vale **exclusivamente** para a branch `ux-ui/crm214-b3-complete-modules`, criada no SHA `4608ad949b0d6053a796d5d163682620d5b96e4a` da PR #216 (B2). Depende de #215 (B0+B1) e #216 (B2), que ainda NÃO foram mergeadas. Não revoga nem mexe na PR #213 da Factory. Merge exclusivamente humano.

## Missão B3 — bloco inteiro, não só diagnóstico

Completar a **padronização UX/UI no CRM Infodive original** em todos os módulos/rotas do dashboard que ainda não foram migrados em B2, preservando funcionamento e identidade Infodive. Priorizar:
- **Comercial e receita:** `/activities`, `/contracts`, `/proposals`, `/sales`, `/sales-orders`, `/products`, `/price-lists`, `/purchases`, inclusive listas, detalhes, wizards e modais; qualquer editor/visualização de proposta requer conservar layout de documento/exportação.
- **Operação:** `/inbox`, `/automations`, `/service-desk`, `/service-desk/knowledge`.
- **Análises e gestão:** `/reports`, `/goals`, `/goals-commissions`, `/gamification`, `/integrations`, `/settings` e suas subrotas.
- **Rotas adicionais do dashboard:** inventariar todas as rotas realmente presentes na árvore e incluir as que faltarem (exceto as rotas públicas de login, assinatura ou portal, cuja revisão exige decisão separada).

1. Inventariar por rota os componentes, estados default/loading/empty/error, filtros, modais, responsividade e temas; registrar matriz de cobertura e riscos em `docs/ui/B3_*.md`.
2. Reutilizar tokens e primitivas B1+B2 (`PageHeader`, `Button`, `Input`, `Card`, `Table`, `FilterBar`, `PremiumEmptyState`, `ViewToggle` etc). Eliminar divergências visuais reais sem reescrever lógica, telas ou funcionalidades.
3. Garantir que controles interativos tenham semântica de teclado apropriada, estados de foco, nomenclatura, responsividade e mensagens; não transformar elementos de leitura em botões desabilitados. Respeitar o drag/drop e controles existentes.
4. Testar com fixtures inteiramente fictícias as variações de componentes e workspaces remanescentes; adicionar testes de regressão significativos e evidências visuais via harness isolado, com desktop/mobile e claro/escuro; verificar axe WCAG A/AA. Nunca alegar que isso equivale a E2E real.
5. Executar `npm ci` em worktree limpo quando necessário, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` e `git diff --check`. Corrigir regressões B3; se falha externa ocorrer, documentar causa e baseline com evidência.
6. Abrir **uma PR coesa**, em **draft**, apontando para `main` para habilitar CI e declarando: **"DEPENDE DAS PRs #215 E #216. NÃO MERGEAR ANTES DE AMBAS."** O diff será cumulativo até os merges humanos. Reconciliar diff e CI após ambos sem force-push não autorizado.

## Arquivos e limites

- Permitidas alterações exclusivamente de apresentação e composição visual nas rotas remanescentes em `src/app/(dashboard)/**` e componentes de UI associados em `src/components/**`. Preservar `src/components/goals/**` e outros módulos nos quais a apresentação esteja misturada com regra de cálculo, alterando somente classes/elementos visuais sem tocar nas funções de cálculo.
- Não alterar páginas já tratadas no B2 salvo correção necessária em componente compartilhado, com teste e justificativa.
- Proibidas mudanças em `src/services/**`, `src/types/**`, `src/lib/**` de auth/segurança, `src/app/api/**`, server actions, autorização/RBAC, models, contratos de API, lógica de negócio, preço e moeda, faturamento, proposta persistida, contratos, integrações, envio de e-mail e pagamentos.
- Proibidas alterações de banco, Supabase, SQL, RLS, migrations, credenciais, variáveis de ambiente, produção, deploy, Factory, PR #213 e `main`. Nenhuma operação paga.
- Não reproduzir identidade visual da Clinia: apenas aplicar padrões genéricos de organização e usabilidade à identidade própria Infodive.
- Não alterar AGENTS.md sem necessidade de governança geral. Não criar dados hardcoded de usuário/cliente, números de desempenho falsos ou atalhos para passar em testes.
- Se uma mudança essencial exigir regra de negócio ou acesso a ambiente real, documentar o bloqueio concreto, manter a superfície segura e seguir os demais módulos.

## Aceite e handoff

- Matriz integral de módulos/telas do dashboard, cobrindo todos os módulos ainda não padronizados.
- Alterações B3 concentradas em UX/UI e em componentes reutilizados; nenhum serviço/segredo alterado.
- Navegação por teclado, responsividade, light/dark, estados loading/empty/error e acessibilidade avaliados com evidências honestas.
- TypeScript, lint, testes, build e CI no SHA final quando disponíveis; PR única abrangente e documentada.
- Sem merge automático. **B4 (QA integrado, Preview autenticado, release e baseline para cópia futura) é bloco independente e obrigatório** antes de declarar CRM totalmente modernizado.
- Não interromper após apenas inventário ou relatório; implementar o bloco B3 completo até dependência externa real.

---

# CURRENT_TASK — CRM #214 B2: modernização das telas comerciais prioritárias

**Escopo específico:** segundo bloco do programa de interface do CRM Infodive aprovado pelo proprietário em 17/11/2026 e documentado na [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). A fundação B0+B1 está na [PR #215](https://github.com/leandrosilveiradepaula/crm-infodive/pull/215), ainda não mergeada. Esta tarefa de implementação B2 é **separada** de B0+B1, começa no commit `76b79ee0ff120e5744e918de71438c4619fb274c` e só vale para a branch `ux-ui/crm214-b2-core-workspaces`. Não revoga a tarefa #209/PR #213, não altera a Factory e não autoriza release nem merge.

## Missão B2 — executar integralmente em um bloco

Modernizar com identidade visual Infodive consistente e componentes B1, **sem copiar assets/marca/código da Clinia**, o conjunto das telas:
1. Dashboard: cabeçalho, resumo, KPIs, gráficos, filtros e estados.
2. Pipeline/Kanban: cabeçalho, filtros, colunas, cards, drag/drop existente, estados e painel/drawer contextual de oportunidade **somente usando dados, callbacks e operações de negócio já existentes**.
3. Leads, Contatos e Clientes/Empresas: listas, cabeçalhos, filtros, tabelas, formulários, ações, modais e estados de carregamento, vazio e erro.
4. Telas desktop/mobile, claro/escuro e navegação por teclado, preservando acesso por perfil e sem exibir informações a usuários não autorizados.

Fazer primeiro um inventário de cada rota e contrato atual; reutilizar `Card`, `Button`, `Table`, `Input`, `PageHeader`, tokens semânticos, shell e estilos B1. Novos componentes só quando houver justificativa de reúso. Dar atenção à densidade informacional e alinhamento do Kanban; não alterar regras ou integrações para tornar o visual mais interessante.

## Arquivos e trabalho permitidos

- `src/app/(dashboard)/dashboard/**`, `src/app/(dashboard)/pipeline/**` **exceto** `pipeline/proposals/editor/**`, `src/app/(dashboard)/leads/**`, `src/app/(dashboard)/contacts/**`, `src/app/(dashboard)/customers/**`: **somente UI**; não modificar server actions, route handlers, nem o código que consulta/escreve banco.
- Componentes de apresentação estritamente usados por essas telas, por exemplo `src/components/dashboard/**`, `src/components/pipeline/**`, `src/components/leads/**`, `src/components/contacts/**`, `src/components/customers/**`. Não refatorar serviços, permissões ou cálculos escondidos nesses componentes.
- Componentes compartilhados `src/components/ui/**` e estilos `src/app/globals.css` só para corrigir problemas reais de contrato B1, com testes de regressão e justificativa.
- Testes de componentes/UI e fixtures exclusivamente fictícias; harness `test/visual/**`; relatórios e evidências em `docs/ui/**`; este `CURRENT_TASK.md` apenas no escopo B2.
- Se um arquivo misturar UI com regra de negócio, isolar a mudança aos elementos visuais sem alterar fluxo ou semântica de dados. Se for impossível, registrar impedimento específico e não improvisar.

## Proibições

- Não tocar `src/services/**`, modelos de domínio, negócio/precificação, taxas, propostas, contratos, autenticação/RBAC, Supabase, RLS, SQL/migrations, API, dependências pagas, .env/segredos, deploy ou produção.
- Não fazer alterações na PR #215 nem na PR #213, nem mudar `main`. Nenhum merge, nenhuma migração, nenhum acesso a dados reais.
- Não introduzir hardcode específico da Winnicott; o CRM Infodive original continua como alvo e futura base reutilizável.
- B3 (demais módulos) e B4 (release e QA transversal) continuam fora deste escopo. Não atribuir a B2 uma validação E2E autenticada que não foi executada.

## Aceite e entrega

- B2 de ponta a ponta nas cinco áreas, cobrindo todos os estados relevantes e mantendo operações originais.
- Testes específicos de regressão visual/teclado/responsividade e `axe` contra componentes, dados fictícios e também páginas reais se houver ambiente de teste autorizado; evidência honesta de limites.
- TypeScript, lint, Vitest, build, diff check. Resolver falhas antes de propor merge; indicar se algum comando não puder ser executado.
- Criar **uma PR coesa e significativa** após concluir todo B2, da branch B2 para `main`, com aviso explícito **"DEPENDE DA PR #215 — NÃO MERGEAR ANTES DA #215"**, para CI da PR rodar. Depois do merge humano da #215, verificar que o diff da PR B2 contém somente B2 e reexecutar gates no SHA exato. Nunca auto-merge.
- O Codex deve continuar executando até conclusão do bloco B2 ou até dependência externa real, sem encerrar em planejamento/relatório parcial.

---

# CURRENT_TASK — CRM #214: modernização e padronização UX/UI, B0+B1

**Autorização do proprietário (conversa de 17/11/2026):** realizar a modernização da interface do CRM Infodive original, começando pela auditoria (B0) e pela fundação do design system e da navegação (B1). Referência de escopo e aceite: [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). Esta autorização é exclusiva da branch `ux-ui/crm214-foundation`, criada da `main` SHA `b1935c8f6e61ae246eb8958673b2a9e18c3da81f`. **Não altera, revoga, encerra nem reivindica conclusão** da jornada de contratos #209 e PR draft #213. Não autoriza ações na Factory.

## Objetivo técnico autorizado para Codex

Entregar **B0 + B1 juntos em uma PR coesa**, não uma sequência de PRs cosméticas:
1. Inventariar cada rota/tela, variantes de estados e padrões de UI existentes. Encontrar duplicações e divergências objetivas de estilos e componentes. Criar relatório conciso e verificável em `docs/ui/`.
2. Projetar design system original da Infodive, inspirado em princípios de usabilidade das referências da Clinia **sem reproduzir marca, código, materiais ou visual idêntico**. Definir tokens semânticos para cores, contraste, tipo, escala, espaçamento, bordas, sombras, densidade e estados claro/escuro, com documentação.
3. Consolidar primitivas de UI compartilhadas e layout global: `src/app/globals.css`, `src/components/ui/**`, `src/components/ui/theme/**`, `src/components/layout/**`, `src/app/(dashboard)/layout.tsx`, respeitando os contratos públicos de componentes existentes. Alterar chamadores em `src/app/(dashboard)/**` e `src/components/**` **somente quando estritamente necessário para migrar a fundação compartilhada sem quebrar telas**.
4. Adicionar testes focados de componentes/contratos/consistência, checagens automáticas de tokens e padrões que evitem reintrodução de estilos divergentes, e um catálogo visual privado ou não publicado para validar os componentes sem acessar dados produtivos.
5. Executar `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`; verificar rotas, breakpoints, formulários, foco, contraste e light/dark quando ambiente disponível. Se teste/browser ou Preview autenticado não estiverem acessíveis, **registrar o bloqueio**, sem afirmar que foram validados.
6. Só ao concluir B0+B1, criar PR abrangente contra `main`, com diff e relatório; **não mergear**. Reconciliar alterações concorrentes de `main` e da PR #213 conforme necessário, **sem alterar a PR #213 ou misturar a correção de contratos**.

## Limites

- Proibido alterar `src/services/**`, modelos de negócio, cálculos, pagamentos, taxas de câmbio, contratos, autenticação/autorização, políticas RLS, dados ou schema SQL/Supabase; exceção somente após nova autorização explícita.
- Sem alteração de variáveis/segredos, chamadas a serviços pagos, aplicação de migrations, deploy produtivo, merge ou exclusão de ambientes.
- Não substituir arquitetura de dados nem reescrever regras de negócio com pretexto visual.
- Não promover telas da Clinia como cópias; usar apenas referências de UX fornecidas pelo proprietário.
- Não afirmar que o CRM foi testado em navegador apenas com leitura estática de código.
- Se a colisão com `CURRENT_TASK` ou PR #213 impedir o trabalho com segurança, registrar impedimento específico em vez de improvisar.
- Merges em `main` são exclusivamente humanos.

## Entrega e aceite do bloco B0+B1

- Inventário rastreável das telas e inconsistências e contrato de design system.
- Shell e componentes centrais unificados; temas claro/escuro e estados consistentes.
- Testes de regressão e checks de lint/build aprovados no SHA final; checagem de acessibilidade sem falsos positivos.
- PR coesa para revisão humana, indicando riscos/limitações e evidência visual real se disponível.
- **B2 (Dashboard, Kanban e leads/contatos/clientes), B3 (demais módulos) e B4 (QA final/release) ficam planejados na issue #214 e NÃO estão autorizados a serem implementados como parte desta primeira entrega sem novo escopo.**

---

# CURRENT_TASK — CRM #209: escopo vigente para a nova Jornada V2

**Autorização específica do OWNER, em 01/11/2026:** [CRM issue #209](https://github.com/leandrosilveiradepaula/crm-infodive/issues/209), [Factory issue operacional #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055). Esta seção é a autoridade **somente** para uma nova Jornada V2 legítima de CRM #209 admitida depois da incorporação humana deste arquivo na `main`, com `source_commit` imutável que contenha esta seção. Não retroage para journeys anteriores, não reabre Change Sets bloqueados e não atribui código humano à Factory.

## Objetivo e decisão de escopo

Resolver a falha **atual e reproduzível** da `main`: `ContractService.getContracts(organizationId)` usa `createAdminClient()` e somente `organization_id` para listar contratos. `service_role` contorna RLS; um vendedor não pode receber contratos fora de sua titularidade. O antigo filtro gigante `.in('deal_id', visibleIds)` da issue #171 **não existe** no source atual: é proibido implementá-lo ou alegar que foi corrigido nesta jornada. Inspecionar código, chamadas e relacionamentos exatos antes de alterar.

### Arquivos autorizados

- `src/services/ContractService.ts` — leitura paginada, filtros de tenant/proprietário e falha explícita.
- `src/app/(dashboard)/contracts/actions.ts` — sessão, perfil ativo, autoridade server-side e tratamento de erros.
- `src/types/contract.ts` — somente se estritamente necessário para tipos existentes, sem nova semântica.
- `test/*contract*.test.ts` ou `tests/*contract*.test.ts` — testes negativos e positivos focados, sem chamadas de rede.
- `docs/CRM209_CONTRACT_ACCESS.md` — decisão de arquitetura, riscos e evidências da tarefa.
- `docs/codex/CURRENT_TASK.md` — apenas atualização documental desta autorização, se necessária.

Não ampliar arquivos, dependências ou API sem demonstrar necessidade e autorização adicional. Inspecionar `profiles`, `deals`, `contracts`, contratos sem negócio e chamadores existentes. Os papéis existentes são a única autoridade; não aceitar tenant, perfil ou proprietário de argumentos do navegador. Não modificar sem decisão humana explícita a visibilidade de contratos legados sem `deal_id`, transferência concorrente de proprietário ou a matriz de papéis.

### Aceite e limites

- Isolamento por organização e proprietário com filtros aplicados no servidor, sem lista `IN` não limitada, sem leitura parcial silenciosa; paginação total estável por `created_at` e ID único.
- Testes de dois tenants, vendedor/admin/diretoria conforme permissões realmente existentes, mais de 1.000 vínculos, duplicatas, páginas subsequentes, falha no meio da paginação e denegação segura.
- Execução na própria branch exclusiva `factory/journey-<UUID>` da nova Journey V2, vinculada ao novo `source_commit` que contenha esta autorização; nunca reaproveitar PR humano #207, PR histórico #172, SHA de outra jornada ou branches já compartilhadas como produto autônomo.
- Autoriza commits de código somente dentro deste escopo, testes e abertura de PR **não draft quando todos os gates estarem completos**; a `main` publica produção e exige merge humano. Sem auto-merge nem migração, RLS, credenciais, novos serviços pagos, alterações de produção ou dados. Preview real e CI exata conforme política.
- Não usar modelos pagos só para testar, não comprar créditos e não executar o benchmark financeiro SQL. Falhas de prova permanecem bloqueio, sem inventar evidências.

**Este arquivo de governança atualizado é um pré-requisito de source, não uma entrega autônoma.** A Factory só poderá reivindicar autonomia com run/commit/CI/Preview independentes, posteriores ao novo Start válido.

---

# CURRENT_TASK — CRM #171: contratos escaláveis (Factory journey V2)

**Autorização específica para a branch de implementação da issue #171**, vinculada à jornada V2 da AI Product Factory. Este bloco não autoriza alterações no escopo de outras issues, não substitui as regras permanentes de `AGENTS.md` e não concede permissão para produção.

## Escopo e objetivo

Corrigir `ContractService.getContracts` para não enviar todos os IDs de negócios visíveis em um único filtro PostgREST `.in('deal_id', visibleIds)`. Preservar organização, proprietário, RLS, autorização server-side, paginação global e ordenação estável. Cobrir mais de 1.000 vínculos, IDs duplicados, falhas parciais e limites; sem truncar resultados.

## Arquivos permitidos exclusivamente para a issue #171

- `src/services/ContractService.ts`;
- `src/services/ContractService.test.ts` (se necessário, criar);
- testes diretamente relacionados em `test/**` ou `tests/**` (somente contratos e regressão de escopo);
- documentação específica da issue #171, se necessária.

**Proibido:** alterar papéis, políticas RLS, migrations, permissões, credenciais, produção, módulos RBAC #22 ou Service Desk #200; ampliar escopo sem decisão humana. Não utilizar modelos pagos para sondagem. Não criar bypass de autorização.

## Entrega

Uma PR contra `main` para revisão e merge exclusivamente humanos. CI e testes no SHA exato; Preview somente conforme a política real do projeto. A autorização desta seção só vale para a execução da issue #171; não é uma autorização genérica para modificar `ContractService` em outras jornadas.

---

# CURRENT_TASK — CRM #200: Service Desk como módulo do CRM (27/10/2026)

**Decisão atual do operador substitui a tarefa anterior para esta branch.**
A issue CRM #200 e Service Desk #12 autorizam preparar a integração
aditiva do módulo Service Desk ao CRM, sem modificar produção. A tarefa
anterior de RBAC #22 continua válida em seu escopo já entregue e não deve
ser revertida ou duplicada.

## Escopo autorizado para esta branch

- `supabase/migrations/20261027123000_service_desk_crm_module.sql` (arquivo,
  **não aplicar ao Supabase gerenciado**).
- `src/app/(dashboard)/service-desk/**` (página incorporada e ações).
- `src/components/layout/Sidebar.tsx` (somente entrada do módulo).
- `test/service-desk-crm-module.test.ts` (negação de acesso e contexto).
- `scripts/verify_crm_service_desk_pg.py` e `.github/workflows/crm-service-desk-postgres.yml` (PG16 isolado).
- `docs/SERVICE_DESK_CRM_INTEGRATION.md` (contratos/rollback).
- Este arquivo de tarefa.

**Proibido**: promover migration CRM, enviar service_role ao navegador,
copiar tenants demo, criar novo Supabase, cortar Vercel, auto-merge, usar
WIF/modelos pagos ou reativar a PR Service Desk #10 sem recibo válido.
Produção e migration requerem gates humanos separados.

## Critérios para PR

- Reusar `profiles`, `accounts`, `service_contracts`, CRM Auth e
  `crm_internal.current_organization_id()`, sem duplicar esses cadastros.
- Testar autoridade server-side e isolamento no banco; CI real do HEAD,
  TypeScript, Vitest, build e Preview obrigatório por UI.
- PR contra `main` para revisão humana. Nada se considera integrado ou
  certificado até migration aprovada, Preview real e E2E completo.

---

# CURRENT_TASK — CRM P0: RBAC real no servidor (issue #22)

**Decisão atual, 26/10/2026:** PR #198 foi mergeada humanamente na `main=adaea55f88eaa80d12a8b19596189398a3364837`; migration `crm_authoritative_tenant_rls` já aplicada e auditada no Supabase CRM. O proprietário pediu concluir o parêntese de segurança do CRM para então retornar à certificação da AI Product Factory. Esta tarefa atende **somente** o bloqueio P0 de RBAC em Server Actions e APIs, vinculado à [issue #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).

## Objetivo e critérios de aceite

1. Fonte única de papéis/permissões para UI e servidor, mantendo o comportamento visual existente. Os papéis persistidos em `public.profiles.role` são a autoridade; não aceitar role, organização, claims `user_metadata` ou cabeçalho enviado pelo cliente.
2. Verificar sessão, status `active`, tenant no banco e permissão imediatamente antes do uso de `service_role` para mudar usuários/papéis/status, transferir deals, convidar usuários, configurar organização/pipeline, gerenciar integrações, API keys e webhooks. Negar por padrão papel desconhecido, perfil revogado, tenant divergente e erros do banco.
3. Tratar entradas duplicadas (por exemplo, `settings/actions.ts` e `settings/users-actions.ts`, `integrations/actions.ts` e as ações dedicadas de API keys/webhooks). Testar chamadas **diretas** às Server Actions, sem depender do PermissionGate da UI.
4. Prevenir falsificação de trilha de auditoria por Server Action genérica; eventos administrativos devem ter ator e tenant derivados do servidor, com dados não sensíveis. Se não houver garantia transacional entre audit log e mudança de dados, declarar explicitamente a limitação — não declarar auditoria integral concluída.
5. `/api/auth/me` deve negar sessão revogada/sem organização de modo consistente com `requireSessionContext`. Não retornar `isLoggedIn=true` a quem não possui perfil autorizado.
6. Vitest negativos, TypeScript, build e checks no SHA exato; entregar **uma PR** pronta para merge humano, sem auto-merge.

## Escopo autorizado para a branch/PR atual

- `docs/codex/CURRENT_TASK.md` e documentação de segurança deste escopo;
- `src/lib/permission-matrix.ts`, `src/lib/server-authorization.ts`, `src/lib/admin-audit.ts`;
- `src/types/auth.ts`, `src/hooks/usePermissions.ts`;
- `src/app/(dashboard)/settings/{actions,users-actions,audit-actions}.ts`;
- `src/app/(dashboard)/integrations/{actions,apikey-actions,webhook-actions}.ts`;
- `src/app/api/auth/me/route.ts`;
- `src/app/(dashboard)/settings/price-lists-actions.ts`;
- `src/services/{UserService,SettingsService}.ts` (tenant validation before service-role updates);
- testes Vitest sob `test/*-rbac*.test.ts` ou extensões focadas dos testes de auth;
- qualquer outra ação administrativa somente se a prova descobrir bypass direto, registrando sua relevância ao gate #22.

**Fora do escopo:** mais migrações, backfill de tenant, schema de Salesforce/Service Desk, alterações de quotas, mudanças de preços, n8n, modelos pagos, GitHub da Factory e PR #56 de release separado. Não repetir as 17 migrations históricas.

## Gates

CRM `main` publica produção e **somente humano pode fazer merge**. Não alterar Supabase, RLS, grants, Auth, usuários, chaves ou Vercel diretamente. Testes usam mocks/sintéticos. No post-merge da PR #198, verificação Vercel READY / navegador de login real ainda é necessária antes de certificar operação. A emissão de CI verde não é autorização de produção.

Após resolver este P0 e registrar evidências, retornar a `ai-product-factory/docs/FINALIZATION_EXECUTION_CONTRACT.md`.

---

## Tarefa autorizada — CRM issue #22 (29/10/2026; continuação OWNER)

**Esta seção é a autorização ativa somente para a branch
`preview/crm22-rbac-security-evidence` e a PR #202.** O Start real do OWNER
na [issue operacional da Factory #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055),
comentário 6487569648, e o gate humano de escopo aprovado autorizam
concluir a [issue CRM #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).
O escopo Service Desk CRM #200 acima continua histórico e válido para
sua própria linhagem; **não** integra este candidato #22.

A lacuna concreta identificada era consulta global com `service_role`
em `src/app/api/email/sync/route.ts` aos remetentes existentes e às
blacklists, sem filtro por organização. A PR #202 modifica somente os
caminhos necessários ao isolamento da consulta, com denegação em caso de
erro de banco, testes negativos e documentação de escopo:

- `src/app/api/email/sync/route.ts` — chamada do helper com tenant
  proveniente de `requireSessionContext`, sem alterar autenticação;
- `src/lib/email-sync-tenant.ts` — filtro por organização, incluindo
  o vínculo `account_contacts.account_id → accounts.organization_id`;
- `test/email-sync-tenant-rbac.test.ts` — testes negativos de tenant,
  falhas de leitura e respostas inválidas;
- `docs/CRM22_EMAIL_SYNC_TENANCY.md` — causa, escopo e limitações;
- `docs/codex/CURRENT_TASK.md` — reconciliação do escopo autorizado.

Os checks de permissão, auditoria e perfis já presentes na main continuam
sob o contrato RBAC #22 acima; não reimplementá-los sem falha demonstrada.
Não alterar papéis, privilégios, RLS, banco, migrations, credenciais,
integradores externos nem Service Desk. Não executar chamadas pagas de
modelo nem benchmarks. Não alegar que a PR criada por executor externo
foi produzida por Work Units da Factory: a prova ponta a ponta deve
ter sua **própria** linhagem verificável, sem backfill artificial.

**Critérios:** TypeScript, Vitest, build e CI no HEAD exato, Preview
Vercel + browser verificado no mesmo SHA e revisão de autorização;
proteger `main` com merge exclusivamente humano, após gate legítimo.
