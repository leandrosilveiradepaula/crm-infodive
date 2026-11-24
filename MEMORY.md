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
