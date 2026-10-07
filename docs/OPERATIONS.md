# Operações do CRM Infodive

## Objetivo

Este runbook cobre sinais operacionais mínimos do CRM sem depender de um provedor pago de observabilidade.

## Health/readiness

Endpoint público intencional: `GET /api/health`.

- `200`: configuração essencial e consulta mínima ao banco responderam.
- `503`: configuração ou banco degradados.
- A resposta não expõe segredo, usuário ou tenant.
- `version` identifica o SHA quando disponível no ambiente.
- `requestId` e o header `X-Request-Id` permitem correlacionar uma requisição entre cliente, middleware e logs.

O health endpoint é readiness operacional básica; não substitui E2E, alertas ou métricas de negócio.

## Request correlation

O middleware cria um UUID por requisição. Um `X-Request-Id` recebido só é preservado se já tiver formato UUID válido; valores arbitrários são descartados para evitar uso do campo como canal de dados não confiável.

Ao investigar erro de API:
1. registrar o `X-Request-Id` retornado ao cliente;
2. localizar eventos do mesmo request id no provedor de logs;
3. confirmar SHA/version do deployment;
4. validar `/api/health`;
5. só então inspecionar a integração específica.

Nunca registrar tokens, cookies, chaves, payloads completos de clientes ou conteúdo sensível apenas para obter correlação.

## Quality gates

O workflow de CRM executa TypeScript, bloqueio de novos erros ESLint nas linhas alteradas, regressão de vulnerabilidades de dependências, testes, build e `git diff --check`.

O baseline atual de dependências representa dívida herdada e **não** significa que as vulnerabilidades existentes estão aceitas como estado final. Novos aumentos são bloqueados; a dívida deve ser reduzida progressivamente.

## Alertas e observabilidade ainda pendentes

Este baseline não fecha a issue operacional. Permanecem necessários:
- agregação central de erros/traces;
- métricas de latência/erro por endpoints e integrações críticas;
- alertas externos para indisponibilidade/degradação;
- E2E dos fluxos críticos;
- a11y automatizada;
- validação de migrations/schema;
- evidência operacional por release.

Nenhum serviço pago deve ser ativado automaticamente para preencher essas lacunas.
