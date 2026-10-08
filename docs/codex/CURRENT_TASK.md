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

## Additional authorized task (2026-10-08): Fail-closed rule evaluation and truthful history

The user reaffirmed autonomous work on CRM security and functionality after PR #85.
This scope extends the previous automation hardening task:

- Never match `equals` / `not_equals` on missing event fields or undefined rule values.
- Reject malformed conditions, unsafe data paths, unsupported operators, and
  invalid action delay/configuration before attempting any runtime side effects.
- Keep raw exception contents out of persisted automation errors.
- Distinguish a genuinely running execution from skipped, and label planned
  action types without claiming they were executed.
- Add regression tests for these behaviors, preserving legitimate
  `is_empty` / `is_not_empty` and explicitly configured null comparisons.

Allowed additional files:
- `docs/codex/CURRENT_TASK.md`
- `src/services/automationRuntimeCore.ts`
- `src/services/automationRuntimeCore.test.ts`
- `src/services/AutomationRuntimeService.ts`
- `src/services/AutomationService.ts`
- `src/types/automation.ts`
- `src/components/automations/HistorySheet.tsx`
- `src/lib/automation-runtime-service.test.ts`
- `src/lib/automation-runtime-fail-closed.test.ts`

Validation via CRM PR CI: TypeScript, unit/regression tests, lint, build, diff review.
Commit and PR are authorized for a non-production candidate branch. No production
merge, data mutation, migrations, external automation runs or paid model tests.
Preview promotion is permitted only after the exact merged candidate passes CI.

## Additional authorized task (2026-10-08): Automation service integrity batch

User explicitly asked to combine 4-5 related CRM improvements per PR. This batch:
1. Surface failed tenant-scoped reads instead of showing fabricated empty lists/history.
2. Require affected-row evidence on toggle, update and deletion before returning success.
3. Whitelist user-writable automation fields, protecting tenant, identity, counters and audit fields.
4. Validate activation against supported deterministic runtime triggers/actions and stored config.
5. Add executable unit tests plus service-contract regression tests; no paid calls or data writes.

Allowed scope: `docs/codex/CURRENT_TASK.md`,
`src/services/AutomationService.ts`,
`src/services/automationMutationPolicy.ts` (new),
`src/services/automationMutationPolicy.test.ts` (new),
`src/lib/automation-runtime-service.test.ts` and
`src/lib/automation-runtime-fail-closed.test.ts`.
The pre-existing runtime is unchanged. No migration, credential change, new public
permission, execution of real automations, production deployment, or paid models.
Commits and a PR to the non-production candidate are authorized; merge only
after required PR CI green on exact HEAD, and Preview only after CI on merge SHA.
Concurrent counter updates and live tenant-RLS verification remain open issues.


## Additional authorized task (2026-10-08): Browser smoke readiness race

After human merge of CRM PR #87 to non-production candidate SHA
`332fa206d91bfb9ba89347c56bd93a46295acf98`, exact-SHA CI
failed solely in desktop login visibility smoke. Its persisted browser
artifact shows that the same login heading appears later during keyboard
navigation, confirming a timing-related false negative.

Allowed files for this narrowly scoped repair:
- `docs/codex/CURRENT_TASK.md`
- `scripts/browser-smoke.mjs`

Fix: wait for the real visibility of each login/registration control within
a bounded timeout; retain the same assertion names and a failed result when
elements never become visible. No skipped assertions, disabled smoke, or
production changes. Commit/PR to `product/hardening-release-candidate`
are authorized by user's request to continue safe work. CI must pass on
the fix PR and merge SHA before single promotion of Preview. No live
CRM automations, migrations, credentials, or paid model calls.


## Additional authorized task (2026-10-08): Truthful automation UX batch

Following the verified #87 + #89 Preview, the user asked to keep evolving CRM
with 4-5 related improvements per pull request. This batch covers:
1. Remove false "automatic execution blocked" and false "0% success" when
   no executions occurred; explain supported runtime scope without claiming
   full production readiness.
2. Show historical fetch errors explicitly rather than displaying an empty
   history; preserve loading and prevent stale response from another flow.
3. Catch action/network failures with visible toasts and block repeat in-flight
   toggle/delete/duplicate interactions.
4. Make modal save notice accurately reflect whether the flow remains active
   or paused; avoid duplicate form submission, preserve the state on edit.
5. Add UI/source regression tests for all above.

Allowed changes: `docs/codex/CURRENT_TASK.md`,
`src/app/(dashboard)/automations/client-page.tsx`,
`src/components/automations/HistorySheet.tsx`,
`src/components/automations/NewAutomationModal.tsx`,
`src/lib/automation-runtime-fail-closed.test.ts`.
No database schema/policies, service/backend semantics, credentials, live
automation runs, paid calls, migrations or production release. Commits and a
PR against non-prod candidate are authorized; wait for CI of exact HEAD
before merge, CI of merge SHA before single Preview promotion. Manual merge
to main stays mandatory.

### CI follow-up: product truthfulness regression assertion

CI run 37819750265 found one outdated source-contract test still requiring the
removed 'Execução Automática / Bloqueada' presentation. Update only
`src/lib/automation-product-truthfulness.test.ts` to assert the new truthful
active/paused metrics and explicit absence of the misleading blocked claim.
Do not revert the interface fix or weaken other product assertions.


## Additional authorized task (2026-10-08): Commission and campaign integrity batch

After CRM Preview #90 passed exact-SHA CI, Vercel and browser evidence,
continue autonomous safe development in a grouped 4-5-block PR. Scope:
1. Restrict campaign creation/update to known business fields, validate
   non-empty name, finite non-negative monetary/rate values and field types.
2. Restrict commission payment mutation to commission-specific columns;
   require an explicit paid/pending status and finite non-negative amount
   for paid status; set payment timestamp server-side, clear it on reset.
3. Require tenant-scoped affected-row evidence for campaign updates/deletes,
   scenario deletes, and won-deal commission updates; no false success on zero rows.
4. Throw sanitized errors on reads instead of inventing empty
   goals/campaigns/scenarios/commission statements.
5. Add executable pure policy regression tests and server-action source
   assertions for the fail-closed boundaries.

Allowed files:
- `docs/codex/CURRENT_TASK.md`
- `src/app/(dashboard)/goals-commissions/actions.ts`
- `src/lib/commission-campaign-integrity.ts` (new)
- `src/lib/commission-campaign-integrity.test.ts` (new)
- `src/lib/goals-commission-integrity-contract.test.ts` (new)

No new or altered RBAC role policy, schema/migration, privileged database
access, credentials, production deployment, real financial record mutation
or paid model calls. In particular, the rights to approve commissions
remain unresolved in issue #61; this change does NOT close that security
gate. Commits/PR against the nonproduction candidate are authorized,
with exact-HEAD CI before merge and merged-SHA CI before Preview promotion.


## Additional authorized task (2026-10-08): Harden legacy goals actions

After PR #91 merge to the non-production CRM candidate, avoid preserving a
duplicate, less-secure API in `goals/actions.ts`. Implement a grouped batch:
1. Delegate duplicate campaign CRUD/reads to the previously hardened canonical
   `goals-commissions/actions.ts` functions; keep legacy route revalidation.
2. Strictly validate user goal amounts and nested goal/commission rules,
   whitelisting writable columns and checking tenant-scoped affected rows.
3. Keep personal scenarios owned by the authenticated user when reading,
   saving, and deleting; do not permit user_id/organization_id spoofing.
4. Validate scenario distribution before any financial goal updates:
   finite positive revenue, quarter percentages, exact user set/weights,
   no silent fallback from invalid custom weights to equal distribution,
   and no success with missing affected profile rows.
5. Add pure unit tests and server-action regression/contract tests.

Authorized paths: `docs/codex/CURRENT_TASK.md`,
`src/app/(dashboard)/goals/actions.ts`,
`src/lib/goal-mutation-integrity.ts` (new),
`src/lib/goal-mutation-integrity.test.ts` (new),
`src/lib/goals-actions-security-contract.test.ts` (new).

Do not invent sales/commission approval RBAC: the decision remains issue #61.
Do not execute financial writes, deploy production, change schema/migrations,
access credentials, call paid AI or modify RLS. Work in a dedicated branch;
CI must pass for exact PR SHA prior to merge into candidate, merge SHA must
pass before a single Preview promotion.


## Additional authorized task (2026-10-08): Executable offline automation integration checks

After merging CRM PRs #91/#92 into nonproduction candidate, create 4-5
behavioral tests for actual AutomationRuntimeService execution with a fake
Supabase adapter and mocked ActivityService, without calling live services:
1. Matching deal_created event creates one task, confirms success and counters.
2. Duplicated event unique-constraint claim safely skips task creation.
3. Nonmatching conditions persist skipped status without tasks.
4. Failed task persists sanitized failed status; failed finalization must not
   report success or rewrite a success as a failure.
5. Cross-tenant or malformed event identifiers/payloads fail before database
   reads/side effects (validating event identity prior to querying automations).

Authorized paths only:
- `docs/codex/CURRENT_TASK.md`
- `src/services/AutomationRuntimeService.ts`
- `src/services/AutomationRuntimeService.integration.test.ts` (new)

Preserve runtime action/trigger semantics, no migrations, data mutations on live
Supabase, external integrations, credentials, paid model calls, permission
expansions or production merge. PR against the nonproduction candidate.
CI TypeScript/lint/tests/build/browser must pass at PR exact SHA and merge SHA
before a single Preview promotion.


## Additional authorized task (2026-10-08): Activity service integrity batch

Following CRM PR #93 in the nonproduction candidate, address confirmed
activity integrity gaps in five related blocks:
1. Read errors for activities/upcoming tasks do not masquerade as empty lists.
2. Related deal/account lookups fail closed rather than silently discarding
   relationship labels on a database error.
3. Tenant-scoped update/delete must confirm affected activity row before success.
4. Creating/updating activities with a deal or account reference checks that
   the referenced record belongs to the same organization, before mutation.
5. Server action for manual activity creation forces `source: 'manual'` so
   external clients cannot masquerade as the internal automation runner;
   add offline regression tests with fake Supabase clients.

Authorized files: `docs/codex/CURRENT_TASK.md`,
`src/services/ActivityService.ts`,
`src/app/(dashboard)/activities/actions.ts`,
`src/services/ActivityService.integration.test.ts` (new).

No change to UI behavior beyond truthful error propagation, no schema/RLS
migration, new access rights, external activity creation, paid LLM calls,
credentials or production release. Prepare PR against the non-production
candidate and require full CI for exact PR SHA; merge and Preview only once
the corresponding safe gates are independently green. Do not assume real
cross-tenant tests are covered by offline mocks.


## Additional authorized task (2026-10-08): Deal service tenant and mutation integrity batch

After CRM PR #94 is fully verified in nonproduction Preview, harden DealService in five related blocks:
1. Resolve deal visibility roles only from the authenticated user's profile inside the current organization, and reuse the same fail-closed decision in pipeline/detail/update/stage/duplicate paths.
2. Tenant-scope profile lookups and stop presenting failed pipeline/profile/account queries as valid empty data.
3. Prevent non-manager users from duplicating opportunities they could not read under the existing owner visibility rule.
4. If duplicated products cannot be persisted, roll back the newly created duplicate and never report a partial clone as success.
5. Make product removal/bulk removal/reorder validate inputs, inspect Supabase errors and confirm affected tenant-scoped rows; add offline regression/contract coverage.
6. Enforce the already-defined `deals:change_owner` permission whenever `owner_id` is mutated, and verify that the target owner profile belongs to the same organization.

Authorized paths:
- `docs/codex/CURRENT_TASK.md`
- `src/services/DealService.ts`
- `src/services/DealService.integration.test.ts` (new)
- `src/app/(dashboard)/pipeline/actions.ts`
- `src/lib/pipeline-actions-security-contract.test.ts` (new)

Do not change the RBAC matrix or invent new roles/permissions, do not apply migrations, mutate live data, call paid models, expand access or merge production. Preserve the existing permissions model: ordinary deal updates require `deals:edit`, owner reassignment requires the already-defined `deals:change_owner`. CI must pass on the exact PR SHA and merge SHA before Preview promotion.


## Additional authorized task (2026-10-08): Account service persistence integrity batch

After the deal-service batch is technically green, harden AccountService without changing customer RBAC policy:
1. Account/manufacturer reads must surface database failures instead of returning trustworthy-looking empty lists.
2. Account creation must inspect contact/branch writes and compensate the just-created account/children if the aggregate creation cannot complete.
3. Account update/delete must confirm the tenant-scoped account row actually exists/is affected before returning success.
4. Contact/branch replacement during update must inspect every delete/insert result and attempt compensating restoration from a tenant-scoped snapshot if replacement fails; never report success after partial failure.
5. Bulk import must inspect contact writes, fail the affected row truthfully, and prevent email-based upsert from silently moving an existing contact between accounts.
6. Add offline behavioral regression coverage with a fake Supabase adapter.

Authorized paths:
- `docs/codex/CURRENT_TASK.md`
- `src/services/AccountService.ts`
- `src/services/AccountService.integration.test.ts` (new)

No new permissions, no migration/RLS changes, no live Supabase writes, no paid calls, no production merge. This work branch does not trigger CI; create a dedicated validation branch only after the preceding candidate integration is complete.


## Additional authorized task (2026-10-08): Contact service tenant and mutation integrity batch

After the account-service batch is technically green, harden ContactService in five related blocks:
1. Contact list/read failures must not masquerade as valid empty collections.
2. Duplicate email/mobile checks must fail closed on database errors and avoid raw PostgREST OR-filter construction from user input.
3. Creating or updating a contact with an account reference must verify that the account belongs to the same organization.
4. Contact updates must apply the same duplicate constraints as creation while excluding the contact being edited.
5. Tenant-scoped update/delete must confirm the row actually affected before returning success; add offline regression coverage.

Authorized paths:
- `docs/codex/CURRENT_TASK.md`
- `src/services/ContactService.ts`
- `src/services/ContactService.integration.test.ts` (new)

No new permissions or RBAC assumptions, no migrations/RLS changes, no live Supabase writes, no paid model calls, no Preview or production merge from this work branch.
