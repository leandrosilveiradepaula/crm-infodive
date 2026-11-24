## 2026-11-24 — DS9 centralized proposal documents, source fidelity and authenticated gate

Published `aa7bafd6` on Draft PR #221. Same-SHA [CI 45510765757](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45510765757) SUCCESS (440/440 unit tests, TypeScript, build, four synthetic axe combinations, 103 strict migrated, 168 changed UI sources with zero hardcode regressions); measured residual debt: 75 files / 409 categorized occurrences, 376 web + 33 React-PDF. Base SHA `4acaa857` had passed 429 tests but [real authenticated QA 45508860943](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45508860943) FAILED only four desktop Lead/Contact form-description `color-contrast` incompletes (zero axe violations, all mobile combinations passed). Real screenshot confirmed mobile Contact form header unusually squeezed. Candidate replaces tracked tiny uppercase text with shared readable body typography and stacks contact header on mobile. **Await exact-SHA 45510765794 QA result** before any completion claim.

Separately staged (not yet published to PR) a print-safe color palette consolidation to 18 HTML/PDF proposal renderers. It moves 322 repeated raw print color literals into shared `src/design-system/proposal-document-colors.ts` without changing source values or tenant brand overrides; output visual parity requires actual PDF export comparison. Keep changes as a substantive same-PR family, never as a new app or micro-PR. No hosted DB, secrets, production or main merge. User still requires screenshot-based UX approval, including original private 19 references; historical P2 opportunity inspector layout gap open.

---

## 2026-11-24 — DS6 b4e5bd7a same-SHA QA and full axe target diagnostics

CI 45491164463 PASS; real local auth QA 45491164346 FAIL all four Partners states, only aria-valid-attr-value incomplete with noIdShadow. Fresh axe instance/reset did not fix. Source of axe-core 4.14 indicates noIdShadow is an unresolved aria-labelledby IDREF if any shadowRoot exists. Previous harness analyzed only node.target[0], possibly a shadow host/ancestor, not the actual failing child. Next read-only probe resolves complete target layers in memory and logs only safe ARIA attribute names, reference count/existence and sanitized tag; do not disclose selectors/IDs. No rule disabled or skipped. Keep PR #221 Draft and require same SHA full auth QA to localize actual node. No hosted DB/production/user records touched.

## 2026-11-24 — DS6 a208b6b0 QA root cause investigation

CI 45487106786 PASS; real auth QA 45487106841 FAIL all four Partners states only because axe-core 4.14 returns `aria-valid-attr-value` incomplete with key `noIdShadow` for attributeName `aria-labelledby`, despite actual dialog having ONLY aria-label, title/description mounted and read-only neutral-label probe also failing. Not proven that HTML ARIA is invalid. Existing E2E injected axe script repeatedly per audit into same Radix page. Candidate one-time axe load + reset per real audit (all WCAG rules remain enabled) and additional strictly redacted IDREF/AOM structural diagnostics; require same-SHA QA. No production/hosted DB/business logic change. PR #221 stays Draft.

## 2026-11-24 — DS6 root axe error isolated diagnostically without further UI guessing

Commit aa599f1b CI 45485021450 PASS (298 unit tests, 32 strict modules), but auth QA 45485021426 FAIL 4 combos only root `aria-valid-attr-value` incomplete (zero violations), despite non-empty single `aria-label` and ZERO IDREF attrs. Root title and description mounted; mobile Partners scroll passes. Two previous structural guesses eliminated IDREFs yet never resolved axe incomplete. Added QA-only bounded root-cause probe to log axe-core's allowlisted `messageKey` + attribute NAME, and compare original vs neutral literal label in a direct rule run; always restore attribute and DO NOT bypass main axe failure. Requires same-SHA CI/E2E evidence. PR #221 Draft; no prod/hosted DB or merge.

## 2026-11-24 — DS6 dialog ARIA repeat failure and standards-grounded alternative

SHA 4eea8f5a CI 45483291071 PASS, QA 45483291054 FAIL four combinations only on root dialog `aria-valid-attr-value` incomplete; prior mobile Partners scroll violation gone. Explicit CSS-safe IDREFs did not fix incomplete, disproving our earlier hypothesis as sufficient. WAI-ARIA allows direct accessible dialog name via aria-label; APG advises omitting describedby on complex multi-section dialog. New candidate uses direct dynamic label on DialogContent and omits IDREF attrs while preserving DialogTitle, DialogDescription and focus management; safe logs record only attribute names/direct-label boolean. Must re-run same-SHA full CI and authenticated QA. #221 DRAFT; no hosted DB, prod, merge.

## 2026-11-24 — DS6 real Partners scroll and dialog IDREF follow-up

At SHA d7e10385 CI 45481474035 PASS; local auth QA 45481473896 FAIL 4 combinations. Previous button-name violations fixed, but mobile Partners scroll region at [12,160,368,436] lacked focus and all combinations retained one root-dialog `aria-valid-attr-value` incomplete. Safe diagnostic proves one valid existing target each for aria-labelledby/describedby with mounted title/description; exact cause unresolved. Candidate adds named tab-focusable Partners scroll, unique CSS-safe useId-derived title/description targets explicitly wired on ViewDealModal DialogContent, keeps those elements present also when editing. No disabling axe/CI tests, no business logic or hosted DB/prod changes. Needs same-SHA CI and QA before claiming resolved. Draft PR #221; user requested autonomy.

## 2026-11-24 — DS6 Partners QA real defects

SHA 2a1a36d7 CI 45478409187 PASS, authenticated local QA 45478409438 FAIL all 4 theme/viewport combinations in Partners: unnamed inert ExternalLink-only button (WCAG `button-name`) and one `aria-valid-attr-value` incomplete associated with dialog. Candidate replaces decorative icon button with aria-hidden span, adds safe IDREF existence booleans for root cause. No bypass of axe; no business changes. Keep #221 DRAFT, repeat same-SHA CI+QA and visual checks.

## 2026-11-24 — DS6 historical B2/B4 source tests realigned

At SHA 81953310, CI 45478015290 failed only two source assertions that hardcoded obsolete classes in the *real* /pipeline UI: B2 expected bg-info and bg-success surfaces, B4 expected sm:w-80. The actual route was intentionally migrated to --stage-* semantics and --ds-kanban-column-width. Update tests to check semantic-stage source and shared width token, not revert working central design. Requires exact-SHA CI+authenticated browser recheck. No production, migrations, hosted DB or merge; PR #221 draft.

## 2026-11-24 — DS6 actual Pipeline board identity discovered

Commit 560836ba CI success 45477099906 (295 tests, 31 strict migrated) but QA 45477099853 failed `COMMERCIAL_STAGE_TOKEN_RENDERING_FAILED`. Actual source `src/app/(dashboard)/pipeline/client-page.tsx` renders Kanban in-place, independently from the separately migrated `KanbanBoard.tsx`, which is not imported by the live page. UI proof was therefore missing despite source tests; this is a real route integration defect. Corrective candidate maps actual DEFAULT_STAGES 5 accents/surfaces to tokens, adds data-qa-stage hooks and shared geometry variables, locks real route. Business actions unchanged. Must re-run same-SHA CI/local auth/visual QA; no prod/Supabase/main merge.

## 2026-11-24 — DS6 prepared Commercial family atop mobile Goals fixes

An unreferenced cohesive DS6 candidate was rebased on top of current DS5 mobile fix 2f13339d, without touching PR #221 while its exact-SHA QA is running. Six original Pipeline/Opportunity surfaces centralize 194 previously measured local style occurrences; Kanban stage styles are compiled from static semantic classes instead of `bg-${column.color}` strings. Strict guard includes those six components. Isolated real-browser checks validate each rendered stage token and audit/capture Partners and Clientes modals in desktop/mobile light/dark without writing data. Release candidate still requires new SHA CI, QA, reference comparison and human merge; no production, Supabase hosted, migrations or financial business actions.

## 2026-11-24 — DS5 real mobile QA findings

SHA 93bc4b95 CI 45472526721 SUCCESS but QA run 45472526797 attempt 1 failed before launch (Docker inbucket port 54324 busy). Same-SHA QA rerun attempt 2 reached real browser and exposed mobile P1: Commissions clipped second user card text (axe incomplete contrast), Statement horizontally scrollable table not keyboard-focusable (axe violation), and Seasonality sticky PageHeader subtitle overlap after scrolling (axe incomplete). Actual mobile screenshots from artifact inspected. Targeted responsive correction: replace horizontal cards by CSS grid, tabIndex/role/aria-label table region, and non-sticky page header below md breakpoint. No business actions/DB/prod changes. Full CI and four-profile browser QA must pass before publishing prepared Commercial commit 922543d5; branch #221 stays DRAFT.

## 2026-11-24 — DS5 actual final DRE contrast root cause

SHA 9d8956ae passed CI 45471381649 (292 tests). Full local authenticated QA 45471381437 failed only one Planning contrast node, with safe box [836,452,156,16]. Inspected actual planning QA screenshot: exactly `(-) Ineficiência Ramp-up` inside FinancialSummaryCard; container `opacity-80` was reducing text contrast. Removed the row opacity without changing DRE values or formulas; source test added. The other four nested Goals states including seasonality have passed their audit. Same-SHA CI/QA must re-run; no UX approval until zero failures and visual review. Commercial migration exists only as unreferenced candidate commit c4118ce8, not on #221 while Goals gate open.

## 2026-11-24 — Goals stateful QA progressed to two residual states

Commit 28cca4b0 CI 45470307615 SUCCESS (291 tests, 25 strict components); isolated QA 45470307748 FAIL only in Planning and Seasonality after previous failures in all five nested states. New real screenshot confirms fixed 12-col toolbar/5+7 financial layout, with DRE on the right; residual clipped three-way goal selector at half width and translucent funnel surfaces causing axe contrast incomplete. Targeted code correction gives full-span mode selector and monthly goal, solid semantic funnel surface, no decorative opacity overlay, responsive 3-metric grid. Safe diagnostics add quantized bounds for remaining p-contrast issue. No math/actions/data/RBAC/DB/production change. PR #221 Draft and same-SHA QA gate remain.

## 2026-11-24 — DS5 real Goals visual/axe defects from expanded QA

After bf69f1dd CI PASS, real isolated QA run 45468723316 FAIL in ALL five newly tested Goals sub-states. Logs: commissions contrast 2; campaigns contrast 3 + labels 2; planning contrast 40 + labels 7 + incomplete 5; seasonal chart labels 7 + incomplete 20; statement contrast 2. Actual desktop screenshot proves severe Planning layout bug: a free FilterBar occupies one grid column, displacing results, plus duplicated nested goal selector. Candidate fixes real grid hierarchy, labels, shared accessible chart disclosure, semantic text and transition sampling. No server actions/tenant/RBAC/DB/production modifications; #221 stays DRAFT; require same-SHA CI+QA and screenshot review.

## 2026-11-24 — nested Goals QA detects genuine WCAG issue

The fully automated four-role QA on commit d68b9e82 (run 45466924462) failed inside Commissions state with one axe WCAG violation, no incompletes. CI 45466924408 was green, but it does NOT prove UX. This candidate adds safe rule-identifier and numeric style logging, continues through all Goals tab audits before failing, and changes Commissions fixed desktop layout to a responsive focusable list. Requires same-SHA tests, actual evidence and P1 closure. PR #221 DRAFT; no hosted DB or production changes.

## 2026-11-24 — DS5 Goals stateful authenticated coverage

After the 9-component Goals family migration, added fail-closed real-browser checks for Commissions/Campaigns/Planning/Seasonality/Statement screens in four viewport/theme combinations, including actual computed SVG fill against --primary. Unit checks alone did not cover these nested tab states; a green default route smoke is insufficient. No mutation actions are triggered. Still requires same-SHA CI and authenticated isolated QA completion; PR #221 stays DRAFT.

## 2026-11-24 — DS5 Goals family continuation and chart correctness

Latest confirmed PR #221 commit 5f879207: CI 45463359093 SUCCESS (287 tests, four WCAG synthetic combinations, strict policy 16, no regressions), authenticated isolated QA 45463359105 SUCCESS (4 local roles, 192 route checks). Debt measured 168 UI files / 3,593 occurrences. Owner said "prossiga". Next Goals family cohesive candidate migrates nine remaining UI surfaces (simulation, input, progress/badge, financial charts, stat tile, campaigns and statement) onto semantic tokens with strict hardcode locks. Source identified a real SeasonalityChart bug: hsl(var(--border/primary/etc)) is incompatible with current OKLCH CSS variables; use var() directly. Preserve formulas and persistence. No public Clinia image, server actions, hosted Supabase, production or main merge touched. New SHA CI and actual visual QA remain release gates.

## 2026-11-24 — DS5 Goals family semantic conversion

The user continued the approved central DS migration after PR #221 SHA 8395895d passed CI 45432758424 and isolated authenticated QA 45432758930 (192 visual route checks, four real local roles). Exact measured baseline: 172 files/3,834 local style occurrences versus original 196/5,536. This subsequent block migrated GoalsTab, FinancialSummaryCard (DRE), CommissionsTab, and DistributionModal to centralized semantic tones, typography, radii and shadows; removed ineffective StatsGrid local color/gradient/border overrides; added pressed-state accessibility and strict per-module design hardcode guards. Local matching style occurrences in these four files decreased by 241 (66+62+56+57) to zero, subject to final SHA recount. No financial formulas, server actions, DB, RBAC, prod or hosted services changed. Same-SHA CI/isolated QA and visual acceptance must be independently verified before merge; #221 remains DRAFT.

## 2026-11-24 — DS4 strict QA toolchain separation

The CRM lockfile already includes axe-core 4.11.1; isolated QA requires 4.14.0. Symlinking pinned QA packages into root node_modules risks replacing a preexisting app dependency. Updated isolated installer and both QA runners to resolve pinned browser/axe modules by explicit external file paths from GITHUB_ENV, with NO root node_modules modification. Next/React/package-lock SHA256 integrity remains the release gate. Still pending exact-SHA CI+authenticated QA.

## 2026-11-24 DS4 persisted theme diagnosis

Local authenticated QA on `8baeb597` remained blocked by failed theme write before any storage error code was emitted. Added safe stage-only codes AUTH/CLIENT/TRANSPORT to theme Server Action, preserving requireSessionContext, trusted per-user ID predicate, no hostname/secrets/SQL logging. No bypass, no production DB actions. Exact-SHA retry pending.

## 2026-11-24 — DS4 theme write failure isolated and bounded server action scope

Head `34fb0b39` CI [45428977985](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45428977985) **SUCCESS**, reduced measured design debt to **172 files/3,834 occurrences**, with 12 strictly locked migrated components and zero hardcode regression. Isolated authenticated QA [45428977868](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45428977868) **FAIL**: the client actually received a failed personal-theme save (`saveState=failed`) when switching dark to light, so the theme state correctly rolled back but the feature is not operational. As a narrow correction to the existing design theme feature, the personal `updateUserTheme` Server Action now requires a verified returned updated row from the trusted user profile, omits root-layout revalidation that could race client theme state and throws on absent/mismatched write. QA captures bounded safe backend error code only on failure and verifies persistence after page reload. No hosted SQL, migrations, new RBAC or tenant theme storage; full same-SHA certification still pending.

## 2026-11-24 — DS4 theme toggle and diff QA root cause correction

Candidate `6b342382` CI had all compile/unit/synthetic-a11y checks green but failed git diff whitespace check (fixed in docs and two UI modules). Isolated authenticated QA caught `wantedDark=false, renderedDark=true` without a confirmed toast save error, indicating the toggle's internal state may diverge from the real DOM theme. ThemeProvider now derives its toggle from `document.documentElement.classList.contains('dark')`, records only a bounded save-state flag, retains the latest-request rollback and previous-theme restoration on a genuinely failed write. Runner logs safe `saveState` if stabilization times out, and still refuses to fake dark/light classes. No production/hosted DB/server action change, new exact-SHA gates pending. PR #221 remains DRAFT.

## 2026-11-24 — DS4 candidate first failing gates

First DS4 candidate `9b9ba175` failed CI only on 3 historical source-string contracts that expected Tailwind utility spellings rather than the new semantic equivalents; fix tests without weakening color/contrast requirements. Isolated authenticated QA also failed while toggling themes: waitForFunction could not observe the expected dark class. ThemeProvider now initializes user preference once per mounted provider (guard against stale revalidated server props), still reverts the latest failed persistent save and warns the user. QA now captures only bounded safe theme-failure diagnostics instead of bypassing the real UI. Both gates must be rerun and accepted on new exact SHA. PR #221 remains DRAFT, no production/Supabase hosted modifications.

## 2026-11-24 — DS4 centralized propagation and strict cross-family migration

User authorized moving beyond opportunity detail to make the central Design System genuinely functional in the original Infodive CRM. PR #221 head before work: `2891b5ec`. GitHub Actions CI on that SHA read **188 affected UI files and 5,168 local style occurrences**, source baseline 196/5,536. Work expands the semantic token core to legacy Tailwind font/radius/shadow classes, typed KPI tones, five workspace consumers, and twelve prominent high-debt components. Uncontrolled ThemeInput/ThemeSelect previously forced empty values; ThemeProvider optimistic preference could remain visually changed after DB failure; the org-default theme settings falsely reported save although updateOrgTheme ignores the theme. This block fixes client primitives and removes false success without database changes. Browser proof must alter a single token in a synthetic authenticated page, check its computed propagation in multiple routes/themes/viewports, restore, and audit WCAG. Locked migrated modules must have zero measured style hardcodes; remaining repo debt and visual QA remain open. No Supabase hosted writes, migrations, API changes or human merge authorized.

## 2026-11-24 — DS3.1 QA diagnostic before certification

PR #221 candidate `f882c704` CI PASS, isolated authenticated QA FAIL across four detail viewports/themes because the new contact summary had invalid nested `dl/dt/dd` semantics; axe rules `definition-list` and `dlitem`. The new compact section navigation did not emit section-navigation diagnostics; still requires same-SHA retest. A corrective block converts contact info to valid paragraph labels/values, retains non-fabricated business facts, makes the recorded estimated amount, probability and date visible in the top summary on mobile, and strengthens primary-tab interaction tests. No server action, SQL, hosted Supabase or production modifications. Final QA and visual accept remain PENDING.

## 2026-11-24 — DS3.1 compact opportunity information architecture

Owner authorized continuation on DRAFT PR #221 after technical CI+authenticated QA PASS at `37dfb820`. Screenshots of opportunity detail in desktop/mobile and light/dark were directly inspected with the private `093410(1).png` reference: navigation occupies two rows desktop and four rows mobile, and four KPI cards overwhelm real commercial details. The next cohesive block keeps all eight original tabs and existing backend/business behavior, instead presenting Resumo/Produtos/Propostas as direct tabs, five secondary destinations through an accessible More selector, and an Overview powered only by actual deal fields. All layout tokens are centralized. Contract tests and browser QA must validate all destinations, no overflow, keyboard focus, and 4-theme/viewport screenshots of main and secondary History on the exact SHA. Still no production or hosted Supabase, no auto merge, no claim of global visual acceptance.

## 2026-11-24 — DS3 opportunity inspector and financial reconciliation (work on #221)

Owner authorized continuation after technical local QA PASS at SHA `141c128a`. A real synthetic screenshot displayed value estimated R$ 15,000 while the sidebar displayed product-calculated value R$ 0. Code inspection confirmed separate sources: `deal.value` vs `calculateDealValue(deal.deal_products)`, and an unsafe automatic `updateDeal(value)` on detail fetch. Product mutations already explicitly persist totals; do not change the financial calculator or server actions. Current block must make opening details read-only, label values separately, flag mismatch and reorganize the existing original CRM opportunity inspector using semantic layout tokens. Capture desktop/mobile and light/dark for the exact SHA before accepting. Remote protected QA, visual reviewer signoff and global 196-file migration remain PENDING. No main merge/production/Supabase hosted operations authorized.

# MEMORY — CRM Infodive UX/UI source of truth

## 2026-11-23 — G1/DS2 shell and commercial workspace integration

The owner explicitly authorized the next task after #221: integrate the functional G1 branch #220 with the central semantic Design System, not resume per-module hand-picked colors. #220 head inspected at 6f722876e91ec9cc761888a0f9cb48245eded3cb: its conventional CI PASS but full isolated authenticated QA FAIL on /pipeline -> deal-detail (color contrast violation and aria-hidden-focus incomplete). Do NOT claim #220 is accepted. Preserve its legitimate icon-rail/contextual navigation and board/list pipeline work, and fix the source cause against DS tokens.

PR #221 is extended on its OWN branch rather than creating another micro-PR. Integration adds centralized nav widths/icon targets/header height/filter geometry, centrally configured deal-card progress gradients, Typography roles in shell and Pipeline, accessible close label and QA regions in ViewDealModal, and reuse of the isolated synthetic QA workflow from #220. No Supabase hosted project, business code, credentials, production or main merge touched. Full integrated QA and contrast still pending on the candidate until actual run results are observed.


## 2026-11-23 user directive — CENTRALIZED configurable Design System, not pixel-by-pixel cleanup

The owner explicitly rejected continuing ad hoc local Tailwind restyling. On candidate 6fd9d590, CI run 45239400879 measured 196 UI files and 5,536 categorized style occurrences (broader than the earlier owner estimate of ~106 files). These numbers count matching style tokens, not distinct visual defects. A legitimate result requires changing fonts, colors, radii, shadows, typography and gradients centrally once with automatic propagation to ALL migrated modules. Preserve the existing visual identity; never ask the agent to invent local colors or choose new contrast palettes per module. No framework switch, business logic edits, Supabase migrations, or production deploy.

Confirmed on main: Next 16/Tailwind 4. src/app/globals.css had a base semantic palette but no coherent type/gradient token system; ViewDealModal.tsx had local from-blue-50/to-white and from-blue-50/to-teal-50 gradients; root layout loaded Inter while globals.css used --font-geist-sans; OrganizationThemeSettings presents an org theme picker but updateOrgTheme did not persist a default choice, so the UI is NOT a functional theme configuration system. Do not claim it is.

New implementation program: docs/ux/DESIGN_SYSTEM_MIGRATION.md; central defaults in src/design-system/tokens.css; shared primitives; per-file debt reporter and CI guard. Core DS0 is not global UX acceptance; remaining route families require incremental conversion and same-SHA visual/functional QA. PR #220 remains separate draft. Future runtime tenant theme config is out of scope pending security/migration authorization.


Last updated: 2026-11-19. Repository-scoped continuity, not ChatGPT personal memory.

## Owner's fixed goal
Modernize the ORIGINAL Infodive CRM so every existing module shares one polished, clear, navigable enterprise experience inspired by the user-provided Clinia UI examples. The clinical imagery is a VISUAL/INTERACTION REFERENCE, not a request to copy that product or add clinical functionality. Do not replace Infodive with a new app, greenfield CRM, WhatsApp product or unrelated service.

The user will not evaluate every micro-change. The executing agent owns discovery, diagnosis, implementation and correction; ask the owner only for actual external gates (principally human merge, any cost or production-impacting authorization). Work autonomously in complete blocks.

## What happened and what NOT to repeat
- Issue #214; PRs #215, #216, #217 and #218 were merged. Main reached c04754c9fc9a2800f8cfb34a8db75ac92dd7ec78; Vercel production deployed that commit.
- B4 authenticated E2E #87 was successful with four test profiles and 172 visual/technical assertions, but coverage emphasized functionality, accessibility, responsiveness and component contracts; it did NOT measure perceived Clinia-reference fidelity or whole-product navigation.
- On 2026-11-19 the owner inspected the live CRM and rejected the UX result. Modules still differ in layout and controls, sidebar remains overloaded, visual hierarchy not unified. No blanket claim of UX completion is allowed.
- A successful build, screenshot existence, WCAG/axe PASS, or GitHub green workflow must never be relabeled "visual acceptance".
- The owner supplied 19 Clinia screenshots and ui-ux-pro-max-skill-main.zip and requested that they become reusable persistent inputs, not a document delegated back to the user.

## Source locations
- PRIVATE source files, accessible to authorized ChatGPT agents via Library: /CRM/UX Clinia - Referencias 2026-11-19 (19 PNG files + original ZIP).
- PUBLIC text contract: docs/ux/CLINIA_VISUAL_CONTRACT.md.
- Private-vs-public inventory: docs/ux/REFERENCE_MANIFEST.md.
- Implementation gates and progress: docs/ux/UX_RECOVERY_PLAN.md.
- Project skill: .agents/skills/crm-clinia-ux/SKILL.md. The official main UI/UX Pro Max skill is vendored as a separate project-local skill under .agents/skills/ui-ux-pro-max from a pinned upstream commit; this is NOT a global ChatGPT Skill installation.

## Product and boundaries
Next.js, Tailwind and shared components; original Infodive commercial entities and the existing Service Desk module. Preserve business rules, auth/RBAC, RLS, multitenancy, currencies/exchange rates, proposal/PDF generation, integrators and all live data. QA is isolated; no mutations in production. Keep source in existing repository. No hardcoded customer/clinic names, demo counts, brand substitutions or fake modules.

## User-provided visual direction
Compact icon rail; contextual navigation by area; restrained light surfaces with blue-gray neutrals; consistent page headers, filters, tables, cards, kanban and side panels; CRM list/board switch; detailed opportunity panel with separate activities/timeline tabs; 3-pane inbox where capability exists; internal chat patterns; statistics with contextual sub-navigation; visual workflow editor only if product engine exists. Use Clinia layout patterns, not logos, images, copyrighted UI assets, patient data or clinical-specific terminology.

## Real acceptance, not a counter
A route-family is complete only with: feature contract preserved; actual authenticated QA browser visual snapshots compared to reference; no critical layout/navigation divergence; functional regression PASS; accessibility/responsive PASS; explicit objective evidence and human merge gate. Overall UX remains NOT ACCEPTED until all scoped route families pass. The agent must track each route family separately; never reset or inflate progress.

## Next work AFTER this preparation PR is merged
The conditional G0–G5 execution authorization is already recorded at the top of docs/codex/CURRENT_TASK.md and activates only after PR #219 is merged humanly. Then complete baseline/audit, shell/navigation, commercial workspaces, operational workspaces, analytics/admin and final visual acceptance against original references. Do not reopen previously merged PRs, and do not start an unrelated application.
