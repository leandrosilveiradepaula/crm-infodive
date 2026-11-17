# B0+B1 — auditoria e fundação visual do CRM Infodive

Data da auditoria: 17/11/2026. Escopo: branch `ux-ui/crm214-foundation`, sem alteração de serviços, dados, permissões ou integrações.

## Método e evidência

- Inventário estático feito com a árvore de `src/app/(dashboard)` e os componentes importados pelas suas páginas.
- Foram encontradas 6.909 linhas com utilitários visuais em `src/app` e `src/components`; o número é uma medida de superfície, não de defeitos individuais.
- A verificação automatizada `test/design-system-foundation.test.ts` protege os tokens, contratos de primitivas e a superfície de navegação introduzida neste bloco.
- Não houve navegador autenticado ou Preview disponível nesta execução; portanto, responsividade, foco e contraste foram revisados no código, mas não declarados como validados em interface real.

## Inventário verificável de rotas

| Área | Rotas/telas encontradas | Estado visível no código |
| --- | --- | --- |
| Base | `/`, `/login`, `/debug`, `/portal/[id]`, `/proposals/public/[token]` | login, portal e proposta pública fora do shell; não modificados neste bloco. |
| Visão comercial | `/dashboard`, `/pipeline`, `/pipeline/proposals/editor/[dealId]`, `/leads`, `/customers`, `/contacts`, `/activities` | páginas servidor + clientes; kanban, tabelas, cards, modais e calendário. |
| Receita | `/contracts`, `/sales`, `/sales-orders`, `/proposals`, `/products`, `/price-lists`, `/purchases` | formulários, tabelas, wizard/editor de proposta e páginas de impressão/PDF. |
| Operação | `/inbox`, `/automations`, `/service-desk`, `/service-desk/knowledge`, `/reports` | inbox, builder, Service Desk e relatórios/gráficos. |
| Gestão | `/goals`, `/goals-commissions`, `/gamification`, `/integrations`, `/settings` | tabs, métricas, configurações e integrações. |
| Referência interna | `/design-preview` | catálogo protegido pelo layout do dashboard; não contém dados produtivos. |

Cada rota de dashboard é renderizada pelo mesmo `DashboardShell`. Estados de carregamento, vazio, erro e todos os modais não estão uniformizados integralmente: sua padronização por módulo é B2/B3 e fica fora deste bloco autorizado.

## Achados B0

1. **Primitivas concorrentes:** `src/components/ui/*` e `src/components/ui/theme/ThemeComponents.tsx` divergiam em raio, peso, altura e foco; páginas ainda acrescentam variantes locais.
2. **Shell inconsistente:** o menu exibia “Nexus CRM”, sombras/cores utilitárias locais e não oferecia backdrop para fechar o menu móvel.
3. **Hierarquia desigual:** `PageHeader` usava `font-black` e tracking muito apertado, enquanto cards, tabelas e controles seguiam escalas próprias.
4. **Tokens incompletos:** havia tokens básicos claro/escuro, mas não superfícies, elevação, sutileza semântica, largura de conteúdo ou raios por finalidade.
5. **Cores hardcoded:** há cores em páginas, componentes de proposta/PDF e configurações de tema. As cores do documento/PDF e entradas de configuração corporativa são intencionais e não foram trocadas por tokens de aplicação. As restantes devem migrar por módulo em B2/B3 para evitar mudança visual sem revisão funcional.
6. **Responsividade:** shell usava `h-screen`, gutters reduzidos e menu móvel sem camada de descarte; tabelas já tinham overflow horizontal, mas densidade e breakpoints variam por tela.

## Contrato B1 implementado

- Tokens semânticos para superfícies, estados sutis, elevação, largura de conteúdo e raios em `globals.css`, nos temas claro e escuro.
- `Button`, `Input`, `Textarea`, `Card` e `Table` passaram a concentrar raio, foco, densidade e hierarquia tipográfica.
- Os componentes `Theme*` preservam as assinaturas públicas, mas consomem os mesmos tokens de painel/campo.
- Shell com área de conteúdo centralizada, viewport dinâmica, menu móvel descartável e navegação mais compacta; a marca textual passa a ser **Infodive CRM**.
- Catálogo de componentes movido para dentro do grupo `(dashboard)`, logo é protegido pelo mesmo layout da aplicação.

## Regras de continuidade

- Use tokens semânticos (`bg-surface-raised`, `text-muted-foreground`, `bg-success`) em componentes de aplicação; não introduza hex, `rgb()` ou `hsl()` em `src/components/ui` ou `src/components/layout`.
- Para controles novos, reutilize `Button`, `Input`, `Textarea`, `Select`, `Card`, `Table`, `Badge` e `PageHeader` antes de criar estilos locais.
- Cores de PDFs, previews de proposta e valores configuráveis por organização não são tokens do shell e exigem revisão específica no módulo que os consome.
- B2 deve migrar dashboard, pipeline e CRM; B3 deve aplicar o contrato aos demais módulos e seus estados; B4 requer browser autenticado, Preview e testes de contraste/axe no SHA final.

## Validação desta execução

- `git diff --check`: aprovado.
- `npm ci`: tentado duas vezes. A primeira tentativa falhou ao remover `node_modules/crypto-js` com `ENOTEMPTY` (bloqueio de arquivo do Windows). A segunda ficou sem progresso durante a resolução do npm e foi interrompida para não deixar um processo órfão; ela não instalou os binários locais.
- Por consequência, `npx tsc --noEmit`, `npm run lint`, `npm test` e `npm run build` não puderam iniciar nesta máquina (`tsc`, `eslint` e `vitest` indisponíveis após a instalação interrompida). Este não é um resultado aprovado desses gates.
- Não houve navegador autenticado nem Preview acessível no ambiente desta execução; não há alegação de validação visual real, de breakpoints, foco ou contraste por navegador.
