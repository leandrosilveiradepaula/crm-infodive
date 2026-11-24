## 2026-11-24 — DS9 actual header Search activation and CommandBar end-to-end gate (DETACHED)

Static reconnaissance found the original CRM Dashboard Header's top Search input was **inert**: no `onChange`, onClick or navigation handler, and separate CommandBar component was not mounted through `Header.tsx`. Source-only CommandPalette.css cleanup would therefore NOT constitute a real UX fix. This candidate replaces fake Search input with an accessible, visible responsive command opener; mounts the **existing** CommandBar component, adds mobile search access and Ctrl/Cmd+K shortcut, translates existing labels/empty/search states to Portuguese, and corrects inherited text foregrounds in selected results. It does not invent new backend actions: the existing `searchGlobal`, router navigation and `updateDealStage` handlers are preserved. E2E on `/dashboard` now explicitly opens command UI, runs full axe (zero violation AND incomplete), takes screenshots at desktop/mobile light/dark, checks Escape and Ctrl+K, and then audits the separately mounted Watson AI drawer without submitting AI prompts. **It is only staged, not yet published,** and must pass same-SHA CI and authenticated QA before any acceptance. No hosted DB, production, migration, secret or merge.

---

## 2026-11-24 — DS9 real Watson AI drawer accessible semantic family (detached)

Header.tsx mounts AiAssistant in the live CRM, not a fabricated mock route. Its original UI contains local Tailwind color/type/radius/shadow utilities, icon-only send button with no accessible name, and insight cards styled as clickable despite having no handler. This candidate removes 23 categorized local-style matches (all 23 → 0), using central status/contrast/overlay/type roles; gives icon-only controls readable ARIA names, real input name and an explicitly named dialog; removes misleading pointer style while retaining existing chat calls and CRM deal context. Adds strict anti-hardcode lock and source test, plus real authenticated `/dashboard` UI drawer open/close and axe snapshot across desktop/mobile and light/dark; no AI prompt submitted or external LLM called during QA. This block is **not declared accessible** until actual browser PASS and verified focus behavior; print colors / command palette changes remain staged in same substantial candidate. No server action, data, credentials, production, hosted DB or merge.

---

## 2026-11-24 — DS9 actual Customer overview migrated to StatsGrid tone API (detached)

Audited real `/customers` source against shared `StatsGrid.tsx`: the page supplied legacy `color`/`gradient`/`border` properties, but the current shared component intentionally **ignores** them and resolves only `tone` (neutral default). Thus all four customer KPI icons were silently neutral despite local hardcoded teal/emerald/amber strings. Replaced those ignored local definitions with explicit semantic `tone: primary/info/success/warning` and centrally configured filter typography/radii/destructive reset styles. The real page's measured categorized local-style occurrences go **27 → 0**, and the strict policy now locks its source. All actual values, contacts averages, filters, CRUD and navigation remain unchanged. Browser QA must verify computed icon colors and screenshots on the exact published SHA; current work remains detached behind the ongoing earlier QA. No production, DB, secrets, migrations or merge.

---

## 2026-11-24 — DS9 real CommandBar theme/keyboard module prepared (detached)

Code inspection confirmed `src/components/layout/CommandBar.tsx` imports the actual `CommandPalette.css`, which independently defined a white panel, fixed blue #0530ad selected background, gray text, arbitrary radii/shadows and invalid CSS `font-weight: 600px`. This is a real design-system centralization defect, not an unused demo stylesheet. Prepared a cohesive shared semantic CSS migration for overlay, popover, selected/hover/focus foreground, keyboard chips, typography and geometry, backed by four `--ds-command-*` variables and a CI contract. The command actions/search/keyboard handlers are unchanged. **Must inspect real CommandBar UI in authenticated light/dark/mobile once the code is published; no claim of acceptance from source assertions.** This candidate is detached behind ongoing exact-SHA QA of `aa7bafd6`, not yet published. No hosted DB, production, merge or migrations.

---

## 2026-11-24 — DS9 proposal document family completion (DETACHED, not yet published)

The print-safe single palette extracted in the previous candidate now also covers 11 remaining HTML proposal and React PDF pages: confidentiality, custom notes, differentiators, overview, software groups, cover and hardware PDF fragments. Replaces an additional 101 literal hex colors without changing RGB values, renderer APIs, prices, classification, billing logic or brand override props. Added document primitives for slate700/red50/red200 and expanded source regression coverage. **Total 322 duplicate print colors in 18 components centralized**, independent of CSS dark/light, with PDF output parity NOT accepted until actual exports are compared. This detached commit is staged behind ongoing exact-SHA QA of `aa7bafd6`; do not change live PR head until the previous run completes and its outcome is incorporated. No migrations, hosted DB, production or auto-merge.

---

## 2026-11-24 — DS9 print-safe unified proposal-document primitive palette (staged behind QA)

This cohesive release candidate centralizes 221 repeated six-digit color literals across seven HTML proposal-preview and React PDF rendering source modules into one dependency-free `src/design-system/proposal-document-colors.ts`. The source retains the original literal RGB values (no change in the output color intended), the original `PdfColors` role names, and the existing organization-level `themePrimary`/`themeAccent` override behavior. React-PDF's `defaultColors` now derives from the same typed document roles; both JS inline styles and PDF `StyleSheet.create` refer to those primitives.

This print palette is **separate from the browser light/dark semantic CSS variables by design** so exported documents do not change when an operator switches their personal appearance setting. It is a single central document palette, not a second independent set of hex values in each proposal module. The 221 removed occurrences were duplicate source literals, **not 221 user-visible bugs**. The current web debt reporter still inventories document renderer omissions; true end-to-end export parity needs PDF before/after renders, exact SHA TypeScript/unit/build and human visual comparison. Therefore retain Draft #221 and do not imply release acceptance, direct hosted database changes or automatic merge.

---

### 2026-11-24 — DS8 real create modal failures localized, coherent accessibility remediation

On [exact-SHA isolated authenticated QA 45506940586](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45506940586), commit `6e30acc8` audited four real synthetic profiles across all 22 authorized routes. It FAILED 16 viewport/theme combinations **only in four newly exercised states**: /login (one color-contrast incomplete per combo due blurred decoration under the footer), /leads?create (unlabeled native select, incomplete aria-hidden-focus and contrast during transition), /contacts?create (unbound form labels, company selector/button name, background-focus and contrast during animation), /customers?create (unbound inputs, unnamed select/tag controls, dangling dialog description and background-focus). The route-level default QA and previous Pipeline/Goals tests did not report other regressions. This block fixes genuine semantics, not suppressions: shared open-gated hook for background inert/cleanup; explicit unique useId label associations for each field; named select/button controls; mounted Radix DialogDescription; solid design-token surfaces, shared primary Button, common modal max-height/padding; and real QA runs axe after the real 200ms animation settles. Removes overlapping blur decoration from login and gives footer an opaque background. Maintains true server actions, entity tenancy, product prices and OAuth. No DB, user accounts, migrations, Vercel production or merge. **Retest the entire real browser matrix on the next exact SHA before marking resolved.**

---

## 2026-11-24 — DS8 reconcile B4 historical source assertions with new semantic classes

[Exact-SHA code CI 45506376439](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45506376439) reached 418 tests; 415 passed and exactly 3 existing static source assertions failed because they expected earlier hardcoded classes `shadow-sm`, `text-[8px]`/`text-[9px]` from AiSuggestionsPanel, LeadCard, ContactCard and ProductCard. These modules correctly moved to `shadow-control-ui`/`text-metadata-ui` under centralized tokens and remain legible. Historical tests now assert the **new semantic contracts**, including primary/foreground readability, without rolling back legitimate DS migrations. No skips, test removals or bypass of real WCAG. New exact-SHA TypeScript/unit/build/policy and authenticated browser must pass; maintain PR Draft and separate visual UX acceptance.

---

## 2026-11-24 — honest inventory split: web theme vs @react-pdf export

The full read-only inventory continues to count every visual literal, including print. It now adds a `bySurface` breakdown separating `src/components/proposals/pdf/` (React PDF JS renderer) from CSS/Tailwind-based CRM web and previews. This does NOT erase or exempt the PDF literals from the global total; it prevents the false claim that changing `tokens.css` necessarily changes non-browser `StyleSheet.create` exported documents. The independent proposal output theme already accepts explicit `themePrimary`/`themeAccent`; a future aligned central PDF token contract must preserve serialized PDF visuals and tenant brand settings. This is not authorization for unsafe PDF style replacement, production changes or hosted DB mutations. Maintain a truthful debt ledger on the final SHA.

---

## 2026-11-24 — DS8 integrated dashboard, shared command and catalog styling

The single centralized CRM Design System Draft PR #221 now includes 16 additional original Dashboard/Products/Email/CommandBar/Notifications/Handover components with private Tailwind palette, type-scale and geometry substitutions to existing central `tokens.css` roles. Measured category reduction in these files: 71 + 142 = 213 local occurrences, not 213 independent user-facing defects. Adds 14 newly clean modules to strict anti-hardcode policy; source tests verify all 16 family members. Colors and font weights remain centrally configurable and light/dark semantic; no product, backend, Auth, financial rules, live data or migrations changed. This batch is NOT globally visually certified until exact new SHA browser proofs and the approved private screenshots are compared. Preserve PR Draft and human main merge.

---

## 2026-11-24 — DS8 follow-up: genuine login, charts, calendar and opportunity diagnosis

Continues the original CRM Design System branch and single PR #221. Eight additional existing components (login page, opportunity AI header, shared calendar and five charts) are switched to the same semantic palette/type/geometry primitives; 230 additional local-style matches were eliminated by the inventory categories in this batch. Three newly clean modules are strict-guarded, with source contracts for all eight. Unchanged login/auth semantics, sales chart data and AI callbacks; no personal data, hosted infrastructure, migrations or production. A source contract is NOT a browser screenshot or functional acceptance. Login/analytics visual contrast in both themes still needs actual final-SHA browser proof and separate owner visual assessment. Previously inspected private screen references remain private.

---

## 2026-11-24 — DS8: customer lifecycle, activity/integration, inbox-related and leaderboard migration

Continue the SAME Draft PR #221: after DS7's substantial Operation/Admin + Commercial migration, this next pre-reviewed block centralizes 32 original React UI modules spanning Customers, Contacts, Leads, Email, Omnichannel, Integrations, Activities, Gamification and a proposal selector card. Removes 746 categorized local-style occurrences in this batch (measured by the current matching categories, not distinct UX bugs). Adds 21 newly zero-debt modules to the strict anti-hardcode guard, plus family-level source contracts. Existing typed state, Server Actions, permission checks, calculation functions and response data are unchanged. Existing specialized email/marketing decorations and user-facing output still require separate visual evidence; never claim global completion based only on regex counts. The live browser must retest all existing full route/profile/viewport/theme conditions on the EXACT final SHA, including keyboard, WCAG zero violation/incomplete, token propagation, auth, and snapshots. Human main merge gate; no hosted DB, migrations or production.

---

## 2026-11-24 — legacy font weight and letter-spacing compatibility bridge

The central token core now controls not only Tailwind's inherited text scale, radius and elevation, but also weight and tracking utilities consumed by the yet-unmigrated source files. Default weight/spacing values match the existing Tailwind visual baseline and are editable in `tokens.css` through `--ds-type-strong-weight`, `--ds-type-heavy-weight`, and `--ds-tracking-*`. This is a compatibility bridge, not a declaration that every component has semantic role assignment. CI must prove CSS compilation and real computed-style propagation. No hosted data or production change.

---

## 2026-11-24 — DS7 commercial family integrated with Operation/Admin bulk migration

Owner requested to finish the existing centrally configurable Design System in ONE cohesive PR #221, not additional micro-PRs. After the 26 Operations/Admin source files, this candidate migrates 24 more original CRM TSX modules across Sales, Sales Order, Product catalog, Pipeline product workflows, proposal editor/versions, public proposal and customer portal. Private Tailwind palette/font/geometry declarations now reference the existing centralized light/dark roles in `src/design-system/tokens.css`. Existing data/API/payment/financial/tenant/role behavior remains untouched; branded output defaults and existing decorative gradients remain under explicit residual review rather than silently altered. Added 17 new strictly locked clean modules and a source contract covering all 24 commercial modules, in addition to the prior Operations/Admin family contract. This is structural source centralization, not universal UX acceptance.

Original reference screenshots were inspected in private. The previous exact-SHA QA (run 45502306283, SHA 2c82a0e4) proved the orphan tabpanel ARIA issue fixed (no incompletes) but found a real low-contrast `StakeholdersTab` empty-state paragraph; this candidate removes its whole-panel opacity and adds regression coverage. **New exact-SHA TypeScript, unit, build, design policy, WCAG preflight, real four-profile 22-route isolated authenticated QA and visual review are required.** Keep Draft PR, no human merge, hosted Supabase, Vercel production or migrations.

---

## 2026-11-24 — DS7: cohesive Operations/Admin family migration, keep Draft pending real QA

Owner explicitly requested the Design System completion, not repeated micro-PRs. Prepared a substantial **single-PR** migration on 26 original CRM operational and administration TSX modules: Settings/Users/Security, Activities, Automations, Contracts and Service Desk. Existing Tailwind palette names, sub-12px font sizes, locally chosen type scales, radius and shadow classes are replaced by the shared light/dark semantic palette, typography, control/panel radius and elevation roles. No new identity; all default values remain in `src/design-system/tokens.css`. Strict no-hardcode policy now locks 16 newly clean modules. Original read-only visual source screenshots were examined privately; no third-party assets published.

This is code centralization, **not** a declaration of full product UX acceptance. Preserved real Server Actions, user/account permissions, tenants, contract/signature logic, calculations and persistence; no hosted DB, migrations, or production operations. Source-level regression contract covers all 26 modules. Some existing business default hex values and local decorative gradients remain outside this partial cleanup and must be reviewed explicitly before declaring global completion. **Required next gate:** exact SHA TypeScript, unit, build, strict token policy plus isolated authenticated four-profile/22-route light/dark desktop/mobile browser with zero axe violations AND incomplete, propagation and screenshots compared to reference. Keep PR #221 DRAFT, human merge only.

---

## 2026-11-24 — DS6 fix: token roles on the ACTUAL Pipeline Kanban

The real `/pipeline` client route owns `DEFAULT_STAGES`/DragDropContext itself and does not render the separately migrated `components/pipeline/KanbanBoard.tsx`. Earlier claims that this alone changed the displayed Pipeline were incorrect. The real route now binds all five stages to dedicated central stage color/surface tokens and reads width/heights from `--ds-kanban-*` geometry variables; E2E uses the real DOM data-qa-stage and dot markers to compare actual computed colors against CSS tokens. Protect route source against local hardcode regressions. No drag-drop, stage data, deal math, security or DB logic changes. Exact-SHA authenticated/browser evidence and user visual approval still required.

---

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
