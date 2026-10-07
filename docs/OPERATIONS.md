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

O browser smoke do CI também verifica, sem credenciais reais:
- que o runtime inicia de forma determinística com segredo de sessão sintético;
- que `/api/health` falha fechado como `503/degraded` quando dependências externas não estão configuradas;
- que um `X-Request-Id` UUID válido é preservado;
- que um request id inválido é substituído por UUID gerado pelo servidor;
- que API protegida sem sessão retorna `401` com request id;
- que viewport mobile usa largura real do dispositivo e não cria overflow horizontal.

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

O workflow de CRM executa TypeScript, bloqueio de novos erros ESLint nas linhas alteradas, regressão de vulnerabilidades de dependências, política estática de migrations, testes, build e `git diff --check`. Em execução verde, grava `quality-evidence.json` vinculado ao SHA e ao run do GitHub Actions.

O baseline atual de dependências representa dívida herdada e **não** significa que as vulnerabilidades existentes estão aceitas como estado final. Novos aumentos são bloqueados; a dívida deve ser reduzida progressivamente.

## Eventos operacionais estruturados

O CRM emite eventos JSON com `event=crm_operational_event` para sinais que já passam pelos logs da plataforma, sem ativar serviço pago adicional.

Campos permitidos são deliberadamente restritos: área, operação, resultado, request id, duração, status HTTP, contagem e dados de quota não identificáveis. Texto livre inesperado é neutralizado; tokens, e-mails, cookies e payloads de cliente não fazem parte do contrato.

Cobertura atual:
- health/readiness: resultado, duração e `Server-Timing`;
- guard de IA: chamadas permitidas versus bloqueadas por scope, sem usuário/tenant;
- sync de e-mail: resultado do Graph, agendamento/conclusão da extração e contagens agregadas, sem endereço ou corpo de e-mail.

Esses eventos tornam os logs atuais pesquisáveis e mensuráveis, mas **não** equivalem a agregação central, tracing distribuído ou alertas externos.

## Alertas e observabilidade ainda pendentes

Este baseline não fecha a issue operacional. Permanecem necessários:
- agregação central de erros/traces;
- métricas de latência/erro por endpoints e integrações críticas;
- alertas externos para indisponibilidade/degradação;
- E2E dos fluxos críticos;
- a11y automatizada;
- validação dinâmica de migrations/schema contra um banco efêmero ou ambiente de validação;
- retenção/persistência de evidência operacional por release além da janela do artifact do CI.

Nenhum serviço pago deve ser ativado automaticamente para preencher essas lacunas.


## Política de migrations

Toda migration nova ou alterada passa por validação estática no CI. O gate bloqueia:
- autorização baseada em `auth.jwt().user_metadata`;
- `DISABLE ROW LEVEL SECURITY`;
- políticas RLS novas com `USING (true)` ou `WITH CHECK (true)`;
- funções `SECURITY DEFINER` sem `SET search_path`;
- timestamps de migration duplicados, exceto a duplicidade histórica documentada de `20240129000060`.

Esse gate não executa SQL nem substitui um dry-run contra banco. Ele reduz regressões óbvias antes de qualquer aplicação real.


## Release e rollback

O merge em `main` é a fronteira de produção e exige gate humano explícito.

### Pré-release

Antes de aprovar um release:
1. identificar e registrar o SHA candidato exato;
2. exigir CI verde no mesmo SHA;
3. exigir Preview `Ready` quando aplicável;
4. verificar migrations separadamente; migration pendente não é autorizada pelo merge de código;
5. confirmar que não existem blockers críticos conhecidos no assessment de product readiness;
6. registrar o operador humano que autorizou o merge.

### Após o merge

Depois do merge humano:
1. observar o deployment de produção e registrar o merge SHA;
2. validar `/api/health`;
3. confirmar que o SHA/version reportado corresponde ao release esperado;
4. executar smoke checks das jornadas críticas;
5. comparar erros, latência e integrações com o estado anterior;
6. registrar qualquer incidente com request id, SHA e horário.

### Critérios de rollback

Rollback deve ser iniciado quando houver pelo menos um destes sinais:
- health/readiness degradado de forma persistente após release;
- falha crítica de autenticação/autorização;
- perda de isolamento entre organizações;
- regressão que impeça jornada comercial crítica;
- erro de migration que comprometa leitura/escrita;
- aumento severo e sustentado de erros sem mitigação rápida.

### Procedimento de rollback

Código:
1. identificar o último deployment de produção conhecido como saudável;
2. interromper novas alterações até estabilização;
3. restaurar/reverter o código para o SHA saudável usando o mecanismo de deployment aprovado;
4. validar `/api/health` e smoke checks no estado restaurado;
5. manter o release defeituoso como evidência; não reescrever histórico.

Banco:
- migration destrutiva ou de dados não deve ser revertida automaticamente;
- migrations devem preferir forward-fix;
- qualquer reversão de schema/dados requer análise explícita de compatibilidade e risco de perda de dados;
- se houver risco de perda/destruição, é obrigatório gate humano específico antes da ação.

### Evidência mínima de recuperação

Um exercício de recovery só conta como evidência quando registra:
- SHA defeituoso/candidato;
- SHA restaurado ou migration corretiva;
- motivo;
- horário;
- operador;
- health após recuperação;
- resultado dos smoke checks.

Ter um runbook documentado não significa que recovery foi exercitado. O domínio operacional permanece incompleto até existir evidência real de exercício ou incidente reconciliado.
