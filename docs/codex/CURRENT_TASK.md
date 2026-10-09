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


## Additional authorized task (2026-10-08): ContactService tenant and persistence integrity

After the AccountService #96 integration, harden the contact service with five bounded blocks:
1. Fail closed on contact/list database read failures rather than presenting valid empty data.
2. Validate the parent account belongs to the current tenant before creating or reassigning contact association.
3. Whitelist mutable contact attributes to prevent ID/tenant/audit/relationship spoofing; never trust caller-supplied organization_id.
4. Reject duplicate-check database errors before creating contacts, and use safe input validation rather than building PostgREST OR filters from unsanitized user email/phone strings.
5. Confirm affected tenant-scoped row before reporting update/delete success, with offline fake-Supabase regression tests.

Allowed paths: `docs/codex/CURRENT_TASK.md`, `src/services/ContactService.ts`, `src/services/ContactService.integration.test.ts` (new).
Do not modify migrations, live data, roles/RBAC policy, credentials or production. Commit and nonproduction PR are authorized. CI and exact-SHA Preview policies remain fail-closed.


## Additional authorized task (2026-10-08): deal product write guards

After PR #97 integrated into the non-production candidate, harden product write paths in DealService:
- Whitelist mutable fields in updateDealProduct, rejecting attempts to overwrite record identity, tenant, deal relation, and audit metadata.
- Fail closed when tenant-scoped catalog verification errors in bulkAddDealProducts.
- Reject bulk insert responses that do not confirm all requested rows, without falsely reporting success.
- Add offline regressions for these three cases.

Authorized paths: `docs/codex/CURRENT_TASK.md`, `src/services/DealService.ts`, `src/services/DealService.integration.test.ts`.
Do not mutate live data, change permissions/RBAC, add migrations, call paid models, deploy production, or merge the main release candidate.


## Additional authorized task (2026-10-08): deal room visibility boundary

Ensure `DealService.getOrCreateRoom` enforces the same tenant-scoped role and owner visibility as deal details before returning or creating a room. Add offline regression for a seller attempting to access another seller's deal. No schema changes, production writes, privilege changes or paid requests. Authorized paths: `docs/codex/CURRENT_TASK.md`, `src/services/DealService.ts`, `src/services/DealService.integration.test.ts`.


## Additional authorized task (2026-10-08): deal product parent access

Ensure single and bulk deal-product insert paths validate the parent deal is visible to the caller under the existing tenant/owner policy before any write. Add behavioral regression for unauthorized owner; update existing bulk tests to include an authorized parent. Scope: DealService and its offline tests only. No production, migration, paid calls or RBAC changes.

Additional same-batch scope: verify product parent deal ownership on single product updates and deletes, with negative offline regressions. Do not change bulk delete/reorder semantics in this increment.


## Additional authorized task (2026-10-08): bulk product ownership

Ensure bulk delete and reorder of deal products verify every tenant-scoped item and validate access to its parent deal under the existing owner visibility rule before any mutation. Preserve existing error handling for partial database writes and add offline regression coverage. Scope limited to DealService, its integration test and this task record; no migration, live data modification, paid calls or production merge.


## Additional authorized task (2026-10-08): deal product relationship guards

Validate catalog product_id against the current tenant in single-product insert; never mistake the deal-product row id for a catalog product id. Validate distributor_id tenant membership on product edit. Cover foreign references with offline integration tests. Paths limited to DealService, its tests and this task record; no paid calls, migrations, live data writes, RBAC changes or production merge.


## Additional authorized task (2026-10-08): ProposalService tenant and owner boundaries

Apply existing deal owner visibility to linked proposal lists, updates, deletes and creation. Fail closed on proposal read errors; verify affected rows on deletion. Preserve standalone proposal creation when no deal is supplied. Add offline regression tests. Authorized paths: this task record, ProposalService and new ProposalService.integration.test.ts. No migration, live data, RBAC change, paid call or production merge.


## Authorized task (2026-10-08): CRM navigation and mobile usability, issue #24

After reconciling the candidate SHA and the Vercel external rate limit,
address one grouped, nonproduction UX batch:
1. Close the mobile menu on route selection; add a real backdrop and Escape dismissal.
2. Hide the offcanvas mobile menu from keyboard navigation when closed, without hiding desktop sidebar.
3. Keep route labels, current-page state and the sign-out action available when the desktop sidebar is collapsed or the mobile menu opens.
4. Recognize nested routes in primary navigation without falsely highlighting a same-prefix sibling.
5. Improve menu toggle semantics (aria-controls/aria-expanded), keyboard focus styles and clickable target sizes.
6. Add executable pure route-state tests and navigation wiring contract tests.

Authorized paths:
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/lib/sidebar-navigation.ts` (new)
- `src/lib/sidebar-navigation.test.ts` (new)
- `src/lib/sidebar-navigation-contract.test.ts` (new)
- `docs/codex/CURRENT_TASK.md`

No change to customer RBAC, product features, live data, Supabase migrations,
credentials, paid model calls or production. Use a non-CI work branch while
assembling the batch; create one CI-enabled validation branch after the entire
change set is ready. Since Vercel reports a build-rate-limit on the current
candidate, no Preview retries or release merges are permitted until capacity
and exact-SHA evidence are recovered.


## Authorized task (2026-10-08): CRM assistant reliability and keyboard accessibility, issue #24

After the mobile navigation batch, resolve one cohesive nonproduction set of
assistant-client risks without making paid requests:
1. Match the existing Gemini chat-route history and input bounds in the client.
2. Block duplicate sends synchronously, before React state renders, to avoid
   accidental repeated paid requests.
3. Abort/ignore stale requests on dismissal/unmount and prevent outdated
   responses from mutating a newly opened conversation.
4. Allowlist only safe, user-facing service errors; never expose raw provider
   error strings.
5. Provide true accessible dialog/keyboard behavior: focus, Escape dismissal,
   tab containment, focus restoration, labeled controls and live response log.
6. Add pure policy tests and executable source contract tests.

Authorized paths:
- `src/components/ai/AiAssistant.tsx`
- `src/components/layout/Header.tsx`
- `src/lib/gemini.ts`
- `src/lib/ai-chat-ui-policy.ts` (new)
- `src/lib/ai-chat-ui-policy.test.ts` (new)
- `src/lib/ai-assistant-client-contract.test.ts` (new)
- `docs/codex/CURRENT_TASK.md`

Work in a non-CI branch to avoid intermediate runner/deployment churn. Do not
call paid models, change server paid guard, modify credentials, modify customer
data, migrations/RLS, role policy, or production. Validate one final SHA via CI.
Vercel external build quota remains a Preview gate, not an invitation to retry
deployments or buy a plan.


## Authorized task (2026-10-08): NotificationCenter mobile and keyboard UX

Following CRM #24 product readiness audit, group and validate:
1. Replace the clickable non-semantic notification row with an explicit
   keyboard-accessible "Marcar como lida" action; preserve remove/notification
   actions without nested interactive controls.
2. Give the notification popover a responsive maximum width for narrow phones
   and retain dark-mode readable borders/backgrounds.
3. Add Escape and outside dismissal, focus entry, Tab containment and focus
   restoration with appropriate aria-expanded/controls/dialog semantics.
4. Improve hover/focus states and interactive button targets.
5. Extract deterministic unread-counter/relative timestamp display policy
   and provide unit plus source-contract regression tests.

Authorized files: `src/components/layout/NotificationCenter.tsx`,
`src/lib/notification-display-policy.ts`,
`src/lib/notification-display-policy.test.ts`,
`src/lib/notification-center-accessibility-contract.test.ts`, and
`docs/codex/CURRENT_TASK.md`.

No live data mutations, Supabase or auth changes, new entitlements, paid AI
calls, Preview quota retries, or production merge. Use a non-CI work branch
until the grouped changes are ready for one exact-SHA validation.


## Authorized task (2026-10-08): CRM command palette and global search integrity

After the nonproduction CRM assistant batch, fix an existing functional
contract defect and consolidate the search/move UX without touching live data:
1. `useDeals` must treat `getPipelineData()` as a typed object and use its
   `deals` collection, not cast the entire object into an array.
2. Stage changes must return truthful success/failure to CommandBar; close
   the command palette only on a confirmed server-action success.
3. Remove the no-op legacy automation call: the server action is already
   responsible for dispatching configurable automations.
4. Replace unescaped raw PostgREST `.or()` interpolation with distinct
   tenant-scoped `.ilike()` searches, preserve the owner visibility
   boundary of the pipeline, limit input/results and deduplicate deals.
   Fail closed on role/database errors rather than fabricating empty success.
5. Suppress stale debounced client results and report search errors distinctly.
6. Improve small-screen/dark-mode palette contrast and eliminate shortcut
   hints without actual key handlers; include offline integration and source
   contract regressions.

Authorized paths:
- `src/hooks/useDeals.ts`
- `src/services/DashboardService.ts`
- `src/services/DashboardService.search.integration.test.ts` (new)
- `src/components/layout/CommandBar.tsx`
- `src/components/layout/CommandPalette.css`
- `src/lib/command-palette-integrity-contract.test.ts` (new)
- `docs/codex/CURRENT_TASK.md`

No RBAC changes, migrations, live database edits, real AI calls, Preview
promotion during Vercel rate limiting, production merge or credential changes.
Prepare a grouped change on a work branch and validate one head via CI.


## Authorized task (2026-10-08): Dashboard metrics and listing integrity

After the search-guard batch, close five related gaps in the dashboard read
plane without changing the role policy already applied to deal details:
1. Fail closed on dashboard metrics DB failures rather than presenting zero
   revenue, empty pipeline and success-looking metrics.
2. Resolve roles from an authenticated, tenant-scoped profile, and restrict
   seller-visible dashboard aggregates and listings to their own deals.
3. Fail closed on recent deal and related owner/account lookup errors instead
   of silently presenting valid-looking missing information.
4. Route `getDashboardDeals` through a privileged server service that
   explicitly enforces tenant and owner visibility.
5. Include negative offline tests for database errors, missing profile,
   cross-owner exclusion and a server action wiring contract.

Authorized paths: `src/services/DashboardService.ts`,
`src/services/DashboardService.read-integrity.test.ts` (new),
`src/app/(dashboard)/dashboard/actions.ts`,
`src/lib/dashboard-read-integrity-contract.test.ts` (new),
`src/app/(dashboard)/dashboard/error.tsx` (new), and this file.
No new RBAC grants, migrations, live data writes, paid AI calls, Preview
rate-limit retries or production merge. Work outside CI until grouped checks
are ready, then validate one exact nonproduction SHA.


## Authorized task (2026-10-09): activity service data correctness, no Preview

Fix the actual quoted dueDate sort key on activity listing, reject missing/null database read results instead of reporting valid empty lists, reject null insert responses as failures, and validate blank tenant-related identifiers before any privileged lookup. Add offline regressions to existing ActivityService test suite. Scope: ActivityService.ts, ActivityService.integration.test.ts and this task record only. CI/test/build on exact SHA; no Vercel Preview builds, no database migrations, no live writes, no paid model calls, no auto-merge into main.


## Authorized task (2026-10-09): document retrieval and storage integrity (no Preview)

Repair the existing DocumentService read/write failure paths: verify the parent belongs to the tenant even on document reads; propagate errors from account/deal/document reads instead of fabricated empty lists; treat a null metadata insert as failure with best-effort cleanup; reject storage removal failure and verify the metadata row is actually deleted before reporting success. Add offline regression coverage. Scope limited to DocumentService.ts, its integration test, and this record. No migration, live writes, preview, paid calls, access widening, or production gate bypass.


## Authorized task (2026-10-09): document deal-owner security without Preview

Enforce the existing pipeline owner visibility on documents belonging to opportunities, including listing, upload, signed URL and deletion. Resolve parent entity from stored metadata for document-ID operations, and verify access before Storage actions. Preserve current account/contact tenant behavior. Add offline regression cases; no schema, credentials, paid calls, Preview builds or main merge. Paths restricted to DocumentService, its offline integration tests and task record.

The same owner-visibility boundary applies to related deal documents aggregated under an account; account-level documents remain tenant-scoped. No Preview is required for this offline security batch.


## Authorized task (2026-10-09): document upload input validation offline

Validate untrusted uploaded binary and declared size against actual byteLength, reject empty/mismatched/oversized files, and reject unusable filenames before invoking privileged Supabase Storage. Add offline negative regression tests. Allowed paths: DocumentService.ts, DocumentService.integration.test.ts, this task record. No Preview, Vercel deploy, paid calls, migrations, production merge or live writes.


## Authorized task (2026-10-09): five-block document defense-in-depth, offline

Operator authorized a consolidated five-block change on a nonproduction branch, with one CI PR and no Vercel Preview:
1. Confirm tenant membership for every user before privileged document parent lookups, including account and contact (not just deals).
2. Validate the storage object path is inside the document metadata tenant/entity directory before issuing a signed URL.
3. Apply that same fail-closed path confinement before deleting anything from Storage or metadata.
4. Validate untrusted category and description metadata before uploading; reject invalid category/non-string or excessive description.
5. Reject pathological upload filenames (excessive length and unsafe segments) before any privileged I/O; preserve supported file types and normal names.

Add deterministic offline coverage for all five blocks. Allowed paths: this task record, `src/services/DocumentService.ts`, `src/services/DocumentService.integration.test.ts`. Do not modify RBAC grants, migrations, data, credentials, paid models, Vercel, Preview ref or main. Commit only to nonproductive candidate; merge only after exact SHA CI success and review. Production merge remains human-only.


## Authorized task (2026-10-09): five product catalog integrity blocks (offline, nonproduction)

Group five fixes in one candidate PR: (1) fail closed on product list read errors and null result; (2) reject missing/invalid product name and avoid reporting successful create on null insert; (3) whitelist mutable product fields and reject identity/tenant/audit spoofing in product update; (4) verify one affected row on update/delete; (5) preserve all legacy duplicated fields, generate a collision-resistant SKU even when source SKU is empty, and require returned persisted row. Add fake Supabase offline regression tests. Authorized paths: ProductService.ts, ProductService.integration.test.ts, this task record. No schema, migrations, auth grant changes, data writes outside tests, Preview, paid model calls, or production merge. Group changes outside CI until coherent then run once on exact PR SHA.


## Authorized task (2026-10-09): five lead data integrity guards, no Preview

Prepare five related blocks for a single nonproduction PR: 1) treat lead list database errors and malformed null/non-array results as failures; 2) validate a lead's company before create and reject a null persisted row; 3) whitelist lead creation input to prevent caller-supplied primary keys, organization or audit fields; 4) whitelist updates, reject empty/invalid changes and require an affected tenant-scoped row; 5) verify affected tenant-scoped row for deletion. Preserve existing lead conversion semantics in this task; do not change permissions or assignment rules. Add fake Supabase regression tests. Scope limited to LeadService.ts, new LeadService.integration.test.ts, CURRENT_TASK.md. No model calls, migrations, live writes, Vercel, Preview, or production merge. Validate one product/** head only after candidate is coherent.


## Authorized task (2026-10-09): five ProposalService integrity blocks without Preview

Five offline hardening blocks: 1) require tenant membership even for standalone proposals; 2) reject malformed/null lists instead of empty success; 3) validate status, signature setting, and reject no-op updates; 4) require returned persisted row on update/create; 5) validate account/lead references against current tenant and fail closed on version lookup failures. Add deterministic integration tests. Allowed paths: ProposalService.ts, ProposalService.integration.test.ts, CURRENT_TASK.md. No production, Vercel, Preview, migrations, paid models, new RBAC permissions, or live data. One coherent CI PR, then candidate-only merge on green exact SHA.


## Authorized task (2026-10-09): five account read/aggregate correctness guards (offline)

One grouped nonproduction PR with five blocks: 1) do not mistake null/malformed account list for an empty success; 2) same for lightweight accounts/manufacturers lists; 3) validate required account name and children structure before create; 4) validate account update input, replacement children and required name before any privileged read/mutation; 5) fail closed on null/malformed contact and branch snapshots before deleting existing children. Regression tests must cover absence of destructive writes and valid empty lists. Scope AccountService.ts, AccountService.integration.test.ts, CURRENT_TASK.md. No Vercel Preview, migrations, live data, paid AI or production merge. Validate one product/** SHA, merge only into nonproduction candidate with green CI.


## Authorized task (2026-10-09): five contact read and validation guards

Group five nonproduction offline fixes: (1) reject null or malformed full-contact list responses instead of reporting success; (2) fail closed on null/malformed account-contact list responses; (3) fail closed on duplicate lookup errors or non-array results before inserting a contact; (4) validate contact text input types, required name and reasonable length bounds before privileged mutations; (5) validate contact IDs before update/delete and preserve zero affected row failures. Add deterministic offline integration regression tests without schema changes. Allowed files: ContactService.ts, ContactService.integration.test.ts, CURRENT_TASK.md. No expansion of permissions, production, Preview, Vercel, migrations or paid model calls. Create one coherent PR, CI green at exact SHA required for candidate-only merge.


## Authorized task (2026-10-09): five server-side clients/contacts RBAC guards

Apply restrictive policy consistent with existing role matrix (not an access expansion): 1) define explicit clients create/edit/delete/import permission keys; 2) assign them to existing admin/manager/vendedor roles preserving their current authorized workflows, but NEVER support; 3) gate all customer create/edit/delete/import server actions with requirePermission; 4) gate contact create/edit/delete server actions with the same client permissions and both read actions with clients:view_all; 5) add unit and source contract tests proving support is read-only, unknown roles fail closed, multi-role and sales alias work, and actions enforce the gates. Scope only src/types/auth.ts, src/lib/permissions.ts, src/lib/permissions.test.ts, src/app/(dashboard)/customers/actions.ts, src/app/(dashboard)/contacts/actions.ts, src/lib/clients-server-actions-rbac-contract.test.ts (new), CURRENT_TASK.md. No Preview, migrations, real data, paid AI, prod merge or widening of access. CI green at exact SHA for nonproduction candidate merge.


## Authorized task (2026-10-09): five SettingsService integrity blocks, no Preview

Group safe nonproduction hardening: (1) fail closed when organization settings read errors or payload is malformed, distinguishing legitimate unset; (2) whitelist/validate org settings before privileged save, confirm affected row; (3) distinguish legitimate empty pipeline from read error/malformed results; (4) validate nonempty unique pipeline stage definitions and require a valid existing-row snapshot BEFORE any destructive change; (5) scope stage deletes by tenant, verify affected rows, and confirm upsert results instead of false success. Offline tests with fake Supabase must include cross-tenant/delete guards. IMPORTANT: deletion+upsert is still not a database transaction; record its residual integrity risk separately, do not claim full atomicity. Paths only SettingsService.ts, SettingsService.integration.test.ts (new), CURRENT_TASK.md. No migration, live data, production, Vercel, Preview or paid model calls. Exact SHA CI gate for merge solely into candidate.
