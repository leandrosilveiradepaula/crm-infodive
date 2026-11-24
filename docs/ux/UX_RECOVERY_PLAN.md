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
