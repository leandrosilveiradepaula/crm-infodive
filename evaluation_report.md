# Relatório de Avaliação de UX - Conversão de Interfaces para Slide (Drawer/Sheet)

Este documento apresenta uma avaliação detalhada de todos os módulos do sistema CRM, analisando onde a substituição de modais centrais (Dialogs) por painéis laterais (Slides/Sheets) traria maior fluidez, melhor aproveitamento de espaço e superioridade na experiência do usuário (UX).

---

## 📊 Resumo Executivo das Recomendações

O uso de **Slides Laterais (Right-side Sheets)** é ideal para visualização de detalhes e formulários densos, pois:
1. **Preserva o contexto:** O usuário continua vendo a lista ou funil de origem ao fundo.
2. **Melhor ergonomia vertical:** Telas de computador modernas são ultra-largas (16:9), tornando o espaço vertical em modais centrais escasso. Slides laterais aproveitam 100% da altura da tela.
3. **Facilidade de navegação:** Permite alternar rapidamente entre itens da lista mantendo o painel aberto (como já implementado na navegação de produtos).

Abaixo está o mapeamento de recomendação por módulo:

| Módulo | Componente Atual | Recomendação | Complexidade / Justificativa |
| :--- | :--- | :--- | :--- |
| **Leads** | `LeadFormModal` (Dialog XL) | **Converter para Slide** | **Alta.** Formulários de leads acumulam muitos dados de qualificação, campos personalizados e histórico. |
| **Leads** | `LeadConversionModal` (Dialog 800px) | **Manter como Modal** | **Baixa.** É um wizard transacional de passo a passo focado em conversão de fluxo único. |
| **Clientes (Contas)** | `CustomerFormModal` (Dialog 800px) | **Converter para Slide** | **Média.** Formulário longo de cadastro corporativo (CNPJ, Endereço, Contatos adicionais). |
| **Clientes (Contas)** | `ViewAccountModal` (Dialog 1200px) | **Converter para Slide** | **Altíssima.** Visualização completa da conta com abas de Ativos, Contratos, etc. Um Slide amplo é perfeito. |
| **Clientes (Ativos)** | `CustomerAssetModal` (Dialog 500px) | **Manter como Modal** | **Baixa.** Apenas adição/edição simples de um ativo específico da conta. |
| **Contatos** | `ContactFormModal` (Dialog XL) | **Converter para Slide** | **Média.** Edição de contatos, incluindo múltiplos e-mails, telefones e cargos. |
| **Contatos** | `SignatureParserModal` (Dialog XL) | **Manter como Modal** | **Baixa.** Ação focada de recortar/analisar imagem da assinatura. |
| **Produtos** | `ProductFormModal` (Dialog 3xl) | **Converter para Slide** | **Alta.** Edição de preços, margens, SKU e tabelas de composição técnica. |
| **Propostas** | `ViewProposalModal` (Dialog 5xl) | **Converter para Slide** | **Alta.** Visualização do PDF e termos da proposta ao lado da lista de propostas. |
| **Propostas** | `ProposalGeneratorWizard` (Dialog 5xl) | **Página Dedicada** | **Altíssima.** Fluxo complexo de criação que já está migrando para rota full-screen. |
| **Contratos** | `ContractViewer` (Modal Fullscreen) | **Converter para Slide** | **Média.** Visualização de minuta e termos do contrato ao lado da tabela principal. |
| **Atividades** | `ActivityModal` (Dialog 2xl) | **Converter para Slide** | **Média.** Edição rápida de tarefas/reuniões direto da visualização em lista/calendário. |
| **Pedidos de Venda**| `OrdersTab` / Dialogs internos | **Converter para Slide** | **Média.** Detalhamento de faturamento e itens do pedido de venda. |

---

## 🔍 Detalhamento por Módulo

### 1. Módulo de Leads
* **Situação Atual:** O cadastro e a edição de leads ocorrem no `LeadFormModal.tsx` (um Dialog central).
* **Problema de UX:** Leads demandam o preenchimento de dados de contato, origem, temperatura do lead, histórico de interações e anotações. A tela fica muito espremida verticalmente no modal central.
* **Proposta:** Converter `LeadFormModal` para um **Slide Lateral**. O usuário poderá ver a lista de Leads ou o Kanban e abrir as informações lateralmente, facilitando a qualificação sem perder o contexto de onde parou.

### 2. Módulo de Clientes (Contas e Contatos)
* **Situação Atual:** Detalhes de contas corporativas (`ViewAccountModal.tsx`) abrem em um modal gigantesco de `1200px` de largura que bloqueia 95% da tela.
* **Problema de UX:** A visualização de contas possui abas de contatos associados, contratos de serviços ativos, histórico de compras e ativos. Isso gera uma enorme carga cognitiva ao cobrir a tela inteira com uma estrutura que não é uma página inteira de fato.
* **Proposta:** Converter para um **Slide Lateral Amplo (ex: `max-w-[850px]`)**. Isso permite que o usuário navegue entre diferentes empresas na lista lateral esquerda e veja os dados da empresa selecionada atualizando dinamicamente no painel direito.

### 3. Módulo de Produtos
* **Situação Atual:** Cadastro e edição de produtos no `ProductFormModal.tsx` (Dialog central `max-w-3xl`).
* **Problema de UX:** Produtos têm precificação em USD/BRL, margens de venda, distribuidores vinculados e composição técnica de peças. A edição desses itens exige abrir sub-tabelas que ficam desconfortáveis em modais tradicionais.
* **Proposta:** Converter para **Slide Lateral** de largura intermediária (`max-w-[650px]`). Permite alterar os valores do produto observando a lista principal para comparar preços rapidamente.

### 4. Módulo de Contratos e Propostas
* **Situação Atual:** O visualizador de propostas (`ViewProposalModal.tsx`) e contratos (`ContractViewer.tsx`) abrem em telas de visualização cheias baseadas em Dialog.
* **Problema de UX:** Como o objetivo dessas telas é leitura e verificação de dados textuais extensos, o layout de folha A4 (vertical) gera grandes faixas vazias nas laterais de modais horizontais centrais.
* **Proposta:** Usar um **Slide Lateral** largo para visualização de documentos. À esquerda, a lista de contratos/propostas permanece acessível; à direita, a folha do contrato é exibida com scroll vertical natural e ações rápidas no cabeçalho ou rodapé fixo.

### 5. Módulo de Atividades (Tarefas e Compromissos)
* **Situação Atual:** O `ActivityModal.tsx` é aberto a partir da agenda ou da lista de tarefas.
* **Problema de UX:** Interrompe o fluxo de planejamento do dia toda vez que o usuário quer ver o detalhe de uma tarefa rápida.
* **Proposta:** Usar um **Slide Lateral compacto** (`max-w-[450px]`). O usuário clica na tarefa no calendário, um painel desliza da direita mostrando a descrição, responsável e checklist de sub-tarefas, e com um clique fora ou tecla Esc ele volta para a visão geral do seu dia.

---

## 🛠️ Plano de Implementação Sugerido (Próximos Passos)

Caso o plano de migração seja aprovado pelo time de produto, recomendamos a seguinte ordem de execução técnica:

1. **Fase 1: Módulos Operacionais de Venda (Leads e Clientes/Contas)**
   - Reutilizar a estrutura do `ProductDetailsDrawer` (que usa o `Sheet` do shadcn) e adaptá-lo para dados de Leads e Contas.
2. **Fase 2: Visualizadores de Documentos (Contratos e Propostas)**
   - Implementar o padrão de slide para leitura de minutas com suporte a ações integradas (aprovar/declinar).
3. **Fase 3: Atividades e Produtos**
   - Converter os modais menores para painéis de apoio contextuais.
