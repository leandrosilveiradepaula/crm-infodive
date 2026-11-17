# CRM #214 — B3: cobertura de módulos remanescentes

## Matriz de inventário

| Área | Rotas revisadas | Situação comprovada | Limite preservado |
| --- | --- | --- | --- |
| Atividades | `/activities` | filtros, alternância lista/calendário, KPIs, loading/erro e modal existente | callbacks e ações intactos |
| Contratos | `/contracts` | cabeçalho, filtros, tabela, ações responsivas e estado vazio | assinatura, documento e ações intactos |
| Produtos | `/products` | catálogo, filtros, tabela/cards, modal e estado vazio | catálogo e operações intactos |
| Propostas | `/proposals`, `/pipeline/proposals/editor/*` | `/proposals` com estado vazio B1; editor já conforme e intocado para preservar documento | documento/exportação preservados |
| Vendas | `/sales`, `/sales-orders` | `/sales` container B1; `/sales-orders` estado vazio migrado para componente B1 | pedidos, valores e operações intactos |
| Compras | `/purchases` | rota não presente na árvore desta branch | sem superfície a alterar |
| Operação | `/inbox`, `/automations`, `/service-desk`, `/service-desk/knowledge` | Inbox loading em Card; Automações, tickets e KB migrados para ações, campos, cards e estados B1 | inbox, automações e Service Desk intactos |
| Gestão | `/reports`, `/goals`, `/goals-commissions`, `/gamification` | relatórios, metas e comissões: filtros, tabs, painéis e foco | cálculos e métricas intactos |
| Administração | `/integrations`, `/settings`, `/price-lists` | Integrações e Settings com superfícies/ações B1; Tabelas de preço com estado vazio B1 | chaves, webhooks, RBAC e ações intactos |
| Demais | `/design-preview` e rotas B2 | catálogo preservado; Dashboard/Pipeline/Leads/Contatos/Empresas fora de B3 | sem regressão intencional |

As rotas públicas, portal e login não estão no grupo `(dashboard)` e permanecem
fora do escopo por decisão explícita.

## Correções B3

- superfícies de painéis, listas, cabeçalhos e filtros passam a usar geometria
  e sombras semânticas B1/B2;
- botões de ação usam o contrato compartilhado `Button` em vez de combinações
  locais de cor, raio e sombra;
- seletores de período e alternâncias de atividade possuem foco visível,
  nomes acessíveis e estado pressionado;
- a tabela de contratos mantém ações expostas em viewport móvel, sem depender
  de hover;
- cards de integrações usam semântica de artigo e controles com foco.
- Service Desk e Base de Conhecimento substituem campos e ações HTML ad hoc
  por componentes B1, incluindo mensagens, formulário, lista e estado vazio;
- Automações e Configurações têm ações primárias e painéis internos
  normalizados sem alterar callbacks de salvamento ou execução.

## Evidência e limites

O harness isolado cobre apenas componentes reais compartilhados com fixtures
fictícias. Ele não equivale a teste autenticado, não usa dados reais e não
executa ações de negócio. Os limites e resultados finais são publicados junto
da PR B3.

## Evidência executada

No commit `9dceb6a`, a prévia isolada foi servida somente em `127.0.0.1` com
fixtures fictícias. Playwright Core + Chrome local registraram desktop
1440×960 e mobile 390×844 nos temas claro e escuro, menu móvel, tabelas,
cards, filtros, tabs, estado vazio e foco. O axe-core WCAG 2 A/AA não reportou
violações nos dois temas. As capturas e o resultado estruturado estão em
`docs/ui/evidence/9dceb6a/`.

Isso não é evidência de E2E autenticado: nenhuma sessão, dado real, serviço,
Supabase ou produção foi acessado.
