## 2026-11-24 — DS6 Commercial tokens and stage-render proof candidate

Continue the incremental original CRM migration in existing Draft PR #221: KanbanBoard and five opportunity-related components. Replace dynamic stage-colored Tailwind with explicit static utilities backed by central semantic stage tokens; use shared text scale, border-radius, elevation and contrast roles throughout. Add six files to the strict guard, and authenticate browser QA across five stage color dots and the Partners/Clientes secondary tabs in four viewport/theme combinations. Preserve sales values, RBAC, tenancy, server actions and existing capabilities. No claim of UI approval until same-SHA tests, screenshot inspection and human sign-off.

---

## 2026-11-24 — DS5 real nested-screen QA catch (same PR #221)

Visual inspection of authenticated QA artifact `crm-b4-local-visual-evidence-bf69f1dd...` uncovered a structural Planning grid defect despite prior green default-route tests: the top FilterBar consumed one of 12 columns and forced the results column to a lower row; duplicated goal-mode wrapper caused compressed and overlapping options. Real axe found unlabeled inputs and insufficient/ambiguous chart contrast. The next cohesive remediation fixes the DOM layout hierarchy, input naming, semantic on-primary text and uses the shared AccessibleChart contract (native HTML data alongside SVG graphics). The browser runner waits for actual UI transitions to settle before sampling contrast; this does not suppress any WCAG findings. Full same-SHA authenticated certification and visual review remain required.

---

## 2026-11-24 — Goals family authenticated UI state coverage

Static migration alone cannot validate controls mounted only inside nested Goals tabs. The isolated browser QA now clicks Regras de Comissão, Gestão de Campanhas, Planejamento Financeiro (including the Curva de Sazonalidade chart) and Extrato de Comissões in the original Next.js CRM under the first authorized synthetic profile, on desktop/mobile and light/dark. It validates actual selected state, visible content, no document overflow, WCAG/axe violations **or incompletes**, captures sanitized screenshots for each state, and checks the Recharts bar's computed fill against the central primary token. This does not create, update, pay or persist business records. Exact commit SHA CI and E2E must pass before this is treated as proof. Owner visual comparison and broader untouched module debt remain open.

---

## 2026-11-24 — DS5 Goals, Commissions and DRE semantic migration candidate

**Verified baseline SHA:** 8395895d. [CI 45432758424](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45432758424) SUCCESS, 286 tests and WCAG preflight; [isolated authenticated QA 45432758930](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45432758930) SUCCESS, four real local role profiles and 192 visual route checks. Measured debt: 172 affected files/3,834 local class occurrences vs original 196/5,536.

**New candidate scope:** GoalsTab, FinancialSummaryCard/DRE, CommissionsTab and DistributionModal converted to central semantic color/tone, typography, radius and shadow roles. Goals now passes typed semantic `tone` values to StatsGrid, instead of ineffective per-item `color`, `gradient` and `border` classes. The four source files had respectively 62, 66, 56 and 57 measured local decisions (241 total) before migration; they are now added to the strict zero-local-hardcode guard. Financial calculations, per-user commission rules, distribution weight formulas, server actions, tenants, databases, credentials and production are unchanged.

**Gates still open:** exact candidate SHA CI, isolated authenticated 22-route/four-role QA and browser visual comparison in desktop/mobile/light/dark. Re-run the authoritative full repository inventory to establish the new aggregate. Keep PR #221 DRAFT; do not claim 100% DS migration or user visual acceptance.

---

## 2026-11-24 — DS4 structural centralization and semantic screen-family contracts

**Source baseline:** exact `2891b5ecc82cc54dcc242338a0f946d89a25138c` GitHub run 45418898557 records **188 files / 5,168 local style decisions**; counts use `scripts/report-design-system-debt.mjs`. Values are occurrences, not visual bug counts. The original 196 / 5,536 figure has been superseded by this measured baseline.

**Implementation candidate:** a compatibility bridge in `src/design-system/tokens.css` routes legacy Tailwind font scales, radius and shadow scales through centrally editable `--ds-*` primitives; this helps unmigrated routes respond without misleadingly erasing their debt counts. A typed `StatTone` contract replaces per-page `color`/`gradient`/`border` inputs on shared KPI cards and Pipeline summary. Twelve large source components across Pipeline, Sales, Goals, Automations, Proposals, Procurement and document handling are migrated to semantic palette, type, radius, shadow and background roles; strict policy blocks those files from reintroducing measured local decisions. A genuinely uncontrolled input/select must remain editable.

**Required operational proof:** the new synthetic authenticated QA must change and restore individual central tokens in real browser components (primary, page title, panel radius, card shadow, body font, highlight gradient, plus legacy text/radius/shadow) on Leads, Contacts and Activities, at both desktop/mobile and light/dark. Exact final SHA CI+QA must pass; user-provided 19 screenshots are reference for layout patterns, not content/branding to copy. Confirm actual post-commit debt count before stating a migrated percentage.

**Known separate gate:** the organization default-theme setting is not persistent today; user preference persists individually. The UI must never claim organization-wide save while `updateOrgTheme` does not store a `default_theme`. Adding real org-level theme persistence requires schema, permission validation, contrast validation and rollback authorization. This block makes the UI truthful, but **does not deliver a tenant runtime theme editor** or finish all visual route families. Never call the system universally complete based only on green CI.

---

## 2026-11-24 — DS3.1 opportunity visual family continuation

Work continues in the existing DRAFT PR #221. An actual comparison of authenticated synthetic `37dfb820` opportunity-detail screenshots against the private user reference found an eight-tab two-to-four-row navigation and oversized KPI dashboard over core business details. The current DS3.1 block reorganizes that **existing** information with `--ds-deal-*` tokens and shared `ds-deal-overview-*` classes, retaining every tab and business action; source data remains `Deal`, never fabricated history/contact/AI/forecast. Real QA on the new SHA (desktop/mobile, light/dark, primary + secondary history) and design-token non-regression remain release gates. No claim is made that all 196 baseline UI files or 5,536 inventoried decisions have been migrated; re-measure those counts before changing the baseline.

---

# CRM Infodive — centralized Design System migration (2026-11-23)

**Goal:** a visual configuration changes the entire ORIGINAL CRM without modifying individual pages. This strategy supersedes "make each module look right" as the immediate UX implementation priority. Do not change business logic, routes, permissions, tenant isolation, data or external integrations.

## Architecture and sources
- **Single file for default visual VALUES:** src/design-system/tokens.css.
- **Configurable primitives:** --ds-base-* for both themes, --ds-font-family-*, --ds-type-*, --ds-shadow-*, --ds-gradient-*, --ds-card-*, --ds-control-*, --ds-page-header-*.
- **Semantic compatibility aliases:** --background, --foreground, --primary, --surface, --success-readable, --destructive, --stage-* etc. They always refer to primitives; change the primitive, not the consuming module.
- **Tailwind 4 adapter:** @theme inline in that same token file exposes bg-primary, text-foreground, semantic text roles, and shadow-control-ui. src/app/globals.css imports it and contains only global resets, application utilities and shared focus behavior.
- **Primitives:** Typography and existing Button/Card/Input/Table/Dialog/PageHeader consume semantic roles. Feature-specific exceptions must be justified, named, reviewed and registered. No anonymous local palettes or gradients.
- **Themes:** :root and .dark override primitive VALUE pairs on the document root. Theme preference and login already exist; do NOT silently change user/organization persistence while migrating UI.
- **Future admin palette editor:** implement ONLY after permissions, schema and publication gates are scoped separately. It must submit typed allowlisted primitive values, validate both light/dark contrast, preview before publish, reject unknown CSS, version settings and support rollback. No arbitrary CSS in user input.

### How to reconfigure the visual core
Edit the appropriate --ds-base-* or --ds-type-* variable in src/design-system/tokens.css, not in pages. Example: a different --ds-base-primary changes all bg-primary and text-primary usages; --ds-type-page-title-size changes all Typography variant="pageTitle"; --ds-highlight-start changes all ds-panel-highlight. If a page is unaffected, that page is not yet migrated or is an approved domain exception.

**No new colors are prescribed by this program.** Current brand values are carried forward from globals.css. Dark mode values are preserved. New aliases use existing semantic colors.

## Verified migration inventory baseline — 2026-11-23

GitHub Actions run [45239400879](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45239400879), candidate SHA 6fd9d5901f29d5020f461e7665185ee9c84ff629:
- TypeScript, unit tests, Next.js build, synthetic WCAG A/AA for desktop/mobile + light/dark, git diff check and design-token non-regression check: **PASS**.
- **196 files** have **5,536 occurrences** in categories inventoried by scripts/report-design-system-debt.mjs.
- **11 changed UI files**, **zero increases** of guarded local style decisions against main.
- Includes local font-size classes, raw color palettes, gradients, radius and shadow classes; a regex occurrence is NOT necessarily an independent bug. This is a migration-debt measurement only, not UX approval.

| Family | Files with remaining occurrences | Occurrences |
|---|---:|---:|
| Comercial | 68 | 1,791 |
| Analytics and admin | 31 | 1,116 |
| Pipeline and drawers | 24 | 1,237 |
| Operation | 18 | 511 |
| Shell and Dashboard | 15 | 161 |
| Shared components | 15 | 53 |
| Other | 25 | 667 |
| **Total** | **196** | **5,536** |

Recalculate on the final SHA after each migration block using npm run design-system:inventory and attach node scripts/report-design-system-debt.mjs --markdown output. Do not blindly replace all matches: classify semantic role, behavior and justified exceptions before migrating. The core PR does NOT eliminate the 196-file backlog.

## Phases and actual status
| Family | What must be migrated | Current candidate state | Required QA |
|---|---|---|---|
| DS0 Central core | primitive color pairs, fonts, type, radius, shadows, gradients, spacing, Tailwind mapping | Implemented in candidate branch; CI not yet certified | token contract tests and theme inversion |
| DS1 Shared components | Typography, Button, Card, Input, Table, Dialog, PageHeader and other primitives | Partially migrated in candidate | snapshot, role/keyboard and WCAG checks |
| DS2 Shell/nav | all nav, headers and layout including #220 work | **CANDIDATE PORTED TO #221**; CI and authenticated QA pending | mobile/desktop, collapsed, both themes |
| DS3 Pipeline | Board, cards, tables, drawer, financial panels and dialogs | **CANDIDATE BOARD/LIST + CARDS PORTED TO #221**; remaining commercial flows and QA pending | board/list, editing, finance, mobile |
| DS4 Commercial | Leads, contacts, companies, proposals, sales, products, price tables | PENDING | real authenticated actions |
| DS5 Operation | Inbox, activities, contracts, automations, Service Desk | PENDING | functional states and permission coverage |
| DS6 Analytics/admin | Reports, KPI/graphs, integrations, goals, settings | PENDING | chart statuses, data and theme comparison |
| DS7 Global acceptance | no remaining hardcodes except documented exceptions | PENDING | one core change propagates to ALL migrated families |

The earlier owner-reported estimate (~106 files) was replaced by the measured baseline below; future totals must be recomputed from the exact SHA. Run:
- npm run design-system:inventory — summary by screen family and top files.
- node scripts/report-design-system-debt.mjs --markdown — complete per-file migration matrix. Record verified totals, diff and completed routes against actual SHA rather than inventing a counter.
- npm run lint:design-system — fail if the current branch introduces new local design decisions compared with its merge base.

## G1 shell + Pipeline integration (source PR #220)

The shell is a two-tier navigation composed of an icon rail and route-derived contextual area links. The Pipeline uses compact KPI summary, the board/list switch, existing action/drag semantics and the commercial-stage state names; none of those features are newly invented. Only design VALUES are centralized: `--ds-nav-rail-width`, `--ds-nav-expanded-width`, `--ds-nav-target-size`, `--ds-header-height`, `--ds-filter-gap`, `--ds-gradient-progress-primary/success`. The components consume these tokens; changing a token changes all consumers without editing pages.

The original Clinia screenshots `093344(1).png` (compact Kanban under filters) and `093410(1).png` (detail drawer and right inspector) were directly examined as structural references. No claim of pixel-identical reproduction or global UX acceptance. The original #220's most recent authenticated QA at SHA `6f722876e91ec9cc761888a0f9cb48245eded3cb` **FAILED** due to a WCAG color-contrast violation in `/pipeline` detail; it also returned `aria-hidden-focus` incomplete samples. The integrated candidate is a new SHA, so this failure must be RETESTED with the revised centralized tokens and actual local-isolated QA results.


## Policy
**Allowed:** grid/flex positioning, responsive behavior, overflow, structural widths, existing semantic colors/tokens, shared primitives. **Forbidden in newly written UI:** color names like bg-blue-500, literal hex, local background gradients, text-[9px], new arbitrary font scales, rounded-xl/shadow-lg as a component-specific decision. Exceptions (e.g. an external partner icon or chart-required data scale) must have a documented semantic role, read-only mapping and justification; do not suppress a real accessibility issue.

The automated guard tracks increases per file and category against the baseline commit. Existing debt is permitted during migration only if it does not increase. This is an interim migration safeguard, NOT proof that the remaining existing violations are acceptable. Once migration is complete, zero unauthorized occurrences is the hard gate.

## Prove centralization
On the SAME candidate SHA, temporarily modify ONLY the DS core: primary color, font, page title scale, control/card radius, and highlight gradient. Rebuild and capture authenticated synthetic QA across shell, Pipeline/drawer, commercial, operation and analytics on mobile/desktop and light/dark. The resulting changes must propagate without edits in modules. No P0/P1, correct contrast and keyboard behavior. Restore final intended values and repeat regression on the final SHA. Until this passes, "Design System centrally configurable" is a PARTIAL technical claim.

## Hard gates and boundaries
No Supabase migrations, SQL, theme schema writes, production Vercel deploy, RBAC changes, API/server-action edits, integration updates, paid services or automatic main merges. Admin configurator is a separate authorization and security project, not included in the CSS core candidate. Treat PR #220 as a separate G1 UX draft and reconcile it after the DS core stabilizes, do not merge it merely because its E2E was green.
