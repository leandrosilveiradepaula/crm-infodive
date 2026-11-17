# CRM #214 — B2: workspaces comerciais

## Inventário e contrato preservado

| Área | Rota | Contrato preservado | Modernização B2 |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | métricas, filtros de período, ordem/visibilidade dos widgets | barra de período compacta, popover posicionado, foco e geometria B1 |
| Pipeline | `/pipeline` | filtros, arrastar/soltar, atualização de etapa, modal/drawer existente | colunas sem classes Tailwind dinâmicas, densidade e estados de arrasto consistentes, cards acessíveis por teclado |
| Leads | `/leads` | filtros, conversão, enriquecimento, tabela/cards e modal | cabeçalho, filtros, KPIs B1 e estado vazio acionável |
| Contatos | `/contacts` | filtros, ações, tabela/cards e modal | cabeçalho, filtros, KPIs B1 e estado vazio acionável |
| Empresas | `/customers` | filtros, importação/exportação, tabela/cards e modais | ações B1, filtros, KPIs e estado vazio acionável |

Nenhuma ação de servidor, serviço, regra comercial, cálculo, permissão,
autenticação, integração ou persistência foi alterada.

## Componentes reutilizados

- `PageHeader`, `Button`, `Card`, `Input`, tokens de superfície e raios B1;
- `StatsGrid` e `FilterBar`, atualizados para densidade, superfície e foco
  consistentes nos workspaces comerciais;
- `PremiumEmptyState` para estados sem registros/filtros;
- `ViewToggle` com grupo nomeado e estado `aria-pressed`;
- `DealCard` com ativação por Enter/Espaço, mantendo o drag/drop existente.

## Validação prevista

O harness isolado em `test/visual/harness/` inclui a prévia B2 com resumo,
filtros, alternância de visualização e card de oportunidade em coluna Kanban,
com dados fictícios. A evidência deve ser interpretada como visual isolada:
não cobre rotas autenticadas, dados reais, permissões ou callbacks de negócio.

## Evidência executada

No commit `0c48998`, o harness foi executado contra Vite local limitado a
`127.0.0.1`, com Playwright Core, Chrome local e axe-core. Foram aprovados:

- desktop 1440×960 e mobile 390×844, em claro e escuro;
- shell, menu móvel, cabeçalho, resumo, filtro, alternância de visualização,
  card de oportunidade e tabela/formulário do catálogo;
- abertura/fechamento do menu móvel após navegação (`0px` → `-100%`);
- foco visível em ambos os temas;
- axe WCAG 2 A/AA sem violações.

Capturas e resultado estruturado: `docs/ui/evidence/0c48998/`.

Limite: não havia ambiente autenticado autorizado nesta execução. Portanto,
não se afirma validação de Dashboard, Pipeline, Leads, Contatos ou Empresas
com dados, sessão, permissões e operações reais.
