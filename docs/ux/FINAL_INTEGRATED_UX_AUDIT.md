# Final integrated UX/UI audit — 25 November 2026

## Verified baseline
Main `63f02d5fb1aa910cb7bf3c0fa28829be049d4fca` has tree `97bdb6bbbc03ed86c7e5f32bcf488e037becd532`, identical to PR #223 certified head `d6a9dfa0`. CI 45642487460 and authenticated QA 45642487277 passed: 498 tests, 320 checks, 276 PNGs, 22 static dashboard routes, four roles, 1440px and 390px, light/dark. The results artifact was inspected; 12 original propagation cases (11 primitives) were limited to Leads, Contacts and Activities. The seven original debt categories report zero, not universal proof that every CSS expression is centralized.

## Findings and remediation
| Area | Observed gap | Candidate |
|---|---|---|
| Design system | Default Tailwind spacing scale lacked an explicit CRM primitive; command palette stylesheet contained local padding, gaps, icon dimensions, and monospace choice; compact icon buttons had local sizes. | Explicit spacing primitive, command tokens and existing control height tokens; preserve default values. |
| UI responsive coverage | Previous runner covered desktop/mobile only. | Real tablet matrix (768px, both themes, all 22 admin routes), same authentication and axe rules. |
| UX shell | Translated-out mobile sidebar remained in DOM without visibility exclusion; no modal focus isolation, Escape or explicit expanded state. | Hide closed drawer visually and from keyboard focus; inert background, modal semantics, focus return and resize handling; verify keyboard and axe in mobile/tablet. |
| UI feedback | Header bell showed a red dot with no event source or handler. | Disabled, explicit unavailable state, no fabricated unread indicator. |
| Design propagation | Three routes did not prove cross-module consumption. | Actual header, navigation, control, spacing and body font probes on all 22 admin routes in both themes and desktop/mobile/tablet; page title, header gap and KPI gap where those components exist. Preserve original 132 checks. |

## Remaining acceptance
This is a new candidate, not a passed audit. Require exact-head CI, all previous tests, new browser checks, screenshot inspection and issue #214 reconciliation. Compare all route families to privately retained 19 structural references; do not publish them. Verify every audit failure and distinguish missing functionality from UI defects. Four dynamic/public routes remain outside this authenticated static route inventory (root redirect, proposal editor by deal, portal and public token page); debug is not an end-user workspace. Existing independent PDF proof does not certify public token journeys. Connected Inbox, Service Desk, automation engine and real customer data are outside the authorized UX scope. No organization theme editor is implied. No hosted database, production deploy, permissions, financial logic or external integration changes. Merge human only.

Local git checkout is unavailable because github.com cannot resolve in the execution environment. Candidate source is read/written through GitHub objects and validated by the existing independent workflows.
