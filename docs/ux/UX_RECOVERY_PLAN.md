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
