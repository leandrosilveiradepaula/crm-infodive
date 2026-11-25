### 2026-11-25 — Owner direction: one comprehensive UI/UX block (PR #223)

Owner: focus exclusively on UI/UX, stop breaking delivery into small handoffs; execute larger coherent blocks. Current branch is `ux/commercial-directory-journeys-20261125`, previous candidate `4885389b17e069436f562298c3ebdd93b89bb4be`, main `4e4e92cfdd712ae7d8bffe0c4b68088869f98029`. Continue this single draft PR. No new business functionality, server actions, persistence, integrations, hosted database, financial calculations, production deployment or automatic merge.

**Baseline and visual comparison:** reviewed all 19 private reference screenshots via montage, and 22 admin light desktop/mobile route captures each from certified baseline artifact 15000584964. The reference emphasizes one visual grammar and compact operational workspaces. The baseline has a consistent shell but vertically stacked KPI cards on mobile, mixed navigation patterns (single-column tab menus and hidden horizontal tabs), inconsistent directory table semantics, oversized disconnected inbox and unstructured unavailable Service Desk states. Opportunity detail already has a separate inspector; preserve that structure rather than inventing functions. Real baseline only covers the disconnected inbox, unavailable Service Desk and partially populated sales/proposal states. No private reference images are published. UI/UX Pro Max research is executed by the isolated QA workflow.

**Integrated presentation changes:** shared responsive two-column mobile StatsGrid, wrap metric values rather than truncate, same component in dashboard preserving navigation and metrics (remove decorative fixed +12.5% trend without inventing another); central compact header spacing and flexible filters; shared responsive workspace tabs for Goals, Sales, Settings and Integrations, without hidden tab options; compact neutral empty states and keyboard-accessible tables. Pipeline summary, filter/board/list navigation, table and named opportunity opening; Products reuse directory count/reset/list semantics; Activities, Contracts and Reports use labeled controls and table regions; opportunity proposal list uses shared filters, empty state, compact responsive rows and explicit keyboard action. Inbox disconnected screen and Service Desk unavailable states use the same visual language and retain real limitations. Preserve existing calculations, server calls and financial actions. Do not describe untested workflows as working.

**Previous candidate evidence:** [CI 45623103691](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45623103691) succeeded. [QA 45623103708](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45623103708) failed during the first Leads research dialog: one unresolved axe color-contrast overlap finding on the notice panel, then a 30s locator timeout because the test tried to query the background opener after it became inert. Artifact 15027331400 has only partial captures. Direct inspection of the actual research screenshot confirms opaque panel but a visually redundant nested notice. Simplify the notice to plain text on opaque dialog; acquire opener label before opening, keep actual focus restoration and all axe rules. Do not certify prior incomplete matrix.

**Acceptance:** exact new SHA CI and isolated authenticated QA, prior four-profile route matrix, all newly added shared layout checks, directory filters and list states including Products, Pipeline list and actual seeded proposal tab/filters, keyboard isolation and full axe. No test submits, sends, modifies commercial records or calls AI. Review captured before/after admin light/dark desktop/mobile screens; keep issue #214 open until actual visual review and scope signoff, document unavailable/untested routes. Only human merge when the candidate is certified.

---

### 2026-11-25 — Owner clarification: UI/UX ONLY (PR #223)

The owner explicitly narrowed the current program to appearance and experience, not feature implementation. Preserve existing business behavior, API requests, persistence, permissions and financial logic. The first candidate `367cc396` remains in immutable branch history; its CSV implementation, stale-record and CRUD changes are deferred and excluded from the final diff. Do not create or certify new business functions in this workstream.

This same PR retains the three directory screens' shared responsive summary (central compact density tokens), filter layout, result count, single empty state, card/list switching, accessible scrollable table and separately labeled row actions. The existing unavailable CSV capability is labeled unavailable instead of advertising a fake export. Existing research API payload and completion callback are preserved; the dialog is visually unified, keyboard-accessible and says clearly that the returned suggestions are not verified internet research or saved data. No request is sent in QA. Do not describe the existing research or export capability as operationally certified.

Prior candidate [CI 45619683961](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45619683961) passed TypeScript but failed one stale source assertion that required destructive hover colors for a reset-filter button. Reset is non-destructive: verify the actual shared neutral control and callback, retaining the other checks. [QA 45619684151](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45619684151) was skipped because its branch whitelist did not include this branch. Authorize only the exact `ux/commercial-directory-journeys-20261125` same-repository branch in the isolated QA workflow; no broadening to forks, hosted environments or secrets.

Re-reviewed existing desktop/mobile commercial screenshots from artifact 15000584964 and the private reference montage. Keep four KPI values but compact them into two columns on phones; retain semantic labels, predictable filter order, view switches and table affordances. No changes to functional scope. Require CI and the real browser QA to succeed on the same new SHA, inspect new screenshots and document remaining UX differences before human merge. Continue with the pipeline/opportunity/proposal presentation family after this block.

---

### 2026-11-25 — Commercial directories: responsive workflow and honest actions (issue #214)

#220 was merged; main `4e4e92cfdd712ae7d8bffe0c4b68088869f98029` has exactly the tree of the certified `a194f058`. [CI 45568190685](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45568190685) 483 tests, 0 categorized style debt; [isolated QA 45568190461](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45568190461) 236 checks, four profiles, no unresolved axe findings. The prior automation scope is certified as interface only; actual execution/persistence remains a separately disclosed functional blocker.

Authorized continuation of #214: one commercial-directory family block (Leads, Contatos, Empresas), preserving all server-side contracts and business behavior. Direct comparison of the authenticated admin baseline in artifact 15000584964 with the 19 private reference montage: on mobile four vertically stacked KPI cards obscure search and first records; the directory view switches are present, but list-state QA was absent. Source review also found stale initial lead state, unsafe nullable contact email search, a placeholder Export CSV action, company row click propagation, unnamed table action buttons and an "apply" lead-research button that merely logged data without persistence. No real customer production records were used.

Candidate: opt-in shared two-column mobile StatsGrid density with central padding token and wrap, shared result count and clear-filters recovery, one empty state, actual server-provided records, labeled scrollable tables with all columns and separate company detail action; non-destructive CSV export of ONLY already authorized filtered company fields, escaped against formula injection and no nested contact/tenant IDs. Research remains on the existing API as a read-only suggestion helper; no fake persistence or web verification claims and no external AI calls in QA. Existing delete actions retained with error feedback, no modifications to server services, APIs, database, migrations, permissions or financial calculations. Preserve default card views. No production deployment.

Gate: exact same-SHA CI incl 7-category zero-debt guard, PDF regression and browser synthetic preflight; isolated authenticated QA all profiles and themes, admin directory filter/list/empty/reset and actual file download scope, research open/close and focus without sending a request, current screenshots and direct visual review. Do not claim real CRUD/lead conversion/LLM integration has been certified by read-only tests. Future separate blocks cover pipeline/opportunity and proposal lifecycle. Human merge only; Draft until gates pass.

---

### 2026-11-25 — Automation modal focus isolation repair (PR #220)

The exact SHA `27c05dd7` passed [CI 45537744226](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45537744226): 482 tests, TypeScript, build, PDF render, synthetic WCAG and zero categorized style debt. [Authenticated QA 45537744548](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45537744548) completed the whole four-profile matrix, but FAILED 16 combinations: editor steps 1–3 and execution history × desktop/mobile × light/dark. All findings were the same axe `aria-hidden-focus` incomplete on the dashboard shell (aria-hidden true, inert false); no actual axe violations were reported in those diagnostics. Other exercised interactions, including opening, recipe prefill, filter independence, step navigation, adding/removing an action, Escape and return focus, completed. The research step ran successfully. The disposable local stack was cleaned.

Direct review of the sanitized artifact [14988516215](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45537744548/artifacts/14988516215), including all 20 new automation screenshots and the private reference montage, confirmed all six model cards and consistent three-step dialog hierarchy in both themes/viewports. The history dialog touched the edges on mobile; retain a semantic panel with the same viewport margin as the editor. The visual reference includes a canvas editor, but no canvas or execution engine is invented in this UI-only scope. No real execution or persistence is claimed.

Correction: use the existing `useDialogBackgroundInert` hook, already used by CommandBar, in both automation dialogs. The editor is mounted only while open; the execution summary follows its controlled open state. Preserve existing focus restoration, keyboard behavior and capability disclosure. Strengthen the real browser test for each editor step and execution summary: assert inert shell, attempt real background focus, exercise Tab/Shift+Tab, verify no focus escape and release inert after close. Verify history dialog viewport fit. Keep every axe rule enabled and fail on incomplete findings. No shared component policy changes, server actions, engine, hosted database, migration or production change. Exact new SHA CI, authenticated QA and screenshot review remain mandatory. Retain #220 Draft and the separately documented operational-engine blocker.

---

### 2026-11-25 — Automation integrity and capability disclosure

On `e7ec0041`, [CI 45536866831](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45536866831) passed all 480 tests / 39 suites, TypeScript, build, PDF rendering, 4/4 synthetic WCAG and the global zero-debt guard. The authenticated run 45536866870 was still in progress at the time of this review. Do not transfer those results to the next SHA.

P1 discovered by source inspection: HistorySheet manufactured four event records (email, task, SMTP error, stagnant trigger), showed 100% for no execution, and displayed a non-functional notification button. CRUD handlers also reported success when server actions returned `{success:false}`. Additionally the repository's `src/lib/automations.ts` legacy `checkAutomations` is a dummy function. The current repository does not establish operational automatic execution, and the isolated schema for automations/logs differs from some fields used by AutomationService. Do not infer working execution or production persistence from the existing read-only smoke.

Within the existing UX block, replace fabricated history with actual returned aggregate counters and an explicit unavailable-detail state, remove the nonfunctional CTA, use the existing accessible Dialog with focus restoration, make capability wording precise (configured status is not proof of execution), and guard successful mutation feedback on the explicit server result. A failed save leaves the draft open and gives an actionable error. Existing save/create/update/delete/toggle actions, tenant context, permissions and persistence code are unchanged. Retain the six recipes as initial templates, not guarantees of VIP/amount conditions. Test actual browser opening/closing of the summary, accessibility in all four combinations, and unit-level confirmed/rejected mutation outcomes. No mutation is performed in the real browser proof.

**Unresolved product blocker, outside UX scope:** independently establish the authoritative production-compatible storage contract and automation engine/execution log behavior before any claim of a fully functioning automation system. No migration, hosted database access, real execution, external messages, or deployment authorized in this UX task. Do not invent history or silently activate flows to make a test pass. Keep #220 Draft until exact candidate CI, real isolated QA, and visual review pass.

---

### 2026-11-25 — Post-merge UX reconciliation: automation workspace (PR #220)

The owner merged #221. main `cdf7a5ba05289c0fab81f85a8794e6c0fb24f07d` has exactly the tree of the certified `7305fdd` candidate. Evidence: [CI 45524688734](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45524688734), [authenticated QA 45524688814](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45524688814), 474 tests, 216 browser checks, zero in the seven original inventory categories, 171 locked modules, 132 token propagation checks and 16 PDF page renders. These are baseline results, not certification of the next revision.

Reconcile existing draft #220 with main through a two-parent non-destructive commit, using the newer certified main tree rather than copying older local Tailwind declarations. Most older #220 changes (two-level navigation, view toggle, report empty states, filters, opportunity inspector) are already present on main. Restore its missing B3 analytics/automation regression tests. The remaining carousel was directly observed in the authenticated admin light desktop/mobile screenshots from artifact 14980919488: clipped recipe options, fixed unsupported 42h savings, misleading 0% without runs, and workflow filtering coupled to the rule-based draft input. The 19 private reference images were inspected in the previous review and their montage again for this task; use their restrained hierarchy without copying visual assets or inventing a workflow engine. Local checkout is unavailable (DNS); the project UI/UX Pro Max script is wired into the isolated CI job, not claimed as completed before its output.

Candidate UX: saved workflows and actual execution counts first, a separate draft helper and independent filter/search, one full responsive library with all six existing recipes and direct entry from the page header. Remove duplicate library overlay; describe existing heuristic draft behavior accurately, not as LLM generation. Translate persisted IDs in display only. Use shared Dialog, Button, Input and Textarea in the three-step editor; label controls, retain focus, avoid mutating initial action objects before save, and preserve paused status on edit instead of silently enabling the flow. Creation still follows the original explicit activation path; no server actions, pricing, permissions, storage, or engine changed. Human merge only; no hosted database, credentials, production, or real automation execution.

Required gate: exact new SHA CI + isolated real browser (all four profiles and existing matrix; new read-only checks for independent inputs, filters, all six cards, editor prefill, all three steps, add/remove, Escape, focus and clipping), new screenshots, unchanged global zero-debt guard and independent PDF proof. Record visual differences and any failures; keep draft until verified. Do not treat this scoped reconciliation as closure of all product UX or issue #214.

---

### 2026-11-25 — DS12 final validation repair and actual proposal export evidence

Candidate `bf71c217` failed TypeScript and the isolated application build due to an empty conditional expression in TemplateCard. Replacement `152e7737` restored the existing template button, semantic pressed-state and primary foreground. [CI 45524315217](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45524315217) subsequently passed TypeScript, 474 tests (including the actual full-source zero-debt assertion), Next.js build and all four synthetic WCAG combinations. The remaining failure was strictly three trailing whitespace lines in settings and PDF custom notes, before the CLI inventory step. Remove those three reported whitespace issues. No relaxation of the guard.

The next candidate adds a real renderer-only proof using the same ProposalPdfDocument and renderToBuffer as the authenticated server export. It renders all eight sections twice from synthetic fixtures, checks actual text, BRL/USD pricing, page count, and rasterized primary/accent colors, and publishes both PDFs plus all page PNGs as sanitized evidence. It does not call the export API, allocate proposal numbers, connect to databases, or mutate tenant state. Validation checkout is explicitly pinned to PR head. This proof is a candidate until the exact new CI and authenticated QA pass; visual comparison of the generated evidence is still required. The source inventory zero applies only to the seven historical categories, not every possible visual value syntax.

---

### 2026-11-25 — DS12 full-inventory graduation candidate

The exact predecessor `60df4bbc` passed [CI 45521798757](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45521798757) (471/471 tests, TypeScript, build, synthetic WCAG, 112 locked modules, 189 changed UI files and no hardcode regressions), and [real isolated authenticated QA 45521799142](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45521799142) (4 profiles, 216 visual route checks, artifact 14981431026). Its measured inventory was 59 files / 180 categorized local decisions (179 web, 1 PDF), against the original 196 files / 5,536 decisions.

The final migration candidate reconciles all 59 identified residual source files, including shared primitives, dashboard/opportunity, public/portal/debug, operational modals and charts, settings, and proposal HTML/PDF. Each of the staged replacement sources was checked against the unchanged historical seven regex categories; the global inventory still must prove zero on the **published exact SHA**. New shared inventory traversal powers both the CI guard and the report. The global gate fails on any nonzero categorized local decision in src/app or src/components, with no exclusions; 59 additional files are locked. Central document band helper preserves its original angle and organization primary/accent arguments. Domain-specific user-editable brand, portal, and pipeline-stage default values move to named typed constants without changing persisted values. The print palette retains signature ink and PDF notes colors. Nonessential local gradients are replaced with semantic solid surfaces to avoid contrast ambiguity. This is a scoped source migration, not proof that every possible style syntax is inventoried, nor proof of visual acceptance.

**Required exact-candidate gates:** zero categorized decisions globally; TypeScript/tests/build; synthetic and isolated authenticated browser in four profiles, 22 routes and expanded interactive states across both themes/viewports; inspect real screenshots and token propagation, and independently render proposal outputs before claiming print parity. Preserve all existing functional actions, tenant permissions, calculations and signature workflows. Do not merge, deploy production, alter hosted Supabase, run migrations, change secrets or copy private reference assets. One DRAFT PR #221, human merge only. Prior PASS does not certify this new revision.

---

### 2026-11-24 — DS11 full authenticated QA failure and shared UI remediation

At exact SHA `822a8f5b`, [CI 45517092756](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45517092756) PASSED while [authenticated QA 45517092982](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45517092982) FAILED only four `/dashboard?global-search` desktop/mobile/light/dark combinations. There were zero axe violations but a single `color-contrast` incomplete per combination on the visible `↑↓` keyboard-hint element at the bottom of CommandBar. Other audited route/state combinations were clean. The candidate replaces the glyph-only hint with readable text `Setas: Navegar`, with semantic foreground, while preserving real search, focus, routing and actions. No suppression of axe.

The same cohesive DS11 source batch migrates shared Dropdown/Select geometry and typography; proposal option toggles, product investment cards and signature modal/pad to semantic roles; and the dashboard error state to matching light/dark surfaces. It retains actual signature POST, product math, financial and business behavior. The proposal checkbox and upload are keyboard focusable, with a visible focus-within ring. Newly clean component sources are added to the strict no-hardcode guard and source contract. This change is NOT certified until same-SHA CI + all-route authenticated QA and visual screenshots pass. PR #221 stays DRAFT, human merge only; no hosted database, migrations, secrets, production or real customer data.

---

### 2026-11-24 — DS10 authenticated command palette focus and mobile contrast repair

At exact SHA `d3dbe45b`, [CRM CI 45514919170](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45514919170) PASS while [full authenticated QA 45514919030](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45514919030) FAILED **four /dashboard?global-search combinations**: `aria-hidden-focus` incomplete on background shell for desktop/mobile and selected cmdk command row `color-contrast` on mobile/light and mobile/dark. Scope-limited correction on the original command surface: invoke the existing inert-and-restore dashboard hook while portal is open; remove the palette's additional slide-down animation to prevent in-between compositing; use central `accent/accent-foreground` paired palette tokens on hover/selected and explicit foreground for keyboard legends, with descendant foreground roles aligned; wait for the real Radix open transition to complete before axe audit (zero violations AND incomplete still required, not bypassed). Preserve `searchGlobal`, real links, command keyboard and opportunity move server action. No fake search, credentials, hosted DB, migrations or production. Re-certify exact SHA full browser and screenshots; keep PR #221 DRAFT until verified and human merge.

---

### 2026-11-24 — DS10 full authenticated matrix diagnostic 87904137; fix real causes

[Authenticated local QA 45513154036](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45513154036) completed 4-profile × 22-route matrix on `87904137`, **FAILED 10 combinations in 4 route/states**. Unlike the earlier hidden-dialog failure, `Command.Dialog` is now visible; however its own cmdk/Radix portal lacks a real `DialogTitle`, leaving `aria-labelledby` unresolved, and generates hidden focus-guard spans plus inaccessible background landmarks (`aria-hidden-focus`/ `bypass`, all incomplete) in desktop/mobile light/dark. Root fix replaces cmdk's embedded Radix modal with the CRM's proven `Dialog/DialogContent/DialogTitle/DialogDescription` wrapper (already used successfully by Customer/Contact/Lead dialogs and reconciles hidden focus-guards), while retaining the cmdk keyboard/search list and real searchGlobal/router actions. No axe suppressions or rules disabled.

The same SHA revealed **one real low-contrast Watson risk score badge** in desktop/mobile light (`bg-destructive/10 text-destructive`), corrected to semantic `bg-destructive-subtle text-destructive-readable`. It also flagged **mobile/light and mobile/dark opportunity ID metadata** (`ID: #...` span at x=232 y=32) overlapped by neighboring header content, causing `color-contrast` incomplete and secondary-section navigation failures; ID remains screen-reader readable but is not visually squeezed beside the company label on narrow mobile screens. These are targeted original product UX fixes, not CI hacks.

Require fresh exact-SHA TypeScript/build/unit/strict policy plus real 4-role×22-route authenticated desktop/mobile light/dark with **ZERO axe violation AND incomplete**, keyboard and modal-bound screenshots. Keep PR #221 DRAFT, preserve financial/tenant/business logic, no hosted Supabase, production, migrations, secrets or merge. Explicitly preserve the previous green CI 465/465 at SHA `87904137` but never mark that SHA's browser gate passed.

---

### 2026-11-24 — P1 authentic command palette was NOT visible: fix Radix Dialog.Content geometry

[Exact-SHA 854824a0 authenticated local QA 45512434625](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45512434625) FAILED at first real Dashboard search opener: `getByRole('dialog', {name:'Pesquisa e comandos do CRM'}).waitFor(visible)` timed out in 8 seconds, even though DOM showed `cmdk-dialog data-state="open"`. Diagnosed actual `cmdk` source: `Command.Dialog` wraps `RadixDialog.Content` outside nested `Command`, and passes `contentClassName` to the role=dialog element. Previous code styled only nested `.command-palette` fixed overlay, leaving role=dialog with empty class/zero layout box and effectively invisible to keyboard/screen readers. Proper fix sets `overlayClassName="command-dialog-overlay"` and `contentClassName="command-dialog-content"`, uses fixed overlay and an explicitly sized/centered responsive Radix Content, with nested Command as ordinary block and menu list bounded to viewport. Adds source regression contract; retains original searchGlobal/router actions and QA strict visible-dialog gate. **No WCAG checks disabled or timeout increased to conceal defect.** Keep PR draft, no merge/deploy; exact new SHA both CI and 4-role local QA required.

---

### 2026-11-24 — DS10 accessible AI drawer focus lifecycle (DETACHED)

The existing Watson AI assistant is now reachable in the authenticated CRM as a named `role=dialog` drawer. Even if axe returns zero violations/incompletes, it does not prove keyboard Tab is trapped or that Escape returns focus to the invoking button. A detached fix now stores opener focus, focuses the actual query input on open, traps forward/reverse Tab within visible drawer controls, handles Escape and restores prior focus on cleanup. QA exercises Escape, restoration and button close without submitting prompts or invoking any LLM. Keep as **new candidate not yet published** while current exact SHA `854824a0` real QA executes, so results are not conflated; require next SHA CI+authenticated proof. No data/backend/credential/production changes.

---

### 2026-11-24 — DS9 real screenshot inspection: company modal footer and close overlap (detached candidate)

Individually opened actual [same-SHA 45510765794](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45510765794) desktop screenshot `profile-1-customers-create-desktop-light.png`: at 1440×960 the full-height company form ends with its blue `Cadastrar Empresa` button partially clipped at the modal's bottom edge and a close (×) icon overlaps the CNPJ import button. These problems were **not caught by axe**, which checks DOM semantics and contrast, so all 208 route checks PASSED despite the visual defect. The detached next candidate uses a sticky opaque semantic DialogFooter inside the 90dvh scroll container, top header right padding and responsive stacking; extends read-only authenticated QA to assert **visible submit-button bounds** for Companies, Contacts and Leads in both modes and viewports, beyond existing text contrast checks. No changes to submit handlers, CNPJ parsing, integration, server data, tenant policy or persistence. Maintain PR Draft and require fresh screenshots at final exact SHA. The original private reference was used for visual hierarchy only, no copying.

---

## 2026-11-24 — DS9 actual header Search activation and CommandBar end-to-end gate (DETACHED)

Static reconnaissance found the original CRM Dashboard Header's top Search input was **inert**: no `onChange`, onClick or navigation handler, and separate CommandBar component was not mounted through `Header.tsx`. Source-only CommandPalette.css cleanup would therefore NOT constitute a real UX fix. This candidate replaces fake Search input with an accessible, visible responsive command opener; mounts the **existing** CommandBar component, adds mobile search access and Ctrl/Cmd+K shortcut, translates existing labels/empty/search states to Portuguese, and corrects inherited text foregrounds in selected results. It does not invent new backend actions: the existing `searchGlobal`, router navigation and `updateDealStage` handlers are preserved. E2E on `/dashboard` now explicitly opens command UI, runs full axe (zero violation AND incomplete), takes screenshots at desktop/mobile light/dark, checks Escape and Ctrl+K, and then audits the separately mounted Watson AI drawer without submitting AI prompts. **It is only staged, not yet published,** and must pass same-SHA CI and authenticated QA before any acceptance. No hosted DB, production, migration, secret or merge.

---

## 2026-11-24 — DS9 real Watson AI drawer accessible semantic family (detached)

Header.tsx mounts AiAssistant in the live CRM, not a fabricated mock route. Its original UI contains local Tailwind color/type/radius/shadow utilities, icon-only send button with no accessible name, and insight cards styled as clickable despite having no handler. This candidate removes 23 categorized local-style matches (all 23 → 0), using central status/contrast/overlay/type roles; gives icon-only controls readable ARIA names, real input name and an explicitly named dialog; removes misleading pointer style while retaining existing chat calls and CRM deal context. Adds strict anti-hardcode lock and source test, plus real authenticated `/dashboard` UI drawer open/close and axe snapshot across desktop/mobile and light/dark; no AI prompt submitted or external LLM called during QA. This block is **not declared accessible** until actual browser PASS and verified focus behavior; print colors / command palette changes remain staged in same substantial candidate. No server action, data, credentials, production, hosted DB or merge.

---

### 2026-11-24 — DS8 same-SHA QA 4acaa857: only two dialog description nodes remain inconclusive

[Authenticated local QA 45508860943](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45508860943) completed the full four-profile/22-route matrix on exact SHA `4acaa857`. It **FAILED** exactly four combinations in two routes: `/leads?create` and `/contacts?create`, desktop/light and desktop/dark, each with ONE axe `color-contrast` *incomplete* and ZERO violations. Safe captured geometry localized the text node to the `DialogDescription` paragraph in each header (Lead p bounds [480,292,476,40]; Contact p bounds [440,236,368,40]); computed foreground and opaque ancestor background were correct, but axe reported `overlap`/unclassified. All mobile modal combinations and default routes passed. Genuine desktop screenshots show very heavy uppercase 10px/tracking with two-line wrapping; MOBILE Contact screenshot proves a severely compressed title and vertically stacked subtitle because the header was forced to `flex-row` alongside an import button. This is an observed readability/responsive P1, not proof that the colors themselves are wrong.

Prepared remedy replaces both descriptions with standard centrally tokenized readable `ds-type-body text-muted-foreground leading-relaxed` (no uppercase/tracking), and makes Contact header stack its title/description and full-width import control on mobile before using a row at `sm`. This directly removes the observed text-overlap risk without bypassing axe, changing role checks, inventing actions or altering data. Strong same-SHA real-browser proof must still show **zero violations and zero incompletes**. No hosted Supabase, production, migration, secrets or merge.

---

### 2026-11-24 — DS8 real create modal failures localized, coherent accessibility remediation

On [exact-SHA isolated authenticated QA 45506940586](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45506940586), commit `6e30acc8` audited four real synthetic profiles across all 22 authorized routes. It FAILED 16 viewport/theme combinations **only in four newly exercised states**: /login (one color-contrast incomplete per combo due blurred decoration under the footer), /leads?create (unlabeled native select, incomplete aria-hidden-focus and contrast during transition), /contacts?create (unbound form labels, company selector/button name, background-focus and contrast during animation), /customers?create (unbound inputs, unnamed select/tag controls, dangling dialog description and background-focus). The route-level default QA and previous Pipeline/Goals tests did not report other regressions. This block fixes genuine semantics, not suppressions: shared open-gated hook for background inert/cleanup; explicit unique useId label associations for each field; named select/button controls; mounted Radix DialogDescription; solid design-token surfaces, shared primary Button, common modal max-height/padding; and real QA runs axe after the real 200ms animation settles. Removes overlapping blur decoration from login and gives footer an opaque background. Maintains true server actions, entity tenancy, product prices and OAuth. No DB, user accounts, migrations, Vercel production or merge. **Retest the entire real browser matrix on the next exact SHA before marking resolved.**

---

### 2026-11-24 — DS8 B4 source assertion synced with fail-closed full-matrix login audit

On candidate `6e30acc8`, [CRM validation 45506940592](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45506940592) FAILED exactly one obsolete static test (419/420 PASS): it expected the previous login audit to throw `LOGIN_LAYOUT_OVERFLOW` immediately. The active authorized QA now records the boolean `layoutOverflow` with a bounded `/login` failure, increments `a11yFailureCount`, and continues the full four-profile/22-route WCAG matrix (still fail-closed at end). Updated the historical contract to test that improved behavior rather than restore early exit. No WCAG exclusions, no credential or production changes. Continue only with exact-SHA CI and real authenticated QA; PR remains Draft.

---

### 2026-11-24 — DS8 real login keyboard/WCAG gate caught genuine contrast defects

At exact SHA `377aec48`, full [authenticated QA 45506376462](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45506376462) **FAILED EARLY** on the newly added real unauthenticated `/login` audit in desktop/light: three `color-contrast` nodes, zero incomplete. Safe computed-style evidence: submit button foreground dark on branded dark-blue background, invitation-only helper paragraph with `text-muted-foreground/60`, and copyright line with ancestor `opacity-30`. The browser never reached the full 22-route matrix on that SHA; do not claim it passed. The prepared fix restores full opacity to both visible paragraphs and removes all local login submit button theme/hover/font/height overrides except `w-full`; global `Button size="lg"` now owns the accessible primary foreground/background and central geometry. The QA harness also records login issues fail-closed while **continuing all 22 routes** instead of aborting at the first login finding. Same-SHA CI + complete real QA needed; no auth action, permission, tenant, production or DB changes.

---

### 2026-11-24 — P1 authenticated Inbox OAuth CTA contrast across both themes (real browser)

[Exact-SHA 233b5f51 CI 45504775414](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45504775414) PASSED, [full isolated authenticated browser 45504775478](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45504775478) FAILED exactly four combinations: `/inbox` initial Office 365 connection button `color-contrast` (1 per desktop/mobile and light/dark), zero other audited route defects and zero incomplete. Real [visual artifact 14972478898](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45504775478/artifacts/14972478898) proves the CTA displayed an isolated Microsoft-blue #0078D4 background, whereas `ConnectEmailButton.tsx` overrode the shared Button foreground/hover and thus had insufficient contrast. Fix **removes** locally hardcoded background, white text, shadow, weight and dimensions entirely and consumes `<Button size="lg">` built-in `bg-primary text-primary-foreground`, accessible in both root themes through `tokens.css`. Unchanged OAuth action and error handling. Add strict source regression, require exact new SHA real browser and WCAG zero violation/incomplete before closing. Do not fake pass or deploy/merge.

---

### 2026-11-24 — Direct private-reference vs authenticated screenshot review (no premature visual acceptance)

Verified original private reference screenshots `Captura de tela 2026-11-17 093410(1).png` (detail inspector) and `093344(1).png` (pipeline board) directly from the user's private Library; originals are NOT copied to the public repository. Inspected actual synthetic authenticated CRM screenshots in the QA artifact [14972826077](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45502306283/artifacts/14972826077) at SHA `2c82a0e4`, including `profile-1-pipeline-deal-detail-desktop-light.png` and `profile-1-settings-desktop-light.png`. Current Pipeline dialog has a centered full-width header, three frequent tabs plus secondary selector, dense editable detail panels, and a financial/recent-actions inspector. The reference uses a narrower right-anchored details drawer, compact data rows and a contextual history/tasks/notes inspector. This remains a **P2 structural hierarchy/density gap**, not an instruction to invent unavailable tasks/notes functionality or to change CRM deal calculations. Settings at the inspected SHA retains uppercase miniature label patterns; the current newer central typography migration must be reviewed with fresh same-SHA screenshots before acceptance. Product functionality, keyboard, mobile and contrast status are determined by actual authenticated QA separately. **Visual parity NOT ACCEPTED**; retain review gate, keep all references private, and do not equate TypeScript/axe green with a human-approved visual system.

---

### 2026-11-24 — DS6 real authenticated proof: orphan tabpanel fixed, genuine Stakeholders contrast P1

Exact SHA `2c82a0e4` passed [CRM validation 45502306282](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45502306282) (302 tests, TypeScript, build, WCAG preflight) but isolated [authenticated QA 45502306283](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45502306283) FAILED four Stakeholders combinations. **Prior `aria-valid-attr-value/noIdShadow` is resolved:** zero incomplete from all four secondary states. New independently validated real `color-contrast` violation, one `p` within the empty Clients/Stakeholders panel, light/dark desktop/mobile, matching the `opacity-70` on its whole empty-state container. Removing ancestor opacity retains foreground/muted foreground semantic tokens without reducing legibility. A strict source regression test protects this. New candidate awaits exact-SHA four-profile authenticated browser retest; do NOT waive axe findings, merge, deploy or claim visual acceptance.

---

## 2026-11-24 — DS7: cohesive Operations/Admin family migration, keep Draft pending real QA

Owner explicitly requested the Design System completion, not repeated micro-PRs. Prepared a substantial **single-PR** migration on 26 original CRM operational and administration TSX modules: Settings/Users/Security, Activities, Automations, Contracts and Service Desk. Existing Tailwind palette names, sub-12px font sizes, locally chosen type scales, radius and shadow classes are replaced by the shared light/dark semantic palette, typography, control/panel radius and elevation roles. No new identity; all default values remain in `src/design-system/tokens.css`. Strict no-hardcode policy now locks 16 newly clean modules. Original read-only visual source screenshots were examined privately; no third-party assets published.

This is code centralization, **not** a declaration of full product UX acceptance. Preserved real Server Actions, user/account permissions, tenants, contract/signature logic, calculations and persistence; no hosted DB, migrations, or production operations. Source-level regression contract covers all 26 modules. Some existing business default hex values and local decorative gradients remain outside this partial cleanup and must be reviewed explicitly before declaring global completion. **Required next gate:** exact SHA TypeScript, unit, build, strict token policy plus isolated authenticated four-profile/22-route light/dark desktop/mobile browser with zero axe violations AND incomplete, propagation and screenshots compared to reference. Keep PR #221 DRAFT, human merge only.

---

### 2026-11-24 — DS6 P1 root cause found in real authenticated browser (candidate awaits re-test)

On SHA `82377adb`, [CRM CI 45495842854](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45495842854) PASSED; [authenticated QA 45495842864](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45495842864) FAILED only four Partners viewport/theme combinations, with one `aria-valid-attr-value` incomplete each. The forensic probe located a DIV *inside* the dialog with `aria-labelledby` referencing a nonexistent element; the dialog itself has `aria-label` and is not the culprit. Five secondary destinations (Parceiros/Clientes/Documentos/Comunicações/Histórico) were implemented with Radix `TabsContent` but navigated through a separate `Select` without corresponding `TabsTrigger`, making orphan `role=tabpanel` references. Candidate switches only these five contents to conditionally mounted named regions and extends the browser audit across them; maintains genuine primary tabs, unchanged data/workflows and strict zero-violation/zero-incomplete axe gate. **P1 OPEN pending exact-SHA CI/auth QA and image review.** Do not merge, deploy, use hosted Supabase or claim global UX acceptance.

---

### 2026-11-24 — DS6 P1: axe `noIdShadow` real IDREF vs wrongly attributed node

Exact SHA b4e5bd7a CI [45491164463](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45491164463) PASS, auth QA [45491164346](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45491164346) FAIL four Partners states, one `aria-valid-attr-value` incomplete, zero violations. Axe-core 4.14 check source confirms `noIdShadow` indicates unresolved `aria-labelledby` reference in a document with a shadow-root tree; it does NOT prove the `role=dialog` itself is the violating node. The earlier diagnostic used only `node.target[0]`, which may resolve a parent in a multi-layer shadow/frame target. Loading axe once and `axe.reset()` did not change the finding. A bounded QA-only forensic probe now resolves full axe target path in memory and records safe element structure, ARIA NAMES and boolean IDREF resolution, not IDs/text/selectors. **P1 remains open** until exact-SHA full authenticated audit reports zero WCAG violations and zero incomplete, with visual acceptance separate. No suppressions, hosted DB or production edits.

---

### 2026-11-24 — P1 single axe-core 4.14 `noIdShadow` on deal dialog

HEAD a208b6b0 CI 45487106786 PASS, authenticated QA 45487106841 FAIL in all four Partners theme/viewport combinations. Structured axe result: `aria-valid-attr-value` one incomplete; `data.messageKey=noIdShadow`, reported `attributeName=aria-labelledby`. Actual DOM root has `aria-label` only (no labelledby/describedby), mounted title/description, and changing accessible label to a neutral literal in the isolated read-only probe did not change the finding. The rule's incomplete means an ARIA reference could not be resolved, not proof of a valid accessibility result. Harness previously injected axe script again during each nested audit in the same React/Radix page. Candidate loads axe once, calls `axe.reset()` before real full WCAG audit, and reports only safe numerical IDREF/AOM structure if issue persists. Rule remains enabled, all violations **and** incomplete results fail acceptance, no silent exception/allowlist. Inspect same-SHA real browser and screenshots before closing.

---

### 2026-11-24 — DS6 root dialog ARIA incomplete persisted despite DIRECT accessible name

Exact SHA aa599f1b [CI 45485021450](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45485021450) SUCCESS (298 tests). [Real auth QA 45485021426](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45485021426) FAIL all four Partners viewport/theme combinations with one axe `aria-valid-attr-value` **incomplete** and zero violations. On-page structure now proves only `aria-label` present and nonempty, no IDREF attributes at all; therefore neither explicit CSS-safe IDREF nor direct name removed the incomplete. The DOM remains keyboard-navigable and Partners mobile scrolling fix holds. Root cause remains unknown. Next candidate adds SAFE detailed axe check `messageKey` and attribute NAME plus read-only, temporarily varied neutral-label axe probe confined to QA browser and restored immediately. The normal original audit remains fail-closed, no rule disabled/ignored. Do not mark visually accepted until exact-SHA four-role 22-route QA reports zero violations/incompletes and inspected private screenshot evidence. Same PR Draft, no prod/data changes.

---

### 2026-11-24 — P1 root-dialog ARIA: IDREF hypothesis disproved; direct accessible name candidate

Exact SHA 4eea8f5a [CI 45483291071](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45483291071) SUCCESS (298 tests). [Isolated QA 45483291054](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45483291054) FAILED: four Partners states still show one axe `aria-valid-attr-value` incomplete on the deal dialog, despite explicit CSS-safe useId IDREF and two existing title/description targets. **Mobile scroll violation and icon-only button violation both resolved**: zero violations in all tested states. Previous hypothesis (React useId syntax) was insufficient and is not an accepted explanation. The next candidate follows WAI-ARIA 1.2's allowed `aria-label` naming and WAI-ARIA APG's recommendation to omit dialog-level `aria-describedby` for complex multi-section content: directly label opportunity dialog with its title and explicitly omit IDREF props, retain visible title and in-content description. Add bounded logging of which ARIA attributes are present (names, not values) and a boolean direct-name check. All WCAG violations/incompletes must remain zero to close P1; no rule disable/allowlist. After pass, inspect authenticated screenshot consistency. No business/security/DB/production changes.

---

### 2026-11-24 — DS6: inaccessible mobile Partners scroll and unresolved dialog ARIA reference

Exact SHA d7e10385 [CI 45481474035](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45481474035) SUCCESS. [Local authenticated QA 45481473896](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45481473896) FAIL: all four desktop/mobile light/dark combinations have **no** button-name violation after removing inert ExternalLink action, but root deal dialog reports axe `aria-valid-attr-value` incomplete. Safe on-page evaluation confirms `aria-labelledby` and `aria-describedby` each have one referenced ID, both targets exist, and both title and description are mounted; cause not yet confirmed. Mobile also has `scrollable-region-focusable` on Partners outer scrolling panel (bounds [12,160,368,436]). Next candidate adds tabIndex, named region, keyboard focus outline to real Partners scroll; sets explicit stable CSS-safe unique DialogContent, DialogTitle and DialogDescription IDREFs and persists title/description during edit mode. This is a structural compatibility hypothesis for the axe unresolved state (React useId/CSS special characters, documented in axe-core issue #4576), NOT proof of a fix. Gate remains OPEN until zero violations and zero incompletes in same-SHA authenticated QA and visual inspection of desktop/mobile, both themes. No customer data, hosted Supabase, production or main merge changes.

---

### 2026-11-24 — P1 Commercial authenticated Partners accessibility

At SHA 2a1a36d7 CI [45478409187](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45478409187) SUCCESS (296 tests, 32 strict modules). Real authenticated QA [45478409438](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45478409438) FAILED all four desktop/mobile, light/dark opportunity Partners states. Axe evidence: `button-name` on an unnamed ExternalLink-only icon button with no click handler (thus misleading dead control); a separate `aria-valid-attr-value` *incomplete* on dialog, requiring further exact root-cause evidence. Repair decorative icon with non-interactive aria-hidden span; add bounded structural boolean diagnostic of dialog labelledby/describedby IDREF presence and mounted title/description, never log values or customer data. Keep strict axe fail-closed and same-SHA acceptance blocked until actual zero violations/incompletes and reviewed screenshots. No hosted DB or production changes.

---

### 2026-11-24 — DS6 Pipeline source-contract alignment

At SHA 81953310, GHA CI [45478015290](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45478015290) reports exactly two historical source-test failures, not a compiler defect. `test/b2-commercial-workspaces.test.ts` expected old stage palette utilities `bg-info` and `bg-success` after migration to dedicated `bg-stage-qualification` and `bg-stage-won` central semantics; `test/b4-accessibility-remediation.test.ts` required old literal `sm:w-80` after conversion to `sm:w-[var(--ds-kanban-column-width)]`. Tests must be updated to assert the new stronger centralized contracts, preserving responsive Kanban. Real-browser computed-stage-token and WCAG certification remain release blockers, P1 OPEN. PR Draft, no production or hosted data changes.

---

### 2026-11-24 — P1: incorrect Kanban component selected for DS6 conversion

Verified real QA SHA 560836ba: CI [45477099906](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45477099906) SUCCESS (295 tests, zero policy regressions, 31 locked modules), but [authenticated QA 45477099853](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45477099853) FAILED `COMMERCIAL_STAGE_TOKEN_RENDERING_FAILED` on the actual /pipeline board. Source root cause: live `src/app/(dashboard)/pipeline/client-page.tsx` contains its OWN DragDropContext/DEFAULT_STAGES and does not import `src/components/pipeline/KanbanBoard.tsx`. The first Commercial migration updated a component not used on that route and therefore could not prove visible behavior. Corrective candidate migrates the LIVE route's five static stage roles to centralized `--stage-*` tokens, adds data-qa-stage/dot to real column DOM, and centralizes existing board geometry. The route already had zero source hardcode-policy occurrences; add it to strict guard. P1 remains OPEN until same-SHA E2E checks computed colors and real browser screenshots in desktop/mobile and light/dark, along with opportunity nested panels. No changes to stage transitions, tenants, financial calculations or hosted environment.

---

### 2026-11-24 — DS6 Commercial semantic migration candidate (awaiting QA)

Pipeline's KanbanBoard previously constructed `bg-${column.color}`, `border-${column.color}` and hover classes dynamically. Tailwind did not have static class names to guarantee output. Candidate uses typed literal classes for five stages (Qualification/Proposal/Negotiation/Won/Lost), all resolving existing central `--stage-*` tokens. Related DealFormModal, PartnersTab, StakeholdersTab, LostDealModal and CommissionWidget are also converted from local palette/typography/radius/shadow choices to shared tokens and added to strict no-hardcode policy (6 components, 194 source occurrences removed in prior measure). Authenticated QA will verify computed stage dots and visit both previously untested secondary opportunity tabs, capture screenshots and run axe on same SHA, desktop/mobile light/dark. Do not call this accepted before real QA, full CI, visual comparison and human review. Business operations and hosted DB unaffected.

---

### 2026-11-24 — P1: mobile nested Goals accessibility and flow defects

CI for 93bc4b95 (run 45472526721) SUCCESS. First authenticated QA run attempt failed prior to app launch due ephemeral local Docker inbucket port 54324 busy; re-run of same job reached the real authenticated CRM and found new mobile-state defects: Commissions incomplete text contrast because the second horizontal user card was partially clipped, Statement `scrollable-region-focusable` on an overflow table with no keyboard focus, and Seasonality one `color-contrast` incomplete due sticky page-header text overlapping the scrolling plot context. Verified exact coordinates against real local QA mobile screenshots in artifact `crm-b4-local-visual-evidence-93bc4b9539d99f1f53b340bb35e894339dfb689e`. Remediation changes user picker to a responsive non-overflowing grid, adds keyboard tab stop and aria region name to statement table, and removes mobile sticky behavior from the common PageHeader while preserving sticky behavior on medium/desktop. This is real UI correction, not suppressing axe checks. **P1 remains OPEN** until new same-SHA authenticated QA validates all nested states and visual screenshots across both themes.

---

### 2026-11-24 — DS5 last real contrast violation located by screenshot and numeric bounds

**Exact SHA 9d8956ae** [CI 45471381649](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45471381649) SUCCESS (292 tests); [isolated authenticated QA 45471381437](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45471381437) FAILED only `planning` with **one** `color-contrast` node. The safe numeric bounding box `[836,452,156,16]` was mapped directly onto the genuine `profile-1-goals-family-desktop-light-planning.png` artifact: the `(-) Ineficiência Ramp-up` paragraph inside DRE. Its surrounding row used `opacity-80` on all content, lowering accessible text contrast. The corrective candidate removes only that unnecessary container opacity; other DRE amounts, formula semantics and colors remain unchanged. Screenshots prove layout and full-width mode selector now correct, with DRE alongside inputs, and both seasonal chart and other Goals tabs passed within the same run. **Release gate still open:** same new SHA 4-profile authenticated browser QA must report zero WCAG violations and incompletes on all five Goals states; inspect real resulting screenshots before marking resolved.

---

### 2026-11-24 — DS5 P1 residual Planning contrast and responsive selector

**Observed SHA 28cca4b0:** [CI 45470307615](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45470307615) SUCCESS (291 tests); [authenticated QA 45470307748](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45470307748) FAILED only in Planning and Seasonality nested states. Contrast issue counts dropped from five failing states to two, and labels/most color failures disappeared. Remaining: one actual Planning paragraph contrast violation; three Planning axe `incomplete` (one goal-mode option overlap, two funnel metrics), and three Seasonality `incomplete` (funnel metrics/paragraph). Visual screenshot verified the severely broken first-column layout is now repaired and DRE sits beside Planning, but three goal-mode choices are still compressed to half-column width; funnel uses translucent blue panel with decorative 10%-opacity overlay. Next candidate allocates full width to mode selector and monthly goal, replaces translucent funnel surface with solid semantic surface, removes decorative icon, creates responsive metric grid and enriches safe diagnostics with quantized numeric bounding coordinates for any remaining contrast failure. Keep P1 OPEN until same-SHA real QA zero violations **and** zero incompletes, plus visual inspection in both themes/sizes. No financial formula, business write, production or hosted DB change.

---

### 2026-11-24 — P1 Goals nested screens: confirmed root causes and remediation candidate

**Proof:** SHA bf69f1dd CI [45468723328](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45468723328) SUCCESS, isolated authenticated QA [45468723316](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45468723316) **FAIL**. Sanitized axe diagnostics:
- Commissions: `color-contrast` 2 affected nodes (tab trigger state sampled immediately after transition)
- Campaigns: `color-contrast` 3 nodes; `label` 2 inputs
- Planning: `color-contrast` 40 nodes, `label` 7 inputs, `incomplete/color-contrast` 5 (Recharts)
- Seasonality: `label` 7, `incomplete/color-contrast` 20 SVG/chart labels
- Statement: `color-contrast` 2 buttons
These counts are **node counts**, not distinct WCAG rules. Real screenshot `profile-1-goals-family-desktop-light-planning.png` in artifact `crm-b4-local-visual-evidence-bf69f1dd...` shows severe structural P1: the `FilterBar` is a free child of a 12-column grid, consuming one column before the 5+7 layout and pushing the results sidebar under the inputs. A duplicate wrapper in the goal mode grid squeezes three options into one small cell. No screenshots may be called visually approved until fixed.

**Candidate remedies:** put FilterBar in a full-span grid cell; eliminate nested wrapper; add semantic accessible names to live and expandable form inputs; wait for genuine tab/enter animations before axe without disabling checks; provide native `AccessibleChart` fallback data and suppress ambiguous SVG tick text while retaining interactive tooltips. Verify screenshot output and zero violations/incompletes on exact new SHA in both themes and sizes; keep P1 **OPEN** until demonstrated. No app data mutations or source reference copies.

---

### 2026-11-24 — P1: nested Goals/Commissions real WCAG violation

**Observed exact SHA d68b9e82:** [CI run 45466924408](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45466924408) SUCCESS; [isolated authenticated QA 45466924462](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45466924462) FAILED when opening the previously untested **Regras de Comissão** tab: `GOALS_FAMILY_ACCESSIBILITY_FAILED: commissions; violations=1, incomplete=0`. This is not a numerical inventory issue; it blocks visual/UX acceptance. Prior E2E tested the default Goals tab only. The existing axe safety projection already strips selectors, text, HTML, IDs and user data, but the nested-tab assertion threw before serializing the safe failure rules. Next candidate captures the bounded rule ID/allowlisted computed style on each nested state and keeps the full state sequence running; it also fixes the Commissions two-column fixed-width layout on mobile and exposes selected user via aria-pressed. No data mutation actions involved. **Release gate:** exact-SHA CI+authenticated QA PASS with zero WCAG violations/incompletes in every nested Goals state, inspect screenshots in four viewport/theme combinations, then mark blocker resolved. Until then: OPEN.

---

### 2026-11-24 — DS4 QA isolation refinement after lockfile verification

Verified `package-lock.json` on candidate `d288a526`: Next.js 16.1.6, React 19.2.3 and an already-installed axe-core 4.11.1, while B4 QA requires pinned axe-core 4.14.0. Linking the new pinned axe package into the application tree would still replace an existing package and invalidate runtime isolation. The QA installer instead exports two **absolute isolated entrypoint paths** through `GITHUB_ENV` (`PLAYWRIGHT_CORE_PATH` and `CRM_QA_AXE_MIN_PATH`) and both test runners load these directly. No repository root package is replaced or symlinked. The same automated hashes validate the package lock, Next, React and React DOM manifests before/after tool installation. This correction awaits exact-SHA real QA and is NOT yet acceptance.

---

### 2026-11-24 DS4 theme action isolated diagnostic follow-up

After `8baeb597`, CI [45430181597](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45430181597) SUCCESS, but local authenticated QA [45430181395](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45430181395) still FAIL with `saveState=failed`. Its new sanitized Server Action code stream was empty, so the failed path happened *before* the DB-result verification branch. The precise cause is not yet known; no production diagnosis is assumed. Add bounded, non-sensitive failure-stage categories to the individual preference action: AUTH (trusted session), CLIENT (server-only Supabase client), TRANSPORT (request failure), or a PostgREST error code/NO_ROW/WRITE_MISMATCH. The isolated QA workflow may print only these fixed codes, never user/session identifiers or raw errors. Re-run exact-SHA CI + full authenticated QA, no bypass of auth and no theme persistence mock.

---

### 2026-11-24 DS4 personal-theme persistence QA blocker and targeted correction

**CI proven on `34fb0b39`:** [run 45428977985](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45428977985) SUCCESS. Measured design debt fell from 188 files/5,168 occurrences to **172 files/3,834 occurrences** (16 fewer files, 1,334 fewer local decisions); strict locked migration count 12, zero new hardcodes. This is a real static migration improvement, **not full visual acceptance**.

**Authenticated local QA on the same SHA:** [run 45428977868](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45428977868) FAILED: `CRM_THEME_PERSISTENCE_BLOCKED: wantedDark=false, renderedDark=true, saveState=failed`. The theme Server Action failed, causing the intentionally fail-closed client to revert the theme. The previous implementation's optimistic UI masked that failure. Proposed remedy: make the individual-theme action `updateUserTheme` return a checked row for the authorized profile (not simply a no-error update with zero affected rows); remove unnecessary root `revalidatePath`, and print a bounded backend error code from the **isolated local** runner only if QA fails. E2E must prove read-after-write on full page reload as well as all 9 central token style probes. No hosted Supabase operation or organization-wide theme persistence is part of this block. New candidate, CI and authenticated QA pending.

---

### 2026-11-24 DS4 second candidate diagnostic and reconciliation

**Exact SHA `6b342382`:** [CRM validation 45427908783](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45427908783) failed at `git diff --check` due trailing whitespace in one documentation line and changed markup lines of Automations/Installments; TypeScript, 284 tests, build and synthetic WCAG preflight had passed. [Local authenticated QA 45427908643](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45427908643) failed in the theme stabilization step with sanitized state `wantedDark=false, renderedDark=true, saveErrorVisible=false`. That proves a mismatch between the visible document class and the intended theme after a click, not a demonstrated persistent save failure. The theme toggle now computes its next value from the actual document class, not a possibly stale provider ref; it also records only `saving/saved/failed` status in a non-sensitive HTML data attribute for fail-closed QA diagnostics. The rollback on real failed saves remains enabled. Trailing whitespace removed in all affected files. No server actions, DB, auth policies or protected environments changed. Both gates must rerun on the new SHA before acceptance.

---
### 2026-11-24 — DS4 first CI/authenticated QA: failures and corrective actions

**Observed on SHA `9b9ba175`:** [CRM validation 45426703443](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45426703443) FAIL at three static source-contract assertions: prior tests required raw Tailwind class spelling (`text-xs`, `rounded-xl`) or `StatsGrid` container markup that was intentionally migrated to shared semantic classes/data-slot attributes. The underlying color/contrast source behavior remains required; update exact expectations to the new centralized roles, do not remove tests. [Local isolated authenticated QA 45426703397](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45426703397) FAIL at theme switching with `page.waitForFunction: Timeout 5000ms`. This is a real theme persistence/initialization stability concern, not permission to force class overrides in the QA runner.

**Corrections:** static B2/B4 contracts assert the migrated markup/semantics. ThemeProvider initializes its class once and prevents a stale revalidated root `initialTheme` prop from undoing a more recent client selection; the last failed save still rolls back the UI and displays a failure. Browser E2E now fails with bounded, non-sensitive `CRM_THEME_PERSISTENCE_BLOCKED` diagnostic that distinguishes a save rollback from an unresponsive toggle. Same-SHA full CI, real authenticated QA and nine-token propagation must be repeated before acceptance.

---
## 2026-11-24 — DS4 cross-family consistency block (PR #221)

| Confirmed baseline / issue | Workstream | Release gate |
| --- | --- | --- |
| 188 UI files / 5,168 local style occurrences at SHA `2891b5ec` | Global legacy utility aliases plus twelve high-debt semantic migrations | Actual policy zero debt in locked files; remeasure total from final SHA |
| KPI colors/gradients/borders declared independently by each page | Typed `StatTone` roles; shared StatsGrid geometry; migrate Leads/Contacts/Reports/Sales/Pipeline | Authenticated browser on desktop/mobile both themes; no unstable/low contrast |
| ThemeInput/ThemeSelect always forced empty controlled state if no `value` | Support uncontrolled input/defaultValue and existing controlled usages | Typecheck, unit and browser QA; real filters remain editable |
| Personal theme visually optimistic even on save failure | Revert most recent failed preference save with visible error | Client test/contract plus theme A/AA in QA |
| Organization theme screen falsely claimed it saved global default | Stop unsupported save UI; disclose current capability | No false success. Persistence remains separately gated |
| Source-level tokens not enough to prove propagation | Computed-style 9-token probe in three real authenticated route families | Same exact SHA, 2 viewports x 2 themes, restore all overrides and axe PASS |

No business calculations, tenants, RBAC, migrations, hosted Supabase, production, or proprietary references changed. UX visual acceptance and remote protected QA remain open. Existing PR #221 remains DRAFT. Final SHA evidence and residual debt required before signing off.

---

### 2026-11-24 — G2/DS3.1 verification: exact SHA 340e0113

Confirmed: [CI 45416569401](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45416569401) **SUCCESS** and [isolated authenticated QA 45416569442](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45416569442) **SUCCESS**, 4 profiles, 180 checks, zero recorded failures, same SHA `340e0113af5c5268c5aa1bdb0a468fc4bbe7c5eb`. Inspected QA result JSON and actual screenshot files for desktop/mobile, light/dark, Resumo and Histórico. Accurate data-based summary, 3+5 navigation and focus/axe checks worked.

**Visual review uncovered an untested P2:** the screenshot of Histórico showed the **Propostas pill still blue**, despite HTML reporting no primary tab selected; this produces misleading visual state. Cause: the previous primary pill had transition-driven visual styling and persisted through an immediate History screenshot. Next candidate explicitly binds foreground/background to central `--primary` and `--foreground` using actual `activeTab`, disables color transitions for that control, and adds computed-CSS regression checking (not just aria attributes). The next SHA must pass CI and same-SHA authenticated QA with History screenshot showing **no primary blue pill**. Do not mark visual acceptance based on the earlier green run.

Open broader visual gaps: other screen families, 196-file design-token debt baseline, runtime administrative configurator, protected remote preview, and human merge/visual signoff. PR #221 remains DRAFT, no production or hosted Supabase changes.

---

### 2026-11-24 DS3.1 local QA diagnostic and remediation

Original candidate `f882c704`: [CI 45413419162](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45413419162) **SUCCESS**; [full authenticated QA 45413418733](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45413418733) **FAIL**, four opportunity-detail combinations (desktop/mobile, light/dark). No section navigation, color contrast, header clipping or keyboard diagnostic failure was emitted. Axe reported `definition-list` (1) and `dlitem` (6) in every detail state: the new contact panel nested label/value terms inside non-semantic wrappers instead of a valid description list. This is a real accessibility defect; it was not suppressed. Remediation renders contact rows with labels and text pairs without orphaned `dt`/`dd`, and preserves a compact high-visibility trio of stored estimated value, recorded probability and expected close date at the top of the overview (especially needed on mobile). New SHA CI+authenticated QA and screenshot visual review **PENDING**, PR remains DRAFT. After inspection of the actual History screenshot on candidate `f882c704`, a stale visual selection on the Resumo pill was also observed while the secondary Histórico content was open; its aria and visual state require correction, plus a mobile two-column facts layout to prevent excessively tall first panels.

---
## 2026-11-24 — G2/DS3.1 comparative visual workstream: section navigation and true commercial details

**Baseline (observed):** `37dfb820` CI PASS and isolated local authenticated QA PASS: 4 profiles, 176 checks, no recorded failure. Real evidence: `profile-1-pipeline-deal-detail-{desktop,mobile}-{light,dark}.png`, artifact `crm-b4-local-visual-evidence-37dfb820...`, compared directly against private `Captura de tela 2026-11-17 093410(1).png`. No production data used.

| Difference observed in baseline | Impact | DS3.1 target | Acceptance status |
| --- | --- | --- | --- |
| Eight tabs displayed with equal priority, 2 rows desktop / 4 mobile | P1 navigation density and discoverability | 3 direct tabs + 5 secondary entries with keyboard access; all original eight destinations preserved | Pending exact-SHA browser evidence |
| Four KPI cards dominate the center, leaving empty space and scattering real commercial details | P2 information hierarchy | Compact recorded company/owner/stage/source, actual contact and product summaries, description and next step in central pane | Pending visual comparison |
| "Tomador de Decisão" label shown for a generic contact without a role assertion | P2 potentially misleading content | Label actual registered contact without inventing decision authority | Pending QA |
| Right inspector shows financial reconciliation and recent activity | Baseline retained | Preserve distinct stored estimate versus product calculation, historical activity and existing buttons | Regression gate |

The source reference guides hierarchy only; no clinic features or copyrighted visual assets are copied. Technical CI/axe and screenshots alone do not approve G2/DS3.1 aesthetically. Keep PR #221 DRAFT; remote protected QA, global theme propagation and other route-family migration remain open.

---

## 2026-11-24 — Opportunity detail G2/DS3 comparative ledger (PR #221)

**Baseline:** authenticated synthetic screenshot from SHA `141c128a` (GitHub run 45404387684, technical PASS) compared directly with the private reference `Captura de tela 2026-11-17 093410(1).png`. The owner-provided reference shows a compact top-level status/action bar, calm editable central details and a separate right history/notes inspector. Its clinic-specific data and branding are NOT Infodive features.

| Area | Baseline gap | Severity | DS3 target | Acceptance |
| --- | --- | --- | --- | --- |
| Financial disclosure | "Valor estimado" displays stored `deal.value`, adjacent "Forecast" displays independent product sum; values differ without explanation | P1 (misleading decision) | Label each source; visible reconciliation warning; no auto-write on detail read; product calculator untouched | **PENDING final SHA browser audit** |
| Header and stage actions | 5 stage buttons + Edit/Duplicate/Close compete with deal title at desktop width | P1 | One accessible stage selector retaining current stage transition handlers and all actions; coherent density | PENDING |
| Opportunity subnavigation | 8 compressed tabs, history clipped in desktop evidence | P1 | Every tab visible in token-controlled responsive grid, keyboard-accessible | PENDING |
| Information hierarchy | Large financial/AI sidebar, duplicated timeline in primary section, 400px hardcoded inspector | P2 | Narrow token-controlled inspector with honest compact financial summary and real activity history; product/contact information remains in main | PENDING |
| Narrow layout | Opportunity detail only certified in desktop/light, mobile/dark not captured | P1 | Capture detail at desktop/mobile and light/dark, no clipping, full keyboard and WCAG | PENDING |

**Evidence discipline:** must update on the precise final commit; never transfer the reference screenshots or customer data to public GitHub. Local synthetic CI PASS does not certify aesthetic parity. Do not promote to production or merge automatically.

---

# UX RECOVERY PLAN — issue #214, continued after technical B4

**STATUS as of 2026-11-19: UX NOT ACCEPTED.** B1–B4 PRs #215–#218 merged, QA technically green, but owner rejected visual/nav uniformity in production. Do not create a new "B4 PASS" by merely rerunning the old test. This is a new acceptance phase on the same original CRM.

## 2026-11-23 ARCHITECTURAL PRIORITY (supersedes local retouch ordering)

The owner has redirected execution to a centrally configurable semantic Design System before additional aesthetic patches to individual modules. See docs/ux/DESIGN_SYSTEM_MIGRATION.md for architecture, tokens, migration matrix, compliance guardrails and honest status. Existing G0–G5 navigation/functional scopes remain valid but are now sequenced AFTER the DS core, and legacy modules are not accepted just because CI passes. PR #220 is a separate unmerged draft and should be reconciled after DS core stabilizes.


## G1–G2 source reconciliation, 2026-11-23

Current owner priority: central CSS configuration first. The original PR #220 has useful icon-rail/contextual sidebar, Pipeline board/list and compact KPI work, but its latest authenticated QA still FAILS in Pipeline detail. Port and reconcile these presentation patterns into the semantic core of #221, not copy ungoverned colors into modules. Reference images directly examined: `Captura de tela 2026-11-17 093344(1).png` and `093410(1).png`. Capture real post-integration QA on the final SHA before marking G1/G2 accepted. Hosted Supabase/production unchanged.


## Sequence: finish complete blocks, no PRs just to show activity
G0 — Recover baseline and architecture. Confirm the 19 user screenshots are readable from private Library; inspect real authenticated QA routes. Inventory routes, controls, states, screenshots and diffs. Resolve navigation/IA and component family plan. Create a scored, screenshot-linked gap matrix. The UX contract in CLINIA_VISUAL_CONTRACT.md is non-negotiable; UI/UX Pro Max may help decide details.
G1 — Global shell and navigation. Persistent icon rail, context menu, header, responsive navigation, route grouping without broken deep-links or permission leaks. Remove Design System from end-user main navigation. Evidence: actual screenshot and keyboard nav in multiple areas.
G2 — Commercial workspaces. Pipeline board/list, Leads, Contacts, Companies and opportunity drawer/product overlay. Use shared view toggle/filter, table/card grammar and preserve all deal calculations and actions. Evidence: screenshots of both views and drawer; functional contract unchanged.
G3 — Operational workspaces. Activities, contracts, sales/products/proposals, Service Desk, existing inbox and automation surfaces. Apply one composition vocabulary; do not fabricate missing chat or workflow features. Evidence: at least representative default + empty/modal + narrow viewport for each family.
G4 — Management. Reports/analytics, goals/commissions, integrations/settings, real loading/error/empty states; contextual navigation and consistent analytics density. Evidence: real dashboards with permitted synthetic data.
G5 — End-to-end comparative visual and functional acceptance. QA on SAME SHA for desktop/mobile and light/dark, side-by-side analysis against source screenshots, accessibility, permissions, functional regression, diff ledger with zero P0/P1 and documented P2. Publish a visual result matrix; only then request the human merge. Validate post-merge deployed SHA separately.

## Definition of done per route family
- Existing product capability and role/tenant scope correctly preserved; no new hardcodes, mocks, fake metrics, fake sends or silent actions.
- Screen matches the applicable observed patterns in the Clinia reference contract (structure, navigation, information hierarchy, filters, table/board, detail, states) without copying protected identity.
- Screenshot of the REAL authenticated QA view is captured, inspected and compared to the relevant reference; before and after linked to a precise SHA and QA deployment.
- WCAG AA and responsive/keyboard checks pass (axe incomplete != PASS), CI/tests/build pass on same HEAD; zero serious regressions.
- Human merge gate respected. QA and production must remain isolated; no production data in artifacts.

## Severity and tracking
P0: security/data leak, broken core action, inaccessible essential function; P1: area unusable or navigation/visual structure fundamentally inconsistent; P2: nonblocking mismatch with reference; P3: polish. No "100%" or "done" if any P0/P1 remains, even with green CI. Include actual route count and proof rather than a fluctuating score.

## Evidence matrix to maintain (fill with observed results, never guesses)
| Family | Source image group | Baseline QA | Implemented SHA | Functional QA | Visual comparison | Final acceptance |
|---|---|---|---|---|---|---|
| Shell/nav | all operational app captures | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| CRM board/list | CRM images | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| Opportunity detail | drawer/modal images | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| Inbox/chat | inbox/chat images | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| Analytics | stats images | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| Automations/agents | flow/agent images | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |
| Other modules | family-consistency contract | NOT YET CAPTURED | pending | pending | pending | NOT ACCEPTED |

## Execution discipline
- Do NOT ask owner to review micro-steps; diagnose and repair autonomously in cohesive implementation blocks.
- Only ask for genuine human gates (merge, paid resource, destructive production changes).
- No early certification; the agent must visit and visually inspect the actual UI, not only a static isolated component preview.
- Current phase is SOURCE-OF-TRUTH preparation only until human merge of PR #219. The next application implementation G0–G5 has a CONDITIONAL explicit authorization at the top of docs/codex/CURRENT_TASK.md; it activates after that human merge without a repeated owner prompt.
- Do not use product marketing screenshots to certify functionality that Infodive does not possess.
