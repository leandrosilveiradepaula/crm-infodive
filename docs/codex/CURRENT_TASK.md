## 2026-11-24 — DS8 integrated dashboard, shared command and catalog styling

The single centralized CRM Design System Draft PR #221 now includes 16 additional original Dashboard/Products/Email/CommandBar/Notifications/Handover components with private Tailwind palette, type-scale and geometry substitutions to existing central `tokens.css` roles. Measured category reduction in these files: 71 + 142 = 213 local occurrences, not 213 independent user-facing defects. Adds 14 newly clean modules to strict anti-hardcode policy; source tests verify all 16 family members. Colors and font weights remain centrally configurable and light/dark semantic; no product, backend, Auth, financial rules, live data or migrations changed. This batch is NOT globally visually certified until exact new SHA browser proofs and the approved private screenshots are compared. Preserve PR Draft and human main merge.

---

## 2026-11-24 — DS8 follow-up: genuine login, charts, calendar and opportunity diagnosis

Continues the original CRM Design System branch and single PR #221. Eight additional existing components (login page, opportunity AI header, shared calendar and five charts) are switched to the same semantic palette/type/geometry primitives; 230 additional local-style matches were eliminated by the inventory categories in this batch. Three newly clean modules are strict-guarded, with source contracts for all eight. Unchanged login/auth semantics, sales chart data and AI callbacks; no personal data, hosted infrastructure, migrations or production. A source contract is NOT a browser screenshot or functional acceptance. Login/analytics visual contrast in both themes still needs actual final-SHA browser proof and separate owner visual assessment. Previously inspected private screen references remain private.

---

## 2026-11-24 — DS8: customer lifecycle, activity/integration, inbox-related and leaderboard migration

Continue the SAME Draft PR #221: after DS7's substantial Operation/Admin + Commercial migration, this next pre-reviewed block centralizes 32 original React UI modules spanning Customers, Contacts, Leads, Email, Omnichannel, Integrations, Activities, Gamification and a proposal selector card. Removes 746 categorized local-style occurrences in this batch (measured by the current matching categories, not distinct UX bugs). Adds 21 newly zero-debt modules to the strict anti-hardcode guard, plus family-level source contracts. Existing typed state, Server Actions, permission checks, calculation functions and response data are unchanged. Existing specialized email/marketing decorations and user-facing output still require separate visual evidence; never claim global completion based only on regex counts. The live browser must retest all existing full route/profile/viewport/theme conditions on the EXACT final SHA, including keyboard, WCAG zero violation/incomplete, token propagation, auth, and snapshots. Human main merge gate; no hosted DB, migrations or production.

---

## 2026-11-24 — DS7 commercial family integrated with Operation/Admin bulk migration

Owner requested to finish the existing centrally configurable Design System in ONE cohesive PR #221, not additional micro-PRs. After the 26 Operations/Admin source files, this candidate migrates 24 more original CRM TSX modules across Sales, Sales Order, Product catalog, Pipeline product workflows, proposal editor/versions, public proposal and customer portal. Private Tailwind palette/font/geometry declarations now reference the existing centralized light/dark roles in `src/design-system/tokens.css`. Existing data/API/payment/financial/tenant/role behavior remains untouched; branded output defaults and existing decorative gradients remain under explicit residual review rather than silently altered. Added 17 new strictly locked clean modules and a source contract covering all 24 commercial modules, in addition to the prior Operations/Admin family contract. This is structural source centralization, not universal UX acceptance.

Original reference screenshots were inspected in private. The previous exact-SHA QA (run 45502306283, SHA 2c82a0e4) proved the orphan tabpanel ARIA issue fixed (no incompletes) but found a real low-contrast `StakeholdersTab` empty-state paragraph; this candidate removes its whole-panel opacity and adds regression coverage. **New exact-SHA TypeScript, unit, build, design policy, WCAG preflight, real four-profile 22-route isolated authenticated QA and visual review are required.** Keep Draft PR, no human merge, hosted Supabase, Vercel production or migrations.

---

## 2026-11-24 — DS7: cohesive Operations/Admin family migration, keep Draft pending real QA

Owner explicitly requested the Design System completion, not repeated micro-PRs. Prepared a substantial **single-PR** migration on 26 original CRM operational and administration TSX modules: Settings/Users/Security, Activities, Automations, Contracts and Service Desk. Existing Tailwind palette names, sub-12px font sizes, locally chosen type scales, radius and shadow classes are replaced by the shared light/dark semantic palette, typography, control/panel radius and elevation roles. No new identity; all default values remain in `src/design-system/tokens.css`. Strict no-hardcode policy now locks 16 newly clean modules. Original read-only visual source screenshots were examined privately; no third-party assets published.

This is code centralization, **not** a declaration of full product UX acceptance. Preserved real Server Actions, user/account permissions, tenants, contract/signature logic, calculations and persistence; no hosted DB, migrations, or production operations. Source-level regression contract covers all 26 modules. Some existing business default hex values and local decorative gradients remain outside this partial cleanup and must be reviewed explicitly before declaring global completion. **Required next gate:** exact SHA TypeScript, unit, build, strict token policy plus isolated authenticated four-profile/22-route light/dark desktop/mobile browser with zero axe violations AND incomplete, propagation and screenshots compared to reference. Keep PR #221 DRAFT, human merge only.

---

## 2026-11-24 — DS6 ROOT CAUSE: OVERFLOW SELECTOR MUST NOT RENDER ORPHAN TABPANELS

At exact SHA 82377adb, CI run 45495842854 PASS but four-profile isolated authenticated QA run 45495842864 FAIL in all four Partners viewport/theme combinations, one axe-core 4.14 `aria-valid-attr-value` incomplete (`noIdShadow`), zero violations. Full target resolution established the failing element is a DIV INSIDE the dialog bearing `aria-labelledby` with one reference that is NOT in the document; the dialog itself has a valid direct `aria-label`. The actual component renders five `TabsContent` instances for destinations selected by a Radix Select/combobox, with NO matching Radix `TabsTrigger`; Radix generates `role=tabpanel` and `aria-labelledby` for missing trigger IDs. Fix the semantic mismatch for all five secondary destinations by rendering conditionally named `role=region` sections; keep primary three genuine Radix tabs, selector labels, all commercial state/actions and central visual tokens untouched. Extend the real browser QA to exercise all five named regions and check for unresolved IDREFs; preserve full WCAG rule set, zero incomplete threshold, keyboard and functional gates. Same PR #221 DRAFT; rerun CI plus isolated authenticated 4-role/22-route/mobile/desktop/light/dark QA on NEW exact SHA before claiming resolved. No production, hosted DB, migration, secrets or merge.

---

## 2026-11-24 — DS6 AXE VIRTUAL TARGET FORENSICS, FAIL CLOSED

At exact SHA b4e5bd7a, CI 45491164463 PASS, isolated authenticated QA 45491164346 FAIL. Per source axe-core 4.14 aria-valid-attr-value-evaluate.js (lines 80-90), `noIdShadow` is assigned when `aria-labelledby` has an unresolved IDREF and the axe virtual tree contains shadow DOM. Reloading axe once/resetting its virtual tree did NOT cure the failure; this disproves stale-injection-only hypothesis. Current diagnostics erroneously infer failing node from `node.target[0]`, but axe targets can be nested selector paths for shadows/frames; the dialog may be an ancestor or wrong target. New QA-only read-only probe resolves every target segment including shadowRoot/contentDocument and reports only boolean structure, safe tag names, ARIA attribute NAMES, and reference existence/counts (never IDs, selectors, raw values, HTML or customer data). The rule remains enabled, zero incomplete/violation gate unchanged. Next same-SHA CI+auth QA identifies TRUE offending descendant before any application UI change. Existing Draft PR #221; no prod, hosted Supabase, migrations, or business behavior touched.

---

## 2026-11-24 — DS6 STALE AXE VIRTUAL TREE HYPOTHESIS, NOT YET CERTIFIED

At HEAD a208b6b0, CI run 45487106786 PASS, real auth QA 45487106841 FAIL all 4 Partners states on a *single* `aria-valid-attr-value` incomplete with `noIdShadow`, `attributeName=aria-labelledby`, although DOM root explicitly has aria-label only; `aria-labelledby`/describedby absent, visible title and sr-only description mounted, neutral accessible label read-only probe fails too. Earlier CSS-safe IDREF and direct aria-label approaches both failed. The current QA called `page.addScriptTag({content:axeSource})` on every nested audit, repeatedly injecting axe 4.14 into the same React/Radix dialog while tabs and DOM state change. Candidate adjusts harness to initialize axe once per page, call axe.reset() before every full WCAG audit, and capture only safe boolean/number IDREF/AOM reference diagnostics on failure. DO NOT suppress or waive axe incompletes; same-SHA CI+real local authenticated 4-role QA, accessibility and screenshots must pass for release. Maintain Draft PR #221, no merge, production, hosted Supabase, migrations or business operations.

---

## 2026-11-24 — DS6 READ-ONLY AXE ARIA CHECK ISOLATION

Same SHA aa599f1b CI 45485021450 SUCCESS (298 tests, 32 strict modules, zero regressions). Real local auth QA 45485021426 FAILED ONLY on `aria-valid-attr-value` *incomplete* on the root opportunity dialog in desktop/mobile, light/dark. No violations. Safe diagnostic shows the dialog has ONLY `aria-label` with a non-empty value; there are NO aria-labelledby/describedby IDREF attributes, and title/description elements exist. Therefore previous IDREF fix and direct aria-label naming do not remove this axe inconclusive result; stop blindly changing UI. axe-core 4.14's own aria-valid-attr-value evaluate sets structured `data.messageKey` of `noId/noIdShadow/ariaCurrent/idrefs/empty/controlsWithinPopup` when incomplete. Instrument that key and sanitized ARIA ATTRIBUTE NAME only, never raw values/customer data. Run a separate read-only targeted axe rule comparison on the live dialog with original versus neutral literal aria-label, always restore the original DOM and retain original audit failure. Inspect exact new SHA results before any UI change. Keep draft PR #221, no production, hosted DB, migrations or merge.

---

## 2026-11-24 — DS6 USE A DIRECT ACCESSIBLE NAME FOR COMPLEX DEAL DIALOG

Evidence: SHA 4eea8f5a CI 45483291071 SUCCESS (298 tests, all 4 synthetic axe checks), real authenticated QA 45483291054 FAILED only `aria-valid-attr-value` incomplete on root deal dialog in all 4 light/dark desktop/mobile combinations. Both IDREF references existed and title/description were mounted. Previous mobile Partners scroll `scrollable-region-focusable` defect is FIXED (zero violations). CSS-safe explicit IDREF did not eliminate the incomplete; reject that previous root-cause hypothesis. Per official WAI-ARIA spec, role dialog may have an accessible name via aria-label OR aria-labelledby. WAI-ARIA APG advises omitting aria-describedby for complex multi-section dialogs where content should be navigated structurally. Candidate: use meaningful dynamic direct aria-label on DialogContent, explicitly omit both IDREF props while retaining visible DialogTitle and sr-only DialogDescription for in-content navigation, and keep edit-mode title mounted. Add safe browser diagnostic of attribute *names only* and direct-name boolean. Do not disable axe or relax zero-incomplete gate. Re-run exact new SHA CI+4-profile authenticated QA, inspect reference screenshots and leave PR #221 DRAFT. No hosted DB/prod/merge.

---

## 2026-11-24 — DS6 COMMERCIAL DIALOG IDREF AND MOBILE KEYBOARD SCROLL

At exact SHA d7e10385, CI 45481474035 SUCCESS, authenticated local QA 45481473896 FAILED 4 combinations. The earlier unnamed decorative button was fixed: zero `button-name` violations. Remaining real defect on mobile: `scrollable-region-focusable` in Partners tab at [12,160,368,436]. Add proper named focusable scroll region and visible focus ring. All viewport/theme combinations also reported axe `aria-valid-attr-value` **incomplete** on the root dialog even though `aria-labelledby` and `aria-describedby` each pointed to one existing node and title/description were mounted (safe diagnostics). External axe-core issue #4576 describes unresolved React useId CSS-special-character references in certain integrations; exact cause here is not proven. Candidate assigns deterministic CSS-safe IDs from sanitized React.useId to DialogContent/Title/Description, keeps dialog's name/description mounted during edit mode, and labels editable deal title. No axe rule suppression, no business actions changes. Need new exact-SHA CI plus local authenticated four-role 22-route, desktop/mobile light/dark E2E and screenshot review. If ARIA remains incomplete, obtain deeper safe evidence rather than accepting. Same Draft PR #221, no hosted DB, prod or merge.

---

## 2026-11-24 — DS6 AUTHENTICATED PARTNERS A11Y BLOCKER

SHA 2a1a36d7 CI run 45478409187 SUCCESS (296 tests, 32 strict modules). Authenticated QA 45478409438 FAILED four theme/viewport combinations on the nested Partners tab with one `button-name` violation: icon-only `ExternalLink` rendered in an inert `<button>`, no aria label or click handler, exact visual coords [884,328] desktop and [324,528] mobile. This is decorative rather than an actionable link: replace with aria-hidden icon span, do NOT add misleading accessible button. Axe also reports one `aria-valid-attr-value` incomplete on the dialog itself (source cause uncertain): instrument only safe booleans of ARIA reference existence + title/description presence, never actual ids/HTML/customer data; retain zero violation AND zero incomplete gate. Next run same-SHA real four-role 22-route QA and screenshots; finish Partners/Clientes navigation. PR #221 DRAFT, no prod/hosted Supabase/merge.

---

## 2026-11-24 — DS6 SYNCHRONIZE HISTORICAL B2/B4 SOURCE TEST CONTRACTS

Exact SHA 81953310 real /pipeline route correctly changed five stage accents to centrally configured `bg-stage-*` classes and column geometry to `sm:w-[var(--ds-kanban-column-width)]`. CI run 45478015290 FAILED with exactly two existing source-contract assertions, which still expected old `bg-info`/`bg-success` stage classes and hardcoded `sm:w-80`. Update the old tests to assert NEW semantic-stage literals, DOM QA hook and central column variable. Do NOT revert the actual route to satisfy historical test literals. Preserve all business logic and compare same-SHA CI and real authenticated four-profile QA before considering DS6 certified. Same DRAFT PR #221, no merge, hosted DB or production.

---

## 2026-11-24 — DS6 REAL PIPELINE BOARD ROUTING CORRECTION

Owner's original centralized Design System priority remains active, same DRAFT PR #221. Exact CI SHA 560836ba passed 295 tests and strict policy (31 locked modules; 153 affected files/3,214 occurrences), but local authenticated QA 45477099853 FAILED at `COMMERCIAL_STAGE_TOKEN_RENDERING_FAILED` before opportunity modal checks. Root cause verified in the REAL source: `src/app/(dashboard)/pipeline/client-page.tsx` renders its own `DragDropContext` and `DEFAULT_STAGES`; `src/components/pipeline/KanbanBoard.tsx` migrated in DS6 is NOT imported by that live page. Update the actual route's existing five static stage accents/surfaces to `bg-stage-*`/semantic borders, add QA hooks to real rendered stages, and centralize column dimensions in tokens.css; preserve drag-and-drop and business logic. Lock the actual route under strict guard (confirmed zero pre-existing palette/font/radius/shadow-local occurrences). Require new exact-SHA full CI, authenticated local QA, screenshot review and zero WCAG violations/incompletes before asserting Commercial complete. No prod, Supabase hosted or merge.

---

## 2026-11-24 — DS6 COMMERCIAL FAMILY AFTER DS5 MOBILE CERTIFICATION

Owner repeatedly authorized continuing the original Infodive CRM centralized Design System and preserving same Draft PR #221. **Conditional gate:** publish this prepared Commercial candidate only after DS5 Goals exact-SHA CI and real four-profile isolated QA PASS; do not mask remaining mobile a11y findings. Scope: six components of original Pipeline/Opportunity (KanbanBoard, DealFormModal, PartnersTab, StakeholdersTab, LostDealModal, CommissionWidget) migrated to semantic tokens. Kanban's dynamically constructed Tailwind classes become static typed five-stage classes. Existing stage transitions, RBAC, commissions, calculations, tenancy and server actions stay unchanged. Add fail-closed real browser computed-stage-token checks, read-only Partners/Clientes modal navigation and WCAG/screenshot checks on desktop/mobile, light/dark. Extend strict token guard to six files. Run exact-SHA CI and authenticated QA; visual acceptance and human merge gate remain separate. No Supabase hosted changes, migrations, secrets or production.

---

## 2026-11-24 — DS5 MOBILE ACCESSIBILITY CERTIFICATION BLOCK

Owner authorized continue after CI success on 93bc4b95. First real QA attempt 45472526797 failed in the local-only Supabase Docker setup due an occupied inbucket host port 54324; rerunning just the failed job (attempt 2) reached the authenticated browser and exposed new mobile-only issues: Commissions had one color-contrast `incomplete` on clipped user name in a horizontally scrolling button list (numeric box [316,448,124,16]); Statement had one `scrollable-region-focusable` violation on the horizontally scrolling table (box [24,556,340,124]); Seasonality had an axe overlap `incomplete` in the sticky page-header subtitle (box [12,96,368,36]) after scrolling to the graph. Fix all three coherently: mobile users grid with fully visible buttons; focusable named table scroll region; non-sticky mobile PageHeader, retaining md+ sticky. Preserve all DB/actions/RBAC/commissions; run new exact-SHA CI and isolated four-profile 22-route light/dark desktop/mobile QA before Commercial candidate. PR #221 stays DRAFT.

---

## 2026-11-24 — DS5 SINGLE REMAINING DRE CONTRAST VIOLATION

Real QA SHA 9d8956ae (run 45471381437) has exactly one failing Goals state, Planning, with one `color-contrast` node. Direct evidence coordinates [836,452,156,16] on actual screenshot identify the `Ineficiência Ramp-up` label inside FinancialSummaryCard. The row had `opacity-80` on the whole text container, making it less readable. Remove this unnecessary opacity only, preserving all values and business logic, plus permanent source contract. Re-run exact-SHA CI, authenticated four-role 22-route QA, both themes/mobile/desktop and inspect screenshot. PR #221 stays DRAFT. Do not publish subsequent Commercial candidate until this gate passes; no hosted DB/production/main merge.

---

## 2026-11-24 — DS5 GOALS REAL VISUAL AND AXE DEFECTS FOUND

Owner directed autonomous completion. Exact SHA bf69f1dd CI 45468723328 SUCCESS, isolated authenticated QA 45468723316 **FAIL**. Sanitized logs identify five nested Goals states: Commissions 2 contrast violations; Campaigns 3 contrast + 2 unlabeled fields; Planning 40 contrast + 7 unlabeled fields + 5 axe incomplete; Seasonality 7 labels + 20 incomplete SVG; Statement 2 contrast. Real desktop screenshot additionally proves P1 planning layout: FilterBar occupies one column of a 12-grid, displacing right results below left, and a duplicated inner grid wrapper crushes goal mode options. Do NOT claim UX accepted. Fix actual grid composition, labels, chart SVG accessibility and tab animation sampling, using central tokens. No change to math, Server Actions, access control or hosted DB. Same-SHA CI/real QA must prove zero violations and zero incompletes in all nested states across both viewports/themes.

---

## 2026-11-24 — DS5 AUTHENTICATED GOALS STATE QA BLOCKER

Owner said "prossiga" after full CI success at d68b9e82 (run 45466924408), but real isolated authenticated QA 45466924462 **FAIL** at commissions nested tab: one WCAG violation, unknown rule. This is a genuine blocker, not UX approval. Continue SAME DRAFT PR #221 with a narrow responsive/accessibility correction for CommissionsTab and safe, redacted axe diagnostics for ALL nested Goals tab states, rather than masking or bypassing the violation. Strict zero-hardcode lock and commercial calculations/actions must remain unchanged. Re-run TypeScript, unit, build, policy and same-SHA isolated 4-role 22-route QA; inspect the actual failing rule before asserting fix. No hosted Supabase, migration, production or merge.

---

## 2026-11-24 — DS5 GOALS FAMILY COMPLETION CANDIDATE

Owner explicitly authorized "prossiga" after same-SHA CI and local authenticated QA PASS on PR #221 commit 5f879207 (runs 45463359093 / 45463359105). Continue SAME DRAFT PR #221 only. Verified debt 168 files / 3,593 occurrences (from run 45463359093), not UX acceptance. Authorized cohesive UI-only Goals family: CommissionSimulator, EnhancedProgressBar, GoalInput, PerformanceBadge, ProfitabilityChart, SeasonalityChart, StatsCard, CampaignsTab and StatementTab. Replace visual literals with semantic token roles, correct Recharts HSL/OKLCH mismatch, improve keyboard/ARIA and small-screen scrolling without changing commission math, goals, server actions, RBAC, tenants, database or production. Add all fully migrated files to strict guard and source contracts. Require exact final SHA CI and four-profile authenticated isolated browser QA desktop/mobile light/dark; visually compare private references before release. Do not merge automatically; #221 remains DRAFT.

---

## 2026-11-24 — DS5 GOALS FAMILY CENTRALIZATION (same DRAFT PR #221)

Owner said "continue" after SHA 8395895d achieved both CI and isolated authenticated QA PASS. Authorized scope: migrate presentation only in four existing Goals components (financial DRE, Goals dashboard, Commissions, Distribution) to shared semantic tokens with strict hardcode lock and regression tests. Preserve amounts, calculations, handlers, persistence, permissions and tenant isolation. Required: exact final SHA TypeScript/tests/build/axe/diff/policy CI plus isolated four-role, 22-route desktop/mobile/light/dark browser QA and visual comparison. No Supabase hosted database, migrations, API changes, production or main merge. This PR stays DRAFT pending owner review.

---

## 2026-11-24 — DS4 QA isolation implementation clarification

Source lockfile confirms an existing app axe-core 4.11.1 versus pinned QA axe-core 4.14.0. The shared installer must **NOT** symlink or replace anything inside the app's node_modules after Next build. Export only isolated absolute module file paths via GITHUB_ENV and make the two QA test runners read those paths. Keep runtime package integrity proof and all previous CI+authenticated QA gates. No production or hosted DB operations.

---

# CURRENT_TASK — 2026-11-24: DS4 PERSONAL THEME PERSISTENCE CERTIFICATION

**Explicit goal:** user requested the Design System working perfectly, including the currently existing individual light/dark preference. Continue SAME DRAFT PR #221, no main merge.

**Observed:** Candidates `9b9ba175` and `6b342382` failed real local authenticated QA while switching light/dark. Candidate `34fb0b39` passed full CI (run 45428977985) but failed local authenticated QA (45428977868) with `CRM_THEME_PERSISTENCE_BLOCKED: wantedDark=false, renderedDark=true, saveState=failed`. The preference Server Action truly rejected the write; earlier purely optimistic toggle masked this. The current priority is a narrow root-cause correction and receipt, not additional cosmetic changes.

**Narrow exception to prior task:** allowed to correct **only** `updateUserTheme` in `src/app/actions/theme-actions.ts` as part of the requested individual Design System theme feature. Keep `requireSessionContext` and per-user `profiles.id` scope, ensure an actual updated record is returned and matches the requested theme, omit unnecessary root `revalidatePath('/')`, fail closed and log only bounded non-sensitive backend code for isolated QA. No other Server Action, API, tenant permission/schema, commercial logic or hosted DB operation is authorized.

**Required gates:** real same-SHA isolated browser QA verifies click, server save confirmation, and that the theme survives a full authenticated page reload, on desktop/light/dark with 4 profiles/22 routes; the existing 9-token propagation and all WCAG checks must still pass. CI TypeScript/unit/build/diff/design policy/axe; compare screenshots against private reference. Keep the PR DRAFT.

---

# CURRENT_TASK — 2026-11-24: DS4 CENTRAL PROPAGATION + MULTI-FAMILY MIGRATION

**Owner authorization:** “Ok, prossiga, quero o design system em perfeito funcionamento.” Continue in the SAME DRAFT PR #221 from exact head `2891b5ecc82cc54dcc242338a0f946d89a25138c`. No main merge or production deployment.

**Confirmed baseline:** Last CI 45418898557 SUCCESS on prior head. Its read-only design debt report measured 188 UI files and 5,168 local-style occurrences, down from the original 196/5,536 baseline. These are counted occurrences, not independent bugs. Shared StatItem still accepted per-page color/gradient/border strings, legacy Tailwind font/shadow utilities were not all tied to the new configurable primitives, ThemeInput/ThemeSelect forced `value=""` when callers omitted value, and OrganizationThemeSettings claimed organizational default theme saved even though its server action ignores the theme argument.

**Authorized cohesive block:** Upgrade central `tokens.css` compatibility bridge for Tailwind font/radius/shadow utilities, implement typed semantic stat tones, migrate StatGrid consumers (Leads, Contacts, Reports, Sales, Pipeline) and twelve high-debt existing UI components across commercial, pipeline, operation, analytics, proposals and procurement. Lock migrated modules with strict zero-local-hardcode policy. Make uncontrolled shared fields editable, revert failed personal-theme saves, and stop claiming the unsupported organization theme is persistent. Add a local authenticated browser **computed-style propagation test**: modify and restore one token at a time, verifying shared header, stats, button, font and gradient in light/dark across multiple routes; do not persist any temporary value. Update tests and docs.

**Denied:** schema/migrations, Supabase hosted DB, API/Server Actions, auth/RLS/RBAC, financial calculations, tenant theme storage, dependencies, credentials, Vercel or production, auto merge, copying private visual references to GitHub. Org default-theme persistence requires separately scoped schema+authorization gate; do not fake its success.

**Required QA:** CI TypeScript/unit tests/build/axe/design policy/diff, exact SHA local isolated authenticated QA, 4 roles, 22 authorized routes, desktop+mobile and light+dark, zero WCAG violations/incompletes, keyboard/navigation and token propagation probe PASS. Inspect source screenshots and document actual remaining debt on final SHA; do not claim full 188-file migration or universal UX acceptance without evidence. Keep PR #221 DRAFT.

---

# CURRENT_TASK — 2026-11-24: DS3.1 OPPORTUNITY INFORMATION HIERARCHY AND SECTION NAVIGATION

**Owner authorization:** "prossiga" after G2/DS3 local isolated authenticated QA PASS, 176 checks, CI PASS on `37dfb820`. Extend **only** DRAFT PR #221 on existing branch, no merge to main.

**Direct evidence:** inspected all four real authenticated synthetic QA detail captures for `37dfb820` (desktop/mobile, light/dark), plus the owner's private `Captura de tela 2026-11-17 093410(1).png`. The CRM modal's 8 equal-weight tabs require two rows desktop and four rows mobile. Four broad KPI cards and duplicated status summaries dominate the central panel, obscuring the core company/contact/context/details found in the reference. Prior technical PASS does not equal visual acceptance.

**Allowed block:** Keep all eight real section destinations and server actions, but expose 3 high-frequency direct tabs plus 5 secondary destinations through an accessible selector, and move the overview to a dense readable definition-list composition using recorded deal fields only. All spacing, layout columns, widths and surface roles live in `src/design-system/tokens.css`. Update contract tests, actual authenticated browser navigation and screenshots, and the visual evidence ledger. Do not fake contact roles, AI recommendations, activity dates, prices or engagement events.

**Prohibited:** business/service/API behavior changes, financial calculation or persisted-value synchronization changes, RLS/RBAC/tenancy, migrations, hosted Supabase, external integrations, production, automated merge, screenshot publication to this public repo.

**Required proof:** exact final SHA CI (TypeScript, unit tests, Next build, token guard, WCAG preflight), real isolated synthetic authenticated QA (four profiles, 22 routes, both themes and viewport sizes), modal tab destinations via keyboard and pointer, overflow absence, screenshots of overview AND secondary History at desktop/mobile × light/dark, evidence-based comparison with the private visual source. Keep UX and main merge gate open until human visual review and remote protected QA if required. The complete 196-file migration is NOT finished.

---

# CURRENT_TASK — 2026-11-24: DS3 OPPORTUNITY INSPECTOR + FINANCIAL PRESENTATION

**Owner authorization:** "prossiga" after #221 local CI and authenticated QA passed at `141c128a`. Extend the same DRAFT PR #221, never merge main or deploy.

**Confirmed defect:** The Opportunity dialog showed the stored deal estimate (R$15,000.00 in synthetic QA) alongside a second "Forecast" computed from product `unit_price` (R$0.00). The two values have different sources, but labels did not explain that. Worse, opening the dialog invoked `handleProductsUpdate`, which could silently execute `updateDeal({value: calculated})` during a read-only view. Explicit mutations in `DealProductsTab` already persist recalculated totals.

**Allowed cohesive block:** Presentation-only refactor of `ViewDealModal`, `OverviewTab`, `DealActivityTimeline` and centralized `src/design-system/tokens.css`; no business calculation changes. Distinguish estimated vs product-derived amounts and display an explicit reconciliation warning; make opening a deal read-only; keep existing stage transitions, product edit, proposal, contract, AI and portal functionality accessible. Reduce header/tab crowding and align main details/right-side context to the owner-provided opportunity drawer reference. Update isolated local authenticated QA to capture detail desktop/mobile, light/dark, tests and UX evidence ledger.

**Denied:** SQL/migrations, hosted Supabase, APIs/services, tenant/RBAC policy, financial calculation formula, production deploy, integrations, credential changes, automatic merge. The 196-file global design-system migration remains unfinished. This task is NOT visual UX acceptance of the entire CRM.

**Required gates:** Exact SHA TypeScript, unit tests, Next build, design-token guard and real synthetic authenticated QA; 4 dialog screenshots (desktop/mobile x light/dark), WCAG/incomplete fail closed, keyboard focus, no document overflow and no automatic write from read paths. Review source-vs-QA screenshots and ledger. Keep #221 DRAFT until genuine human merge and remote QA gate.

---

# CURRENT_TASK — 2026-11-23: INTEGRATE G1 SHELL AND PIPELINE ON CENTRAL DESIGN SYSTEM

**Owner authorization:** “prossiga com a próxima tarefa” after Design System PR #221. Extend the existing DRAFT PR #221; use the implementation from DRAFT PR #220 only where consistent with global semantic tokens. Do not merge any branch into main.

**Exact source candidates:** #221 head at task start 1a68e9de93e49bc0d4a201aa62ccffbccfa1d317; #220 head 6f722876e91ec9cc761888a0f9cb48245eded3cb. #220 regular CI PASS, latest local authenticated QA FAIL on Pipeline opportunity detail. This task MUST not relabel it PASS. Real screenshot references are the 19 privately held Clinia PNGs; no copying them to public GitHub.

**Implementation block:** integrate Sidebar contextual icon rail, Header and ViewToggle, Pipeline board/list, DealCard, shared StatsGrid/FilterBar and detail accessibility into the centralized token contract in src/design-system/tokens.css. No new hardcoded colors, fonts, control radius, shadows or gradients; CSS semantics own all design values. Preserve route hierarchy, features and all financial logic. Reuse sanitized SHA-bound E2E local QA workflow, do not connect hosted Supabase.

**Allowed:** original UI presentation components listed above; one coherent isolated local-QA workflow and test helpers from #220; relevant tests, docs/ux/**, MEMORY.md, docs/codex/CURRENT_TASK.md and token style additions. **Denied:** database migrations, API/server actions, tenant/RBAC changes, production deployments, hosted credentials, other repos and any automatic merge.

**Completion criteria:** CI unit+build+synthetic axe+nonregression guard PASS on the exact candidate; isolated authenticated local QA with sanitized screenshots and 4 test profiles PASS or explicit failure ledger; keyboard/ARIA and dark-mode contrast. Compare actual screenshots against the original reference before claiming visual acceptance. The current PR stays DRAFT until all gates verified. The global 196-file design migration is not complete.

---

# CURRENT_TASK — 2026-11-23: CENTRAL CONFIGURABLE DESIGN SYSTEM CORE (DS0–DS1 + Pipeline drawer pilot)

**Explicit owner authorization:** 2026-11-23 direction to prioritize a single globally configurable Design System (colors, fonts, title sizes, radii, shadows, gradient roles and geometry), followed by “prossiga”. This task supersedes local module-by-module visual retouching as the immediate priority. It does NOT authorize Supabase migrations, production deployment or human merge.

**Repository baseline:** main at a9097aac7c53548f6f0983265c24a90c513b8746. Existing PR #220 is an independent G1 UX DRAFT; do not change its branch or merge it. Open one substantial separate PR for this central core against main, then reconcile #220 later.

**Allowed in this scope:** src/design-system/**; src/app/globals.css; src/app/layout.tsx ONLY to resolve the centrally loaded font; src/components/ui/** for shared UI primitives; src/components/layout/PageHeader.tsx; src/components/pipeline/ViewDealModal.tsx as an end-to-end reference migration; relevant tests under test/**, scripts/**, package.json, .github/workflows/crm-validation.yml to enforce hardcode policy; docs/ux/** and root AGENTS.md/MEMORY.md/docs/codex/CURRENT_TASK.md. Keep untouched all business/server/API actions, RBAC, RLS, migrations, integration and production environment.

**Deliverables:** one authoritative CSS token source with light/dark, semantic aliases and Tailwind 4 mapping; shared typography and base components; no locally defined gradients in the Pipeline drawer; versioned migration plan and per-file debt inventory; a CI guard preventing growth in local hardcoded colors/type/radius/shadows/gradients. Existing nonmigrated visual debt remains explicitly PENDING: run 45239400879 measured 196 affected UI files and 5,536 matching style occurrences. Do not claim global UX acceptance.

**Required validation:** TypeScript, unit tests, build, design-token guard and real synthetic accessibility/browser QA on the same candidate SHA through existing workflows. No false PASS for runtime admin configurator, WCAG across unconverted modules, or production deployment. The PR remains DRAFT while checks and visual gates are pending. A human approves merge into main.

---

# CURRENT_TASK — 2026-11-19: RESTORE UX SOURCE OF TRUTH (documentation and skills ONLY)

**Authorization:** the owner explicitly requested permanent preservation of every UI/UX obligation, AGENTS.md and MEMORY.md instructions, the Clinia visual references, and the UI/UX skill, BEFORE restarting the redesign. This source-of-truth stage is not an authorization to change application screens, database, environments, or production.

**Background:** PRs #215–#218 are merged in main (baseline c04754c9fc9a2800f8cfb34a8db75ac92dd7ec78). B4 authenticated QA #87 passed technically. After reviewing the production interface, the owner explicitly rejected the visual result: modules, navigation, visual patterns and fidelity to the provided Clinia reference remain inconsistent. The claim "UX/UI modernization complete" is withdrawn; technical QA PASS does not equal UX acceptance.

**Permitted for THIS stage:** AGENTS.md, MEMORY.md, this CURRENT_TASK.md, docs/ux/**, a clear notice in docs/ui/B4_INTEGRATED_QA.md, and .agents/skills/** needed for reusable UX review. Record visual requirements, inventories, execution plan, acceptance gates and provenance. Publish one cohesive branch/PR; keep merge exclusively human.

**Prohibited for THIS stage:** changing UI components, app layouts, product flows, customer data, migrations, RLS/auth, environment variables, production, integrations, paid calls, Factory or unrelated repos. Do not copy user-supplied Clinia screenshots into this public repository. Original references remain in private ChatGPT Library.

**Required durable outcome:** root governance points to one authoritative visual contract and reference manifest; a persistent memory of state and failure mode; reusable local agent skill; phased implementation with evidence-based acceptance and honest status. The active task must be replaced with a scoped redesign execution authorization before application refactoring begins.


## NEXT TASK — automatically authorized AFTER human merge of PR #219

The owner has already requested that the agent perform the entire UI/UX redesign, not hand back a plan or request repeated "prossiga" approvals. The present task authorizes source-of-truth preservation on PR #219 only. Once PR #219 is merged by a human and its instructions exist on main, this CONDITIONAL task becomes active without requiring a new human prompt.

**Goal:** finish G0–G5 described in docs/ux/UX_RECOVERY_PLAN.md for the ORIGINAL Infodive CRM: compare the saved Clinia screenshots, close the navigation/IA gaps, consolidate shell, commercial workspaces, operational workspaces, analytics/admin and certify actual visual and functional QA. The screenshots define observed interaction patterns, not clinical business features. Use both .agents/skills/crm-clinia-ux and .agents/skills/ui-ux-pro-max. The executable scripts and full data tables of UI/UX Pro Max are included.

**Allowed application code after activation:** scoped UI presentation files in src/app/(dashboard)/**, src/components/**, src/app/globals.css, relevant UI tests under test/**, authenticated E2E automation/workflows where necessary, and docs/ux/** to record evidence. Keep each PR a substantial end-to-end route-family block with real before/after QA; never open cosmetic PRs just to advance a counter. Preserve login, public proposal and PDF layouts unless specifically needed and reviewed.

**Hard boundaries:** no direct changes to Supabase/migrations/RLS, server actions, API logic, authorization, customer data, currencies, exchange rates, existing CRM product workflows, external integration, secrets, Factory or production. No blind npm install, paid cloud action or preview outside approved quota. If product-wide consistency requires changing business logic, stop ONLY that affected subtask and document a real separate authorization gate; continue safe UI work autonomously.

**Required acceptance before asking a human to merge:** complete route-family functional regression; real authenticated synthetic QA on same commit SHA; comparative visual inspection against original Clinia references, desktop/mobile/light/dark, accessible keyboard and WCAG AA; no P0/P1 discrepancy; documented source-current-target differences. Do not declare release accepted on CI green alone.

**Human gate:** merging each substantial PR into main remains exclusively human. No auto-merge, forced history, production deployment/migration or destructive database change. The agent must keep working autonomously until a real external gate, not stop after each small edit.

---

# CURRENT_TASK — CRM #214 B4: QA integrado e preparação segura da liberação visual

**Autorização:** programa de modernização visual do CRM Infodive acordado pelo proprietário em 17/11/2026 e rastreado em [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). B4 é o fechamento de QA da modernização, **não** uma alteração de negócio nem uma autorização de release. Branch exclusiva `ux-ui/crm214-b4-integrated-qa`, criada no commit B3 revisado e com CI verde `4158fd3be3190464359eae5c9ac02f491fa9dc4d`. PRs cumulativas #215 (B0+B1), #216 (B2), #217 (B3) ainda dependentes de merge humano na ordem correta. PR #213 da Factory é outra trilha e continua intocada.

## Resultado obrigatório

Preparar evidência de que a **interface real do CRM**, e não apenas o harness isolado, funciona e é visualmente consistente nas rotas e operações críticas. Implementar os instrumentos de QA seguros e corrigir regressões exclusivamente de UI dentro deste bloco; **não falsificar prova de autenticação nem substituir Preview por screenshots fictícios**. Se faltarem ambiente de teste, sessão de teste ou autorização de Preview, concluir tudo que for possível sem acesso e registrar exatamente o gate humano, sem inventar PASS.

## Execução B4 em bloco completo

1. **Inventário de smoke E2E**: mapear todas as rotas existentes sob `src/app/(dashboard)/**`, definir casos de navegação/autorização, estados loading/empty/erro, modais, filtros, leitura de tabelas, views, keyboard, mobile/desktop, claro/escuro, e progredir até cobertura dos módulos. Priorizar Dashboard, Pipeline/Kanban e drawer de oportunidade, Leads/Contatos/Empresas, Atividades, Contratos/Propostas, Produtos, Vendas, Relatórios, Metas/Comissões, Automação, Inbox, Service Desk/KB, Settings e Integrações.
2. **Ambiente segregado:** verificar existência de Preview Vercel do **SHA exato** e de contas/tenant de teste com dados fictícios. Se ausentes, não usar ambientes, segredos nem credenciais de produção. Não desativar autenticação/middleware, não copiar `.env`, não criar sessões artificiais como se fossem reais. Configurar a suíte para aceitar URL de teste e sessão legítima fornecidas por meio seguro (CI environment secrets), sem exibir valores e sem publicar traces com dados pessoais.
3. **Automação de validação:** criar testes Playwright E2E operando com rotas Next reais e login de teste autorizado; cenários read-only por padrão; para testar escrita de negócio, **somente** ambiente isolado com tenant/credenciais de teste e autorização específica. Verificar gates de permissão com perfis já existentes, sem alterar policies ou permissões.
4. **Qualidade visual:** screenshots por viewport desktop 1440x960 e mobile 390x844, light/dark, regressões de layout, overflow, contraste/axe A/AA, sem `incomplete` tratado como PASS, navegação por teclado (incl. drag/drop), foco, estado vazio/loading/erro, navegação entre módulos. Persistir evidência sanitizada e vinculada ao **mesmo SHA e Preview deployment ID** quando houver Preview autorizado. Não armazenar dados reais em artefatos.
5. **QA técnico:** `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `git diff --check`; analisar conflitos de mudanças cumulativas e compatibilidade com a PR #213 sem alterar sua trilha. Corrigir problemas reais de apresentação; não se limitar a relatório.
6. **Gate de release:** somente após evidência real e QA, recomendar o merge humano **#215 → #216 → #217** nessa ordem, com reconciliação de diff e CI do SHA integrado em cada etapa. Preferir preservar a linhagem Git dos commits originais ou documentar explicitamente como lidar com squash; nunca auto-merge, nunca alterar a `main` pelo Codex. B4 só deve ser declarado concluído para release quando as rotas reais e os perfis exigidos foram validados.
7. **Handoff de produto reutilizável:** produzir apenas checklist técnico para futura cópia limpa, sem criar repositório novo, sem publicar produto clínico/WhatsApp e sem replicar dados, credenciais ou configurações internas.

## Arquivos permitidos e proibições

- Permitidos: testes E2E, runners/fixtures **fictícias** sob `test/**` ou `tests/**`, configurações de ferramentas de teste sem segredos, relatórios/evidências sanitizadas `docs/ui/**`, correções comprovadamente necessárias em arquivos de apresentação `src/app/(dashboard)/**`, `src/components/**` e tokens `src/app/globals.css` com testes.
- Não alterar negócios em `src/services/**`, `src/types/**`, `src/app/api/**`, server actions, auth/RBAC, Supabase/SQL/RLS/migrations, dados, fórmulas/moedas, integrações financeiras, Factory, PR #213, variáveis de ambiente produtivas ou segredos. Nenhum deploy de produção nem chamada paga.
- Sem Preview/deploy remoto automaticamente; verificar custos/cota e autorização de alvo/teste antes de eventual Preview. Se o Preview de B4 depender de liberação externa, registrar dependência claramente.
- **Não criar PR somente para documentação ou evidência parcial.** Criar PR B4 **draft** somente se a entrega incluir testes E2E reutilizáveis e/ou correções efetivas, com dependência declarada #215/#216/#217; caso contrário, consolidar checklist/evidência no trabalho local/issue e informar gate necessário.
- Sem reabrir B0/B1/B2/B3 para pequenas PRs cosméticas. Ações autorizadas precisam servir diretamente à validação/funcionalidade da interface.

## Critérios de aceite de B4

- Suíte E2E real, sem bypass de auth, por módulos e perfis relevantes, com resultados vinculados ao SHA/Preview (ou bloqueio externo explícito).
- Visual desktop/mobile light/dark e axe, regressões funcionais sem vazamento de dados ou alteração de regras de negócio.
- CI verde no SHA final, e evidência auditável, com aprovação humana antes de qualquer release.
- Nenhum merge em `main`, deploy produtivo, migração, integração externa ou cópia para o CRM genérico feitos pelo Codex.

---

# CURRENT_TASK — CRM #214 B3: padronização visual de todos os módulos restantes

**Escopo e autorização:** programa de modernização integral de UX/UI do CRM Infodive acordado pelo proprietário em 17/11/2026 e documentado na [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). Esta autorização técnica B3 vale **exclusivamente** para a branch `ux-ui/crm214-b3-complete-modules`, criada no SHA `4608ad949b0d6053a796d5d163682620d5b96e4a` da PR #216 (B2). Depende de #215 (B0+B1) e #216 (B2), que ainda NÃO foram mergeadas. Não revoga nem mexe na PR #213 da Factory. Merge exclusivamente humano.

## Missão B3 — bloco inteiro, não só diagnóstico

Completar a **padronização UX/UI no CRM Infodive original** em todos os módulos/rotas do dashboard que ainda não foram migrados em B2, preservando funcionamento e identidade Infodive. Priorizar:
- **Comercial e receita:** `/activities`, `/contracts`, `/proposals`, `/sales`, `/sales-orders`, `/products`, `/price-lists`, `/purchases`, inclusive listas, detalhes, wizards e modais; qualquer editor/visualização de proposta requer conservar layout de documento/exportação.
- **Operação:** `/inbox`, `/automations`, `/service-desk`, `/service-desk/knowledge`.
- **Análises e gestão:** `/reports`, `/goals`, `/goals-commissions`, `/gamification`, `/integrations`, `/settings` e suas subrotas.
- **Rotas adicionais do dashboard:** inventariar todas as rotas realmente presentes na árvore e incluir as que faltarem (exceto as rotas públicas de login, assinatura ou portal, cuja revisão exige decisão separada).

1. Inventariar por rota os componentes, estados default/loading/empty/error, filtros, modais, responsividade e temas; registrar matriz de cobertura e riscos em `docs/ui/B3_*.md`.
2. Reutilizar tokens e primitivas B1+B2 (`PageHeader`, `Button`, `Input`, `Card`, `Table`, `FilterBar`, `PremiumEmptyState`, `ViewToggle` etc). Eliminar divergências visuais reais sem reescrever lógica, telas ou funcionalidades.
3. Garantir que controles interativos tenham semântica de teclado apropriada, estados de foco, nomenclatura, responsividade e mensagens; não transformar elementos de leitura em botões desabilitados. Respeitar o drag/drop e controles existentes.
4. Testar com fixtures inteiramente fictícias as variações de componentes e workspaces remanescentes; adicionar testes de regressão significativos e evidências visuais via harness isolado, com desktop/mobile e claro/escuro; verificar axe WCAG A/AA. Nunca alegar que isso equivale a E2E real.
5. Executar `npm ci` em worktree limpo quando necessário, `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` e `git diff --check`. Corrigir regressões B3; se falha externa ocorrer, documentar causa e baseline com evidência.
6. Abrir **uma PR coesa**, em **draft**, apontando para `main` para habilitar CI e declarando: **"DEPENDE DAS PRs #215 E #216. NÃO MERGEAR ANTES DE AMBAS."** O diff será cumulativo até os merges humanos. Reconciliar diff e CI após ambos sem force-push não autorizado.

## Arquivos e limites

- Permitidas alterações exclusivamente de apresentação e composição visual nas rotas remanescentes em `src/app/(dashboard)/**` e componentes de UI associados em `src/components/**`. Preservar `src/components/goals/**` e outros módulos nos quais a apresentação esteja misturada com regra de cálculo, alterando somente classes/elementos visuais sem tocar nas funções de cálculo.
- Não alterar páginas já tratadas no B2 salvo correção necessária em componente compartilhado, com teste e justificativa.
- Proibidas mudanças em `src/services/**`, `src/types/**`, `src/lib/**` de auth/segurança, `src/app/api/**`, server actions, autorização/RBAC, models, contratos de API, lógica de negócio, preço e moeda, faturamento, proposta persistida, contratos, integrações, envio de e-mail e pagamentos.
- Proibidas alterações de banco, Supabase, SQL, RLS, migrations, credenciais, variáveis de ambiente, produção, deploy, Factory, PR #213 e `main`. Nenhuma operação paga.
- Não reproduzir identidade visual da Clinia: apenas aplicar padrões genéricos de organização e usabilidade à identidade própria Infodive.
- Não alterar AGENTS.md sem necessidade de governança geral. Não criar dados hardcoded de usuário/cliente, números de desempenho falsos ou atalhos para passar em testes.
- Se uma mudança essencial exigir regra de negócio ou acesso a ambiente real, documentar o bloqueio concreto, manter a superfície segura e seguir os demais módulos.

## Aceite e handoff

- Matriz integral de módulos/telas do dashboard, cobrindo todos os módulos ainda não padronizados.
- Alterações B3 concentradas em UX/UI e em componentes reutilizados; nenhum serviço/segredo alterado.
- Navegação por teclado, responsividade, light/dark, estados loading/empty/error e acessibilidade avaliados com evidências honestas.
- TypeScript, lint, testes, build e CI no SHA final quando disponíveis; PR única abrangente e documentada.
- Sem merge automático. **B4 (QA integrado, Preview autenticado, release e baseline para cópia futura) é bloco independente e obrigatório** antes de declarar CRM totalmente modernizado.
- Não interromper após apenas inventário ou relatório; implementar o bloco B3 completo até dependência externa real.

---

# CURRENT_TASK — CRM #214 B2: modernização das telas comerciais prioritárias

**Escopo específico:** segundo bloco do programa de interface do CRM Infodive aprovado pelo proprietário em 17/11/2026 e documentado na [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). A fundação B0+B1 está na [PR #215](https://github.com/leandrosilveiradepaula/crm-infodive/pull/215), ainda não mergeada. Esta tarefa de implementação B2 é **separada** de B0+B1, começa no commit `76b79ee0ff120e5744e918de71438c4619fb274c` e só vale para a branch `ux-ui/crm214-b2-core-workspaces`. Não revoga a tarefa #209/PR #213, não altera a Factory e não autoriza release nem merge.

## Missão B2 — executar integralmente em um bloco

Modernizar com identidade visual Infodive consistente e componentes B1, **sem copiar assets/marca/código da Clinia**, o conjunto das telas:
1. Dashboard: cabeçalho, resumo, KPIs, gráficos, filtros e estados.
2. Pipeline/Kanban: cabeçalho, filtros, colunas, cards, drag/drop existente, estados e painel/drawer contextual de oportunidade **somente usando dados, callbacks e operações de negócio já existentes**.
3. Leads, Contatos e Clientes/Empresas: listas, cabeçalhos, filtros, tabelas, formulários, ações, modais e estados de carregamento, vazio e erro.
4. Telas desktop/mobile, claro/escuro e navegação por teclado, preservando acesso por perfil e sem exibir informações a usuários não autorizados.

Fazer primeiro um inventário de cada rota e contrato atual; reutilizar `Card`, `Button`, `Table`, `Input`, `PageHeader`, tokens semânticos, shell e estilos B1. Novos componentes só quando houver justificativa de reúso. Dar atenção à densidade informacional e alinhamento do Kanban; não alterar regras ou integrações para tornar o visual mais interessante.

## Arquivos e trabalho permitidos

- `src/app/(dashboard)/dashboard/**`, `src/app/(dashboard)/pipeline/**` **exceto** `pipeline/proposals/editor/**`, `src/app/(dashboard)/leads/**`, `src/app/(dashboard)/contacts/**`, `src/app/(dashboard)/customers/**`: **somente UI**; não modificar server actions, route handlers, nem o código que consulta/escreve banco.
- Componentes de apresentação estritamente usados por essas telas, por exemplo `src/components/dashboard/**`, `src/components/pipeline/**`, `src/components/leads/**`, `src/components/contacts/**`, `src/components/customers/**`. Não refatorar serviços, permissões ou cálculos escondidos nesses componentes.
- Componentes compartilhados `src/components/ui/**` e estilos `src/app/globals.css` só para corrigir problemas reais de contrato B1, com testes de regressão e justificativa.
- Testes de componentes/UI e fixtures exclusivamente fictícias; harness `test/visual/**`; relatórios e evidências em `docs/ui/**`; este `CURRENT_TASK.md` apenas no escopo B2.
- Se um arquivo misturar UI com regra de negócio, isolar a mudança aos elementos visuais sem alterar fluxo ou semântica de dados. Se for impossível, registrar impedimento específico e não improvisar.

## Proibições

- Não tocar `src/services/**`, modelos de domínio, negócio/precificação, taxas, propostas, contratos, autenticação/RBAC, Supabase, RLS, SQL/migrations, API, dependências pagas, .env/segredos, deploy ou produção.
- Não fazer alterações na PR #215 nem na PR #213, nem mudar `main`. Nenhum merge, nenhuma migração, nenhum acesso a dados reais.
- Não introduzir hardcode específico da Winnicott; o CRM Infodive original continua como alvo e futura base reutilizável.
- B3 (demais módulos) e B4 (release e QA transversal) continuam fora deste escopo. Não atribuir a B2 uma validação E2E autenticada que não foi executada.

## Aceite e entrega

- B2 de ponta a ponta nas cinco áreas, cobrindo todos os estados relevantes e mantendo operações originais.
- Testes específicos de regressão visual/teclado/responsividade e `axe` contra componentes, dados fictícios e também páginas reais se houver ambiente de teste autorizado; evidência honesta de limites.
- TypeScript, lint, Vitest, build, diff check. Resolver falhas antes de propor merge; indicar se algum comando não puder ser executado.
- Criar **uma PR coesa e significativa** após concluir todo B2, da branch B2 para `main`, com aviso explícito **"DEPENDE DA PR #215 — NÃO MERGEAR ANTES DA #215"**, para CI da PR rodar. Depois do merge humano da #215, verificar que o diff da PR B2 contém somente B2 e reexecutar gates no SHA exato. Nunca auto-merge.
- O Codex deve continuar executando até conclusão do bloco B2 ou até dependência externa real, sem encerrar em planejamento/relatório parcial.

---

# CURRENT_TASK — CRM #214: modernização e padronização UX/UI, B0+B1

**Autorização do proprietário (conversa de 17/11/2026):** realizar a modernização da interface do CRM Infodive original, começando pela auditoria (B0) e pela fundação do design system e da navegação (B1). Referência de escopo e aceite: [issue #214](https://github.com/leandrosilveiradepaula/crm-infodive/issues/214). Esta autorização é exclusiva da branch `ux-ui/crm214-foundation`, criada da `main` SHA `b1935c8f6e61ae246eb8958673b2a9e18c3da81f`. **Não altera, revoga, encerra nem reivindica conclusão** da jornada de contratos #209 e PR draft #213. Não autoriza ações na Factory.

## Objetivo técnico autorizado para Codex

Entregar **B0 + B1 juntos em uma PR coesa**, não uma sequência de PRs cosméticas:
1. Inventariar cada rota/tela, variantes de estados e padrões de UI existentes. Encontrar duplicações e divergências objetivas de estilos e componentes. Criar relatório conciso e verificável em `docs/ui/`.
2. Projetar design system original da Infodive, inspirado em princípios de usabilidade das referências da Clinia **sem reproduzir marca, código, materiais ou visual idêntico**. Definir tokens semânticos para cores, contraste, tipo, escala, espaçamento, bordas, sombras, densidade e estados claro/escuro, com documentação.
3. Consolidar primitivas de UI compartilhadas e layout global: `src/app/globals.css`, `src/components/ui/**`, `src/components/ui/theme/**`, `src/components/layout/**`, `src/app/(dashboard)/layout.tsx`, respeitando os contratos públicos de componentes existentes. Alterar chamadores em `src/app/(dashboard)/**` e `src/components/**` **somente quando estritamente necessário para migrar a fundação compartilhada sem quebrar telas**.
4. Adicionar testes focados de componentes/contratos/consistência, checagens automáticas de tokens e padrões que evitem reintrodução de estilos divergentes, e um catálogo visual privado ou não publicado para validar os componentes sem acessar dados produtivos.
5. Executar `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`; verificar rotas, breakpoints, formulários, foco, contraste e light/dark quando ambiente disponível. Se teste/browser ou Preview autenticado não estiverem acessíveis, **registrar o bloqueio**, sem afirmar que foram validados.
6. Só ao concluir B0+B1, criar PR abrangente contra `main`, com diff e relatório; **não mergear**. Reconciliar alterações concorrentes de `main` e da PR #213 conforme necessário, **sem alterar a PR #213 ou misturar a correção de contratos**.

## Limites

- Proibido alterar `src/services/**`, modelos de negócio, cálculos, pagamentos, taxas de câmbio, contratos, autenticação/autorização, políticas RLS, dados ou schema SQL/Supabase; exceção somente após nova autorização explícita.
- Sem alteração de variáveis/segredos, chamadas a serviços pagos, aplicação de migrations, deploy produtivo, merge ou exclusão de ambientes.
- Não substituir arquitetura de dados nem reescrever regras de negócio com pretexto visual.
- Não promover telas da Clinia como cópias; usar apenas referências de UX fornecidas pelo proprietário.
- Não afirmar que o CRM foi testado em navegador apenas com leitura estática de código.
- Se a colisão com `CURRENT_TASK` ou PR #213 impedir o trabalho com segurança, registrar impedimento específico em vez de improvisar.
- Merges em `main` são exclusivamente humanos.

## Entrega e aceite do bloco B0+B1

- Inventário rastreável das telas e inconsistências e contrato de design system.
- Shell e componentes centrais unificados; temas claro/escuro e estados consistentes.
- Testes de regressão e checks de lint/build aprovados no SHA final; checagem de acessibilidade sem falsos positivos.
- PR coesa para revisão humana, indicando riscos/limitações e evidência visual real se disponível.
- **B2 (Dashboard, Kanban e leads/contatos/clientes), B3 (demais módulos) e B4 (QA final/release) ficam planejados na issue #214 e NÃO estão autorizados a serem implementados como parte desta primeira entrega sem novo escopo.**

---

# CURRENT_TASK — CRM #209: escopo vigente para a nova Jornada V2

**Autorização específica do OWNER, em 01/11/2026:** [CRM issue #209](https://github.com/leandrosilveiradepaula/crm-infodive/issues/209), [Factory issue operacional #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055). Esta seção é a autoridade **somente** para uma nova Jornada V2 legítima de CRM #209 admitida depois da incorporação humana deste arquivo na `main`, com `source_commit` imutável que contenha esta seção. Não retroage para journeys anteriores, não reabre Change Sets bloqueados e não atribui código humano à Factory.

## Objetivo e decisão de escopo

Resolver a falha **atual e reproduzível** da `main`: `ContractService.getContracts(organizationId)` usa `createAdminClient()` e somente `organization_id` para listar contratos. `service_role` contorna RLS; um vendedor não pode receber contratos fora de sua titularidade. O antigo filtro gigante `.in('deal_id', visibleIds)` da issue #171 **não existe** no source atual: é proibido implementá-lo ou alegar que foi corrigido nesta jornada. Inspecionar código, chamadas e relacionamentos exatos antes de alterar.

### Arquivos autorizados

- `src/services/ContractService.ts` — leitura paginada, filtros de tenant/proprietário e falha explícita.
- `src/app/(dashboard)/contracts/actions.ts` — sessão, perfil ativo, autoridade server-side e tratamento de erros.
- `src/types/contract.ts` — somente se estritamente necessário para tipos existentes, sem nova semântica.
- `test/*contract*.test.ts` ou `tests/*contract*.test.ts` — testes negativos e positivos focados, sem chamadas de rede.
- `docs/CRM209_CONTRACT_ACCESS.md` — decisão de arquitetura, riscos e evidências da tarefa.
- `docs/codex/CURRENT_TASK.md` — apenas atualização documental desta autorização, se necessária.

Não ampliar arquivos, dependências ou API sem demonstrar necessidade e autorização adicional. Inspecionar `profiles`, `deals`, `contracts`, contratos sem negócio e chamadores existentes. Os papéis existentes são a única autoridade; não aceitar tenant, perfil ou proprietário de argumentos do navegador. Não modificar sem decisão humana explícita a visibilidade de contratos legados sem `deal_id`, transferência concorrente de proprietário ou a matriz de papéis.

### Aceite e limites

- Isolamento por organização e proprietário com filtros aplicados no servidor, sem lista `IN` não limitada, sem leitura parcial silenciosa; paginação total estável por `created_at` e ID único.
- Testes de dois tenants, vendedor/admin/diretoria conforme permissões realmente existentes, mais de 1.000 vínculos, duplicatas, páginas subsequentes, falha no meio da paginação e denegação segura.
- Execução na própria branch exclusiva `factory/journey-<UUID>` da nova Journey V2, vinculada ao novo `source_commit` que contenha esta autorização; nunca reaproveitar PR humano #207, PR histórico #172, SHA de outra jornada ou branches já compartilhadas como produto autônomo.
- Autoriza commits de código somente dentro deste escopo, testes e abertura de PR **não draft quando todos os gates estarem completos**; a `main` publica produção e exige merge humano. Sem auto-merge nem migração, RLS, credenciais, novos serviços pagos, alterações de produção ou dados. Preview real e CI exata conforme política.
- Não usar modelos pagos só para testar, não comprar créditos e não executar o benchmark financeiro SQL. Falhas de prova permanecem bloqueio, sem inventar evidências.

**Este arquivo de governança atualizado é um pré-requisito de source, não uma entrega autônoma.** A Factory só poderá reivindicar autonomia com run/commit/CI/Preview independentes, posteriores ao novo Start válido.

---

# CURRENT_TASK — CRM #171: contratos escaláveis (Factory journey V2)

**Autorização específica para a branch de implementação da issue #171**, vinculada à jornada V2 da AI Product Factory. Este bloco não autoriza alterações no escopo de outras issues, não substitui as regras permanentes de `AGENTS.md` e não concede permissão para produção.

## Escopo e objetivo

Corrigir `ContractService.getContracts` para não enviar todos os IDs de negócios visíveis em um único filtro PostgREST `.in('deal_id', visibleIds)`. Preservar organização, proprietário, RLS, autorização server-side, paginação global e ordenação estável. Cobrir mais de 1.000 vínculos, IDs duplicados, falhas parciais e limites; sem truncar resultados.

## Arquivos permitidos exclusivamente para a issue #171

- `src/services/ContractService.ts`;
- `src/services/ContractService.test.ts` (se necessário, criar);
- testes diretamente relacionados em `test/**` ou `tests/**` (somente contratos e regressão de escopo);
- documentação específica da issue #171, se necessária.

**Proibido:** alterar papéis, políticas RLS, migrations, permissões, credenciais, produção, módulos RBAC #22 ou Service Desk #200; ampliar escopo sem decisão humana. Não utilizar modelos pagos para sondagem. Não criar bypass de autorização.

## Entrega

Uma PR contra `main` para revisão e merge exclusivamente humanos. CI e testes no SHA exato; Preview somente conforme a política real do projeto. A autorização desta seção só vale para a execução da issue #171; não é uma autorização genérica para modificar `ContractService` em outras jornadas.

---

# CURRENT_TASK — CRM #200: Service Desk como módulo do CRM (27/10/2026)

**Decisão atual do operador substitui a tarefa anterior para esta branch.**
A issue CRM #200 e Service Desk #12 autorizam preparar a integração
aditiva do módulo Service Desk ao CRM, sem modificar produção. A tarefa
anterior de RBAC #22 continua válida em seu escopo já entregue e não deve
ser revertida ou duplicada.

## Escopo autorizado para esta branch

- `supabase/migrations/20261027123000_service_desk_crm_module.sql` (arquivo,
  **não aplicar ao Supabase gerenciado**).
- `src/app/(dashboard)/service-desk/**` (página incorporada e ações).
- `src/components/layout/Sidebar.tsx` (somente entrada do módulo).
- `test/service-desk-crm-module.test.ts` (negação de acesso e contexto).
- `scripts/verify_crm_service_desk_pg.py` e `.github/workflows/crm-service-desk-postgres.yml` (PG16 isolado).
- `docs/SERVICE_DESK_CRM_INTEGRATION.md` (contratos/rollback).
- Este arquivo de tarefa.

**Proibido**: promover migration CRM, enviar service_role ao navegador,
copiar tenants demo, criar novo Supabase, cortar Vercel, auto-merge, usar
WIF/modelos pagos ou reativar a PR Service Desk #10 sem recibo válido.
Produção e migration requerem gates humanos separados.

## Critérios para PR

- Reusar `profiles`, `accounts`, `service_contracts`, CRM Auth e
  `crm_internal.current_organization_id()`, sem duplicar esses cadastros.
- Testar autoridade server-side e isolamento no banco; CI real do HEAD,
  TypeScript, Vitest, build e Preview obrigatório por UI.
- PR contra `main` para revisão humana. Nada se considera integrado ou
  certificado até migration aprovada, Preview real e E2E completo.

---

# CURRENT_TASK — CRM P0: RBAC real no servidor (issue #22)

**Decisão atual, 26/10/2026:** PR #198 foi mergeada humanamente na `main=adaea55f88eaa80d12a8b19596189398a3364837`; migration `crm_authoritative_tenant_rls` já aplicada e auditada no Supabase CRM. O proprietário pediu concluir o parêntese de segurança do CRM para então retornar à certificação da AI Product Factory. Esta tarefa atende **somente** o bloqueio P0 de RBAC em Server Actions e APIs, vinculado à [issue #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).

## Objetivo e critérios de aceite

1. Fonte única de papéis/permissões para UI e servidor, mantendo o comportamento visual existente. Os papéis persistidos em `public.profiles.role` são a autoridade; não aceitar role, organização, claims `user_metadata` ou cabeçalho enviado pelo cliente.
2. Verificar sessão, status `active`, tenant no banco e permissão imediatamente antes do uso de `service_role` para mudar usuários/papéis/status, transferir deals, convidar usuários, configurar organização/pipeline, gerenciar integrações, API keys e webhooks. Negar por padrão papel desconhecido, perfil revogado, tenant divergente e erros do banco.
3. Tratar entradas duplicadas (por exemplo, `settings/actions.ts` e `settings/users-actions.ts`, `integrations/actions.ts` e as ações dedicadas de API keys/webhooks). Testar chamadas **diretas** às Server Actions, sem depender do PermissionGate da UI.
4. Prevenir falsificação de trilha de auditoria por Server Action genérica; eventos administrativos devem ter ator e tenant derivados do servidor, com dados não sensíveis. Se não houver garantia transacional entre audit log e mudança de dados, declarar explicitamente a limitação — não declarar auditoria integral concluída.
5. `/api/auth/me` deve negar sessão revogada/sem organização de modo consistente com `requireSessionContext`. Não retornar `isLoggedIn=true` a quem não possui perfil autorizado.
6. Vitest negativos, TypeScript, build e checks no SHA exato; entregar **uma PR** pronta para merge humano, sem auto-merge.

## Escopo autorizado para a branch/PR atual

- `docs/codex/CURRENT_TASK.md` e documentação de segurança deste escopo;
- `src/lib/permission-matrix.ts`, `src/lib/server-authorization.ts`, `src/lib/admin-audit.ts`;
- `src/types/auth.ts`, `src/hooks/usePermissions.ts`;
- `src/app/(dashboard)/settings/{actions,users-actions,audit-actions}.ts`;
- `src/app/(dashboard)/integrations/{actions,apikey-actions,webhook-actions}.ts`;
- `src/app/api/auth/me/route.ts`;
- `src/app/(dashboard)/settings/price-lists-actions.ts`;
- `src/services/{UserService,SettingsService}.ts` (tenant validation before service-role updates);
- testes Vitest sob `test/*-rbac*.test.ts` ou extensões focadas dos testes de auth;
- qualquer outra ação administrativa somente se a prova descobrir bypass direto, registrando sua relevância ao gate #22.

**Fora do escopo:** mais migrações, backfill de tenant, schema de Salesforce/Service Desk, alterações de quotas, mudanças de preços, n8n, modelos pagos, GitHub da Factory e PR #56 de release separado. Não repetir as 17 migrations históricas.

## Gates

CRM `main` publica produção e **somente humano pode fazer merge**. Não alterar Supabase, RLS, grants, Auth, usuários, chaves ou Vercel diretamente. Testes usam mocks/sintéticos. No post-merge da PR #198, verificação Vercel READY / navegador de login real ainda é necessária antes de certificar operação. A emissão de CI verde não é autorização de produção.

Após resolver este P0 e registrar evidências, retornar a `ai-product-factory/docs/FINALIZATION_EXECUTION_CONTRACT.md`.

---

## Tarefa autorizada — CRM issue #22 (29/10/2026; continuação OWNER)

**Esta seção é a autorização ativa somente para a branch
`preview/crm22-rbac-security-evidence` e a PR #202.** O Start real do OWNER
na [issue operacional da Factory #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055),
comentário 6487569648, e o gate humano de escopo aprovado autorizam
concluir a [issue CRM #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).
O escopo Service Desk CRM #200 acima continua histórico e válido para
sua própria linhagem; **não** integra este candidato #22.

A lacuna concreta identificada era consulta global com `service_role`
em `src/app/api/email/sync/route.ts` aos remetentes existentes e às
blacklists, sem filtro por organização. A PR #202 modifica somente os
caminhos necessários ao isolamento da consulta, com denegação em caso de
erro de banco, testes negativos e documentação de escopo:

- `src/app/api/email/sync/route.ts` — chamada do helper com tenant
  proveniente de `requireSessionContext`, sem alterar autenticação;
- `src/lib/email-sync-tenant.ts` — filtro por organização, incluindo
  o vínculo `account_contacts.account_id → accounts.organization_id`;
- `test/email-sync-tenant-rbac.test.ts` — testes negativos de tenant,
  falhas de leitura e respostas inválidas;
- `docs/CRM22_EMAIL_SYNC_TENANCY.md` — causa, escopo e limitações;
- `docs/codex/CURRENT_TASK.md` — reconciliação do escopo autorizado.

Os checks de permissão, auditoria e perfis já presentes na main continuam
sob o contrato RBAC #22 acima; não reimplementá-los sem falha demonstrada.
Não alterar papéis, privilégios, RLS, banco, migrations, credenciais,
integradores externos nem Service Desk. Não executar chamadas pagas de
modelo nem benchmarks. Não alegar que a PR criada por executor externo
foi produzida por Work Units da Factory: a prova ponta a ponta deve
ter sua **própria** linhagem verificável, sem backfill artificial.

**Critérios:** TypeScript, Vitest, build e CI no HEAD exato, Preview
Vercel + browser verificado no mesmo SHA e revisão de autorização;
proteger `main` com merge exclusivamente humano, após gate legítimo.
