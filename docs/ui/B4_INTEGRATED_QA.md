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


## Primeiro E2E autenticado real (run 44228227063)

Primeiro teste iniciou no Staging do HEAD `e5b0dd7`. PASS em validação do Preview, geração de autorização temporária de SSO, criação/confirmação dos 4 usuários fictícios, instalação do navegador, autenticação inicial suficiente para alcançar a inspeção axe. O smoke encontrou **1 resultado axe `incomplete`**; o gate permaneceu FAIL, sem gerar recibo final de PASS. A autorização temporária de SSO foi revogada com sucesso na etapa de cleanup.

**Correções subsequentes na mesma PR:** detalhamento exclusivamente sanitizado de `incomplete` (ID da regra, contexto do teste, tag e cores CSS computadas e de ancestrais; sem texto, HTML, seletores, URL, captura, dados pessoais) e registro `::add-mask::` antes de exportar o token temporário de SSO para o CI. A execução anterior expôs o valor do bypass temporário em logs de ambiente do Actions; o token foi revogado e não deve mais ser considerado válido. Não reclassificar `incomplete` como PASS. Novo E2E depende de Staging no novo HEAD e aprovação humana do environment protegido.

## QA autenticado #20 — diagnóstico de contraste real e ajustes (18/11/2026)

[Workflow #20](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/44230568480) executou contra o Staging QA SHA `2814863`. No Dashboard desktop/light o teste retornou **18 nós** com `axe color-contrast incomplete`. O gate permaneceu FAIL; a etapa de limpeza revogou a autorização SSO temporária do Vercel.

A inspeção de código identificou superfícies de dashboard translúcidas: `.glass-card` usava `bg-card/80 backdrop-blur-xl`; Header e PageHeader usavam `bg-background/90 backdrop-blur-xl`. Também havia rótulos com opacidade artificial e textos brancos em superfícies claras, além de um gradiente atrás das iniciais no ranking. Esses problemas foram corrigidos com fundos semânticos **opacos** em light/dark, remoção de opacidade artificial de texto e tokens de texto/fundo apropriados. O runner agora identifica canais numéricos em CSS Color 4 (incluindo OKLCH), fundo/imagem/backdrop e classifica o motivo dos nós `incomplete`, sem gravar texto da interface, seletores, URLs, HTML, capturas ou credenciais.

**Não se trata de PASS:** o B4 continua reprovando qualquer violação ou resultado `incomplete` até novo E2E autenticado no SHA exato, com Staging QA validado e revisão humana.


## Correção concentrada pós-run #32 (18/11/2026)

[Run #32](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/44232821629) retornou FAIL com `axe color-contrast incomplete` em **16 elementos** do Dashboard no desktop/light. Os diagnósticos apontaram fundos que usam gradientes (`bgGradient`), um badge semitransparente e elementos SVG. O provisioning de quatro contas QA, o login real e a revogação do bypass Vercel passaram. A existência de `incomplete` continua reprovando o B4; não é uma violação comprovada nem PASS.

A correção concentrou a mudança em: badges com cores semânticas opacas, fundo decorativo transparente atrás de textos, gradiente SVG de SalesChart convertido em superfície sólida, rótulos do Funil colocados como HTML legível sobre fundo sólido e marcadores fixos `data-qa-region` para localizar cada elemento sem reter conteúdo. O runner deixa de interromper todo o E2E na primeira avaliação do axe: **se encontrar erro, executa uma varredura diagnóstica somente desktop/light das rotas do primeiro perfil, registra contagens e componentes de forma sanitizada e mantém FAIL**. Se todas as verificações passarem, ele executa normalmente a matriz completa de perfis, temas e viewports. Nenhuma regra WCAG foi suprimida.


## E2E real #38 — diagnóstico agregado e remediação B4

Execução autenticada [#38](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/44235726637), SHA `da521084`, ambiente Vercel QA Staging isolado, quatro usuários fictícios e dois tenants. O login e o provisionamento QA foram bem-sucedidos, assim como a revogação do bypass temporário do Vercel. O E2E **falhou, corretamente**, após varrer 22 rotas em modo diagnóstico desktop/light do primeiro perfil: **14 rotas com pelo menos um resultado WCAG não aprovado**. Nem toda rota apresentava `incomplete`; há também violações reais.

| Rota | Regras de violação detectadas | Incomplete |
| --- | --- | --- |
| `/dashboard` | `button-name`, `select-name` | `color-contrast`: 15 nós |
| `/pipeline` | `color-contrast`, `nested-interactive` | Não |
| `/leads` | `button-name`, `color-contrast`, `select-name` | Não |
| `/contacts` | `button-name`, `select-name` | Não |
| `/customers` | `button-name`, `color-contrast` | Não |
| `/activities` | `button-name`, `color-contrast`, `select-name` | `color-contrast`: 5 nós |
| `/contracts` | `select-name` | Não |
| `/products` | `button-name`, `select-name` | Não |
| `/sales` | `color-contrast` | `color-contrast`: 19 nós |
| `/reports` | `color-contrast`, `select-name` | `color-contrast`: 13 nós |
| `/goals` | `color-contrast`, `label` | `color-contrast`: 6 nós |
| `/goals-commissions` | `color-contrast`, `label` | `color-contrast`: 6 nós |
| `/automations` | `button-name`, `color-contrast`, `label` | `color-contrast`: 6 nós |
| `/settings` | `button-name`, `label` | Não |

A partir dessa prova foi feito **um único bloco de correções dentro da PR #218**, nunca em PR adicional: filtro nativo/select com nomes acessíveis nos workspaces; menus icon-only de lead, contato, empresa e produto nomeados; ações de atividades e configurações nomeadas; painel IA sem gradiente sob texto, com controle de expansão por teclado e badges sólidos; gráficos e relatórios com superfícies de fundo opacas; cartão de oportunidade com *drag handle* de teclado independente dos demais botões, eliminando a causa estrutural de `nested-interactive`; campos de comissão nomeados e badges dos cards com tokens de texto legíveis. O runner inclui amostras sanitizadas de regras de violação com apenas *tags*, indicadores booleanos de rótulos e valores numéricos de CSS, sem extrair conteúdo, seletor, URL, DOM completo, cookies, screenshots ou credenciais.

**Estado:** reparações são **candidatas**; somente CI no SHA final + novo Staging `READY` + E2E real autenticado 4 perfis, dois temas e dois viewports podem demonstrar B4 PASS. Não reclassificar `incomplete` como PASS; não reduzir regras axe nem usar bypass do login Supabase Auth. Nenhum merge, produção, migration ou Supabase original foi alterado.
