# Validação visual isolada — B0+B1

## Escopo e isolamento

Validação executada no commit `7eb5eec` em um worktree temporário, com o
servidor Vite limitado a `127.0.0.1:4173`. O harness em
`test/visual/harness/` renderiza os componentes reais do shell e do design
system com dados fictícios. Ele usa stubs locais apenas para sessão, roteamento
e assistente visual; não inicia o middleware Next.js, não acessa Supabase nem
faz chamadas para ambientes remotos.

Esta é uma evidência de componentes isolados. Não é um teste autenticado do
CRM: Dashboard, Pipeline, Contatos e Relatórios reais, suas rotas, dados,
permissões e integrações não foram acessados nesta execução.

## Comando executado

```powershell
# No worktree temporário com dependências isoladas
npm exec vite -- --config test/visual/vite.config.ts --host 127.0.0.1 --port 4173

$env:VISUAL_ARTIFACT_DIR = 'C:\\Users\\Leandro Silveira\\Documents\\crm-next\\docs\\ui\\evidence\\7eb5eec'
$env:CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
node test/visual/run-design-system-validation.mjs
```

O runner usa Playwright Core com Chrome local e axe-core. Antes de cada
inspeção, ele aguarda a troca de tokens claro/escuro ser aplicada; isso evita
avaliar variáveis CSS antes do recálculo de estilo.

## Resultado confirmado

| Verificação | Resultado |
| --- | --- |
| Shell, cabeçalho, menu, botões, cards, formulário e tabela em 1440×960 claro | aprovado |
| Mesma composição em 1440×960 escuro | aprovado |
| Composição em 390×844 claro e escuro | aprovado |
| Menu móvel abre e fecha após navegação para Pipeline | aprovado (`0px` → `-100%`) |
| Foco por teclado no campo de busca, claro e escuro | aprovado (anel de foco visível) |
| axe-core WCAG 2 A/AA, claro e escuro | aprovado, nenhuma violação |

## Evidências

- [Resultado estruturado](evidence/7eb5eec/results.json)
- [Desktop claro](evidence/7eb5eec/desktop-light.png)
- [Desktop escuro](evidence/7eb5eec/desktop-dark.png)
- [Mobile claro](evidence/7eb5eec/mobile-light.png)
- [Mobile escuro](evidence/7eb5eec/mobile-dark.png)
- [Menu móvel aberto](evidence/7eb5eec/mobile-menu-open.png)
- [Foco claro](evidence/7eb5eec/desktop-focus-light.png)
- [Foco escuro](evidence/7eb5eec/desktop-focus-dark.png)

## Correções decorrentes

Durante a validação, foram corrigidos contrastes escuros nos itens inativos do
menu lateral, no botão `ghost`, nas células de tabela e no badge `secondary`.
Os tokens CSS também passaram a ser resolvidos dinamicamente na alternância de
tema. Essas correções pertencem à fundação B1 e são cobertas pelo harness para
evitar regressão.
