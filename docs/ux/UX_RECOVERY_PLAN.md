# UX RECOVERY PLAN — issue #214, continued after technical B4

**STATUS as of 2026-11-19: UX NOT ACCEPTED.** B1–B4 PRs #215–#218 merged, QA technically green, but owner rejected visual/nav uniformity in production. Do not create a new "B4 PASS" by merely rerunning the old test. This is a new acceptance phase on the same original CRM.

## Sequence: finish complete blocks, no PRs just to show activity
G0 — Recover baseline and architecture. Confirm the 19 user screenshots are readable from private Library; inspect real authenticated QA routes. Inventory routes, controls, states, screenshots and diffs. Resolve navigation/IA and component family plan. Create a scored, screenshot-linked gap matrix. The UX contract in CLINIA_VISUAL_CONTRACT.md is non-negotiable; UI/UX Pro Max may help decide details.
G1 — Global shell and navigation. Persistent icon rail, context menu, header, responsive navigation, route grouping without broken deep-links or permission leaks. Remove Design System from end-user main navigation. Evidence: actual screenshot and keyboard nav in multiple areas.
G2 — Commercial workspaces. Pipeline board/list, Leads, Contacts, Companies and opportunity drawer/product overlay. Use shared view toggle/filter, table/card grammar and preserve all deal calculations and actions. Evidence: screenshots of both views and drawer; functional contract unchanged.
G3 — Operational workspaces. Activities, contracts, sales/products/proposals, Service Desk, existing inbox and automation surfaces. Apply one composition vocabulary; do not fabricate missing chat or workflow features. Evidence: at least representative default + empty/modal + narrow viewport for each family.
G4 — Management. Reports/analytics, goals/commissions, integrations/settings, real loading/error/empty states; contextual navigation and consistent analytics density. Evidence: real dashboards with permitted synthetic data.
G5 — End-to-end comparative visual and functional acceptance. QA on SAME SHA for desktop/mobile and light/dark, side-by-side analysis against source screenshots, accessibility, permissions, functional regression, diff ledger with zero P0/P1 and documented P2. Publish a visual result matrix; only then request the human merge. Validate post-merge deployed SHA separately.

### Current G1 evidence (2026-11-20)

The first G1 candidate is being developed on `codex/issue-214-ux-recovery-g1-shell`. It replaces the end-user's flat module list with an icon rail and route-derived contextual area navigation; the internal Design System route is intentionally absent from that navigation while its direct developer route remains unchanged. Focused source-contract tests and targeted lint passed locally.

Candidate `62c39d7dd5c32846176328701d7bceebeaa2a419` has two recorded GitHub Actions successes: validation run `44762570319` and isolated authenticated-local QA run `44762570326`. The latter produced 168 sanitized PNG captures and 172 checks across 42 authorized route/profile combinations (artifact `14642333538`). The evidence is explicitly **local-isolated**: its `results.json` has no Preview SHA or deployment ID, which is expected and must not be reported as deployed verification. The runner now also records the checked-out `candidateSha` in `results.json`, rather than relying only on an artifact name. Captures were produced; they are not a blanket visual PASS. Manual inspection recorded the shell/nav, Pipeline, Inbox, and Reports representatives. That inspection found the Pipeline KPI block too tall (P1, repaired in the next candidate), Inbox legitimately limited to its Office 365 connection state in this fixture, and Reports needing explicit no-data states instead of empty charts (repaired in the next candidate).

Follow-up candidate `b7d9b302990fc1046e252d2e1a14f90b59285e7c` has recorded successful validation run `44773625053` and successful isolated authenticated-local QA run `44773625104`. The QA job completed its isolated stack, real Next.js build, authenticated audit, sanitized-evidence upload, and cleanup steps. Artifact `14650125667` (SHA-256 `79c5acf381ae0592225de0425df85a4afc4a0af2cdda1973bd7320e2d32d1114`, 10,391,676 bytes, expires 2026-11-27) is bound to that exact SHA by the public Actions metadata. Its evidence remains **CAPTURED, NOT YET MANUALLY COMPARED**: download requires authenticated GitHub access and the available account is blocked by mandatory 2FA. Code comparison confirms that commits after the visual repair `bd48428` alter only evidence/E2E files and documentation; that is an inference about rendered continuity, not image inspection or visual acceptance.

The same candidate also begins the G2/G4 readability remediation: Pipeline period controls and deal-card metadata no longer rely on 8–10px all-caps text, and the visible report filters plus key organization settings labels use the shared compact-but-legible text scale. No commercial calculation, filter semantics, server action, credential, or settings persistence contract was changed. The remaining route families still require actual authenticated visual inspection before their respective acceptance claims.

The G3 pass now applies the same treatment to the visible metadata/status surfaces of Activities, Contracts, Automations and Integrations. These edits are limited to typography, spacing, semantic color tokens and border radii. They are not evidence of completion for those modules: default, empty, modal and narrow-viewport real QA captures remain required.

The visible Orders, Installments and Commissions tables now share that table-header and status treatment. Financial amounts, calculation logic, status transitions and actions were deliberately left unchanged. Real QA must still exercise their row expansion, upload/modal and narrow-viewport states.

The local authenticated QA workflow now retains a seven-day, sanitized screenshot artifact only for its disposable local stack. It is intentionally limited to fake tenants and users created during the run; it contains no cookies, traces, credentials, HTML or remote data. The artifact is evidence for same-SHA inspection, not automatic visual acceptance: each family must still be compared manually against the private references and recorded in the matrix below.

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
| Shell/nav | all operational app captures | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Earlier representative comparison incomplete; current artifact not opened | NOT ACCEPTED |
| CRM board/list | CRM images | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Pipeline density corrected; current artifact requires manual comparison | NOT ACCEPTED |
| Opportunity detail | drawer/modal images | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Not manually compared in current candidate | NOT ACCEPTED |
| Inbox/chat | inbox/chat images | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Fixture has no connected mailbox; no chat fabricated | NOT ACCEPTED |
| Analytics | stats images | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | No-data repair requires current-artifact comparison | NOT ACCEPTED |
| Automations/agents | flow/agent images | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Not manually compared in current candidate | NOT ACCEPTED |
| Other modules | family-consistency contract | New local-isolated evidence uploaded | `b7d9b30` | Run `44773625104` passed | Not manually compared in current candidate | NOT ACCEPTED |

## Execution discipline
- Do NOT ask owner to review micro-steps; diagnose and repair autonomously in cohesive implementation blocks.
- Only ask for genuine human gates (merge, paid resource, destructive production changes).
- No early certification; the agent must visit and visually inspect the actual UI, not only a static isolated component preview.
- Current phase is SOURCE-OF-TRUTH preparation only until human merge of PR #219. The next application implementation G0–G5 has a CONDITIONAL explicit authorization at the top of docs/codex/CURRENT_TASK.md; it activates after that human merge without a repeated owner prompt.
- Do not use product marketing screenshots to certify functionality that Infodive does not possess.
