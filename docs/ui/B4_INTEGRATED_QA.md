# CRM #214 — B4: QA integrado

## Estado da evidência

- Código visual validado: `55bd68f077de18d25cefb3390ff75fcb8c1054e8`.
- Ambiente local: worktree isolado criado nesse SHA com `npm ci`; nenhuma variável de `.env.local` foi usada.
- Catálogo isolado: PASS em Chrome headless, 1440×960 e 390×844, claro/escuro, menu móvel, foco de teclado e axe WCAG 2 A/AA. As capturas sintéticas e o resultado estão em `docs/ui/evidence/55bd68f/`.
- E2E autenticado contra CRM real: BLOCKED, não PASS. Não há URL de Preview autorizada do SHA, tenant fictício nem conta de teste fornecidos no ambiente. O runner retornou `E2E_AUTHENTICATED_SMOKE=SKIPPED` antes de abrir qualquer alvo.

Esta distinção é intencional: o catálogo usa somente dados fictícios e não equivale a uma sessão autenticada do CRM.

## Matriz de smoke autenticado

| Grupo | Rotas incluídas por padrão | Operação segura |
| --- | --- | --- |
| Núcleo comercial | `/dashboard`, `/pipeline`, `/leads`, `/contacts`, `/customers` | Login real de conta de teste, leitura, shell, menu móvel, claro/escuro, teclado e axe |
| Relacionamento | `/activities`, `/contracts`, `/proposals` | Leitura, tabelas, estados carregados pela rota e navegação |
| Receita | `/products`, `/sales`, `/sales-orders`, `/price-lists` | Leitura e responsividade, sem submissão ou escrita |
| Gestão | `/reports`, `/goals`, `/goals-commissions` | Leitura, tema, overflow, foco e axe |
| Operação | `/automations`, `/inbox`, `/service-desk`, `/service-desk/knowledge` | Navegação e apresentação, sem executar automações ou tickets |
| Administração | `/integrations`, `/settings`, `/design-preview` | Leitura, gates de rota e layout; perfis podem declarar a lista de rotas permitidas |

O runner em `test/e2e/run-authenticated-smoke.mjs` usa o formulário real de `/login`; não cria cookies, `storageState` ou sessões artificiais. Por padrão ele percorre todas as rotas acima nos viewports desktop/mobile e nos temas claro/escuro. Para perfis RBAC, `CRM_E2E_ACCOUNTS_JSON` aceita uma lista de contas de teste e suas rotas autorizadas, injetada exclusivamente como secret protegido.

## Regressão encontrada e corrigida

O primeiro axe isolado identificou `scrollable-region-focusable` como sério no wrapper horizontal de `Table`. `src/components/ui/table.tsx` agora expõe a região com nome acessível e `tabIndex={0}`, de modo que tabelas largas podem receber foco e ser roladas pelo teclado. A regressão é protegida por `test/design-system-foundation.test.ts`; a repetição visual no SHA acima retornou zero violações nos dois temas.

## Gate externo restante para concluir B4 de release

Um responsável precisa disponibilizar, por secrets protegidos do CI, todos os itens abaixo para um Preview não produtivo do mesmo SHA:

1. URL HTTPS do Preview, `CRM_E2E_TEST_TARGET=isolated`, SHA e deployment ID;
2. tenant estritamente fictício, com dados sanitizados;
3. ao menos uma conta de teste por perfil relevante, sem expor valores em logs;
4. diretório de artefatos autorizado e `CRM_E2E_CAPTURE_SANITIZED=true` somente após confirmar que as telas não contêm dados reais.

Com esse gate, executar `npm run test:e2e` no CI. A suíte falha para alvo remoto sem SHA/deployment ID, HTTP remoto, resultado axe `incomplete`, violações axe sérias/críticas, overflow de documento, foco invisível, redirecionamento para login ou falha de navegação móvel. Ela não testa criação, alteração, exclusão, drag/drop persistente ou automações: tais operações exigem autorização específica e fixture descartável.

## Handoff para release humano

Após PASS autenticado vinculado ao SHA/Preview, revisar o diff cumulativo e os checks de cada PR e então considerar a ordem humana `#215 → #216 → #217`; B4 não autoriza merge, deploy, alteração de Supabase ou cópia do produto. A PR B4 deve permanecer draft enquanto o gate autenticado estiver bloqueado.


## Endurecimento da suíte (revisão GitHub)

O inventário executável agora contém 22 rotas estáticas existentes (sem `/purchases`, ausente no repositório, e sem editor de propostas dinâmico). O runner rejeita caminhos externos ou inexistentes, valida HTTP das rotas, exige que `CRM_E2E_EXPECTED_SHA` coincida com o SHA declarado do Preview remoto e falha em **qualquer** violação axe WCAG A/AA. Para gates autenticados do CI, `CRM_E2E_ENFORCE_PASS=true` transforma ausência de configuração em `BLOCKED` (exit 2), em vez de um job falsamente aprovado. Continua pendente Preview não produtivo verificado e contas fictícias para executar o teste real.


## Continuidade B4 — gate protegido e verificação independente

No GitHub foi confirmado que o mesmo cadastro de variáveis de conexão Supabase e de serviço está direcionado a Preview e Production no Vercel, sem ambiente customizado. **Nenhum Preview dessa configuração é qualificado como isolado**. O CI deve permanecer bloqueado, sem deploy automático ou sessão real. Foi adicionado um job específico de E2E apenas para a branch B4: readiness falha por padrão, e o job autenticado exige aprovação de environment, confirmação humana de backend independente, secrets protegidos, Chrome/Linux e validação independente do deployment Vercel por SHA, branch, projeto, URL e status antes de qualquer login. Instrumentação e tests contratuais não equivalem a prova E2E real.
