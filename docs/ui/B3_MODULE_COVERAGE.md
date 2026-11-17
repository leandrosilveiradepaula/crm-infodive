# CRM #214 — B3: cobertura de módulos remanescentes

## Matriz de inventário

| Área | Rotas revisadas | Superfície B3 | Limite preservado |
| --- | --- | --- | --- |
| Atividades | `/activities` | filtros, alternância lista/calendário, KPIs, loading/erro e modal existente | callbacks e ações intactos |
| Contratos | `/contracts` | cabeçalho, filtros, tabela, ações responsivas e estado vazio | assinatura, documento e ações intactos |
| Produtos | `/products` | catálogo, filtros, tabela/cards, modal e estado vazio | catálogo e operações intactos |
| Propostas | `/proposals`, `/pipeline/proposals/editor/*` | revisão de composição; editor/documento não alterado | documento/exportação preservados |
| Vendas | `/sales`, `/sales-orders` | usa tabs, listas e superfícies B1 existentes | pedidos, valores e operações intactos |
| Compras | `/purchases` | rota não presente na árvore desta branch | sem superfície a alterar |
| Operação | `/inbox`, `/automations`, `/service-desk`, `/service-desk/knowledge` | shell/tabs/superfícies compartilhadas; automações usa controles existentes | inbox, automações e Service Desk intactos |
| Gestão | `/reports`, `/goals`, `/goals-commissions`, `/gamification` | relatórios, metas e comissões: filtros, tabs, painéis e foco | cálculos e métricas intactos |
| Administração | `/integrations`, `/settings`, `/price-lists` | cartões, tabs, ações e formulários pelos tokens B1 | chaves, webhooks, RBAC e ações intactos |
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

## Evidência e limites

O harness isolado cobre apenas componentes reais compartilhados com fixtures
fictícias. Ele não equivale a teste autenticado, não usa dados reais e não
executa ações de negócio. Os limites e resultados finais são publicados junto
da PR B3.
