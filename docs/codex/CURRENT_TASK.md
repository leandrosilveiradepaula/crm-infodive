# CURRENT_TASK.md

## Status
Active

## Objective
Corrigir o gap confirmado em 2026-10-01: `addDealProduct` nao deve inventar `exchange_rate=5.0` quando a taxa nao foi informada.

O usuario autorizou explicitamente a continuidade deste trabalho pela AI Product Factory.

## Allowed scope
- `docs/codex/CURRENT_TASK.md`
- `src/services/DealService.ts`
- `test/present-in-usd-core.test.ts`
- `.github/workflows/crm-validation.yml` (somente para executar os checks obrigatorios deste PR)
- `src/app/api/gemini/enrich/route.ts` (somente para remover a exigencia de GEMINI_API_KEY durante o build; a key continua obrigatoria em runtime)
- `src/app/api/gemini/extract/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/specs/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/parse-company/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/parse-signature/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/debug/page.tsx` (somente para impedir uso de service role durante prerender/build e manter acesso privilegiado condicionado a sessao em runtime)

## CI blocker discovered
- O primeiro CI real do PR passou TypeScript e 92 testes, mas `next build` falhou ao importar rotas Gemini que instanciavam clientes no escopo de modulo sem `GEMINI_API_KEY`.
- A auditoria confirmou o mesmo padrao em `enrich`, `extract`, `specs`, `parse-company` e `parse-signature`.
- A correcao autorizada e limitada a instanciar o cliente apenas no runtime da requisicao, depois de validar a variavel de ambiente.
- Nenhuma credencial sera adicionada ao CI ou ao repositorio.
- O terceiro CI revelou `/debug` prerenderizando sem sessao e chamando `createAdminClient()`, o que exige `SUPABASE_SERVICE_ROLE_KEY` durante o build. A correcao autorizada e tornar a pagina dinamica e criar o cliente privilegiado somente quando houver sessao valida.

## Required behavior
- taxa ausente permanece ausente/null-safe;
- taxa explicita, inclusive zero, e preservada;
- `deal.value` e comissao nao mudam;
- nenhuma migration ou schema change;
- patch minimo e geral.

## Validation
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `git diff --check`

## Commit / PR
Commit e PR estao autorizados. A continuidade foi reafirmada pelo usuario em 2026-10-01. E autorizado adicionar um workflow minimo de CI no escopo acima apenas para executar os checks obrigatorios deste PR. Auto-merge continua proibido. Producao permanece sob gate humano.

## External side effects
Sem deploy, migration, mutacao de dados externos, secrets ou alteracoes de auth/RBAC.

## Additional authorized task (2026-10-02): Reduce Vercel deployment usage

Objective: reduce automatic Preview deployments while CRM and AI Product Factory are worked in parallel.

Confirmed Factory controls:
- `apps/console/vercel.json` disables Vercel Git deployments for ordinary branches and enables only `main` and `preview/**`.
- Factory Preview promotions previously created the `preview/pr-N` ref at the base commit and then moved it to the candidate, potentially creating two deployments per promotion. Factory PR #573 removed that extra base deployment and made repeated promotion of the same SHA a no-op.

Allowed additional CRM scope:
- `vercel.json` at the repository root only, with `git.deploymentEnabled` set to disable ordinary branches, preserve production on `main`, and allow explicit final-candidate branches under `preview/**`.
- `docs/codex/CURRENT_TASK.md` to record this scope.
- No application code, credentials, dashboard-only settings, data, or schema changes.

Operating rule: run the required CI on working branches; create or update one `preview/pr-N` ref only after the exact PR candidate is final and its required checks are green. Do not create a base-commit preview first. Merge to `main` only for a release-ready batch. `ignoreCommand` cancellations are not quota savings because Vercel counts canceled ignored deployments.

Commit, PR, and merge for this narrowly scoped configuration change are authorized by the user's existing project authorization. The merge is expected to trigger one production deployment to install the policy; no other deployment or migration is authorized by this task.

## Additional authorized task (2026-10-08): Verify automation execution finalization

The user reaffirmed autonomous CRM hardening through the Factory. This scoped
follow-up is independent of the historical exchange-rate task above.

Objective:
- Do not report an automation success/failure as durably persisted unless its
  tenant-scoped `automation_executions` row was actually updated.
- Keep operational errors sanitized and prevent missing-field negative
  conditions from firing unintended automations.
- Keep counter-update errors separate from action execution so that a completed
  action is never relabeled as failed because statistics could not be updated.

Allowed files for this follow-up:
- `docs/codex/CURRENT_TASK.md`
- `src/services/AutomationRuntimeService.ts`
- `src/services/automationRuntimeCore.ts`
- `src/services/automationRuntimeCore.test.ts`
- `src/lib/automation-runtime-service.test.ts`

Validation: TypeScript, repository test suite, lint and build through CRM CI;
review the PR diff for unrelated files. Commits and a PR against
`product/hardening-release-candidate` are authorized. Non-production candidate
merge requires green CI and exact HEAD; preview promotion requires green merge
SHA. No migrations, external automation execution, paid model calls or
production merge/release are authorized by this task. Any operational
race/atomic-counter work needing DB changes must remain an explicit follow-up.
