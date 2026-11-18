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


## Gate autenticado no GitHub Actions

A workflow `.github/workflows/crm-b4-authenticated.yml` roda em PRs da branch B4 contra `main`. Enquanto `CRM_B4_QA_ENABLED` (variável de repositório) não for explicitamente ativada, o job de preparação **falha com BLOCKED**; isso é intencional e nunca representa E2E aprovado.

**Pré-requisito de isolamento:** o projeto Vercel `crm-infodive` atualmente tem as mesmas entradas de variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` e `SESSION_SECRET` dirigidas a Preview e Production, sem ambiente customizado. Não ativar o job nem publicar Preview de QA até separar backend, tenant, credenciais e recursos/quotas. Não é seguro presumir que Preview está isolado por ser URL diferente.

Após configurar um Preview não produtivo com backend de teste **realmente separado** e tenant/contas fictícios:

- Criar no GitHub o **environment** `crm-ui-qa` com *required reviewers* e acesso restrito à branch B4. O workflow deliberadamente não cria esse ambiente nem injeta secrets.
- Definir variáveis do repositório `CRM_B4_QA_ENABLED=true` somente depois da aprovação externa; e no environment protegido `CRM_B4_PREVIEW_URL`, `CRM_B4_DEPLOYMENT_ID`, `CRM_B4_VERCEL_TEAM_ID`, `CRM_B4_VERCEL_PROJECT_ID`, `CRM_B4_BACKEND_ISOLATED=true` **somente após confirmar isolamento de backend**. As variáveis podem ficar no environment; `CRM_B4_QA_ENABLED` deve ser de repositório, pois é checada antes de entrar no environment.
- Definir *secrets* do environment `CRM_B4_ACCOUNTS_JSON` (usuários fictícios e apenas rotas permitidas) e `CRM_B4_VERCEL_TOKEN` (somente escopo mínimo de leitura para validar deployment); não compartilhar valores no chat ou em PRs.
- A cada novo SHA/Preview, atualizar URL e deployment ID. O job injeta o SHA revisado da PR de forma independente, consulta a API Vercel para conferir projeto, branch, URL, estado READY e ausência de target de produção, e só então tenta login legítimo.
- Dependências de QA `playwright-core@1.64.1` e `axe-core@4.14.0` são instaladas **apenas no runner isolado**, com versões fixas; sem mudança do package-lock do produto. Chrome do Linux é detectado automaticamente.
- Nenhuma screenshot E2E é publicada por padrão; o output não registra senhas nem cookies. O job não toca banco, produção nem executa ações comerciais de escrita.

A confirmação `CRM_B4_BACKEND_ISOLATED=true` representa um **gate humano**, não um teste automático da separação dos bancos. Não fazer merge da PR B4 enquanto o job não passar de forma autenticada no SHA exato.


Em caso de PASS autenticado, a workflow envia **somente** `results.json` (rotas, perfil numérico, SHA, deployment ID e checks); **não envia screenshots, cookies ou traces**. O artefato expira em sete dias. `CRM_E2E_CAPTURE_SANITIZED` permanece `false`; não habilitar capturas sem revisar conteúdo e proteção de acesso. Resultado inexistente faz a publicação falhar, em vez de emitir evidência vazia.


Mesmo com `CRM_E2E_BASE_URL` em `localhost`, defina `CRM_E2E_BACKEND_ISOLATED=true` **somente após confirmar backend e contas fictícios independentes**: executar Next.js local não garante que os serviços de dados sejam locais. Sem essa aprovação, o runner falha antes de abrir navegador ou autenticar.


## Provisionamento automático de Auth (sem cadastro manual)

Na própria workflow B4, depois de `npm ci` e após aprovação do environment `crm-ui-qa`, o script `test/e2e/provision-qa-auth.mjs` usa a API oficial `supabase.auth.admin.createUser` para criar as quatro contas sintéticas em `lwpjiufsetnpjuoyline`. Reusa apenas usuários marcados como fixtures, rotaciona as senhas por execução e verifica/insere perfis server-owned nos dois tenants de QA. Recusa qualquer outro projeto, qualquer usuário inesperado e a falta da confirmação de isolamento. Não escreve diretamente em `auth.users`.

**Única credencial adicional:** cadastrar no GitHub environment protegido `crm-ui-qa` a chave exclusiva de serviço do projeto Supabase QA como secret `CRM_B4_SUPABASE_SERVICE_ROLE_KEY`. A mesma chave QA deve ser cadastrada de forma server-only encrypted no projeto Vercel QA como `SUPABASE_SERVICE_ROLE_KEY`. Nunca copiar a chave do CRM original. Não compartilhar credenciais por chat ou comentários.

As senhas são geradas criptograficamente no runner, gravadas em arquivo privado `0600` dentro de `RUNNER_TEMP`, e lidas pelo E2E com `CRM_E2E_ACCOUNTS_FILE`. Esse arquivo não é anexado como artifact; desaparece ao encerrar o runner. O secret `CRM_B4_ACCOUNTS_JSON` e o cadastro manual das contas **não são necessários** no fluxo automático. O `QA_BIND_SYNTHETIC_USERS.sql` anterior é um método alternativo e não deve ser executado sobre contas já vinculadas automaticamente.
