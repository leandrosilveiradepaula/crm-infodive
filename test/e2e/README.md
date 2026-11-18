# QA E2E autenticado (B4)

`npm run test:e2e` testa a aplicação Next real, com o middleware de produção preservado. A suíte só aceita uma sessão obtida pelo formulário de login com uma conta de teste já existente; ela não cria cookies, não injeta sessão e não chama ações de escrita.

O runner é deliberadamente bloqueado por padrão. Sem conta de teste, ele termina com `E2E_AUTHENTICATED_SMOKE=SKIPPED`, sem abrir URL alguma. Contas, URL e identificadores de Preview devem ser injetados apenas por secrets protegidos do CI:

```text
CRM_E2E_BASE_URL=https://preview-autorizado.example
CRM_E2E_TEST_TARGET=isolated
CRM_E2E_PREVIEW_SHA=<sha-testado>
CRM_E2E_EXPECTED_SHA=<sha-da-PR-injetado-pelo-CI-protegido>
CRM_E2E_DEPLOYMENT_ID=<deployment-id>
CRM_E2E_EMAIL=<conta-de-teste>
CRM_E2E_PASSWORD=<senha-da-conta-de-teste>
PLAYWRIGHT_CORE_PATH=<modulo-playwright-da-toolchain>
CHROME_PATH=<navegador-da-toolchain>
```

Para perfis RBAC distintos, use `CRM_E2E_ACCOUNTS_JSON` como um único secret JSON contendo `email`, `password` e a lista `routes` permitida para cada perfil. O runner não imprime e-mails, senhas, cookies ou URLs. Alvos remotos exigem HTTPS, `CRM_E2E_TEST_TARGET=isolated`, SHA e deployment ID; HTTP é aceito apenas em localhost.

Por padrão, a suíte navega em modo somente leitura pelas rotas críticas, nos viewports `1440x960` e `390x844`, nos temas claro e escuro. Em cada rota, ela verifica shell, overflow do documento, foco por teclado e axe WCAG 2 A/AA. Resultado `incomplete` do axe falha a execução para revisão explícita.

Screenshots reais podem conter dados do tenant de teste. Portanto, somente habilite `CRM_E2E_CAPTURE_SANITIZED=true` quando o tenant for comprovadamente fictício e o diretório de artefatos sanitizados for fornecido em `CRM_E2E_ARTIFACT_DIR`. A evidência gravada contém apenas rotas, dimensões, temas, IDs de Preview e achados de axe.


A lista padrão contém **22 rotas estáticas existentes** no grupo de dashboard. A antiga rota `/purchases` não existe nesta árvore; o editor de propostas exige um ID de negócio real e não é navegável sem fixture de teste específica.

Para que a execução autenticada seja um **gate obrigatório**, o job protegido deve definir `CRM_E2E_ENFORCE_PASS=true`. Sem o alvo ou as contas, o runner então encerra com `E2E_AUTHENTICATED_SMOKE=BLOCKED` e código de saída 2, nunca com aprovação. Para desenvolvimento local sem gate, a ausência desses parâmetros continua produzindo `SKIPPED` explicitamente. `CRM_E2E_EXPECTED_SHA` deve vir do SHA de head revisado do PR (não de variável controlada pelo próprio alvo); a URL e o deployment ID também devem ser conferidos independentemente no Vercel antes de executar.

O runner exige zero violações WCAG A/AA do axe, incluindo severidades moderada/menor. Todas as rotas informadas pelos perfis precisam pertencer ao inventário; contas com acesso restrito não tentarão executar a navegação móvel entre Dashboard e Pipeline caso não tenham permissão para ambas as páginas.
