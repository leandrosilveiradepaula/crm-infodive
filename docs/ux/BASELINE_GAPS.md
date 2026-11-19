# Static code reconnaissance — why B4 did not solve product UX

Observed in main at c04754c9fc9a2800f8cfb34a8db75ac92dd7ec78, before any new UI implementation:

- Sidebar.tsx has direct links for Dashboard, Pipeline, Leads, Companies, Contacts, Activities, Contracts, Service Desk, Sales, Inbox, Automations, Reports, Integrations, Products, Price Lists, Goals, Settings and Design System. This is a long flat navigation, not the contextual two-level architecture visible in the reference.
- PageHeader, FilterBar and StatsGrid were shared in multiple pages, but the page-local compositions still diverge (different raw controls, custom typography, spacing and statuses). Shared imports do not equal consistent UX.
- Pipeline client-page retains tiny 9/10 px text utility classes and oversized local tracking/font weights alongside fixed-width modal/kanban parts. It has no validated parity with the reference list/board and dual-panel opportunity detail.
- Activities, Contracts, Reports, Automations and Settings client pages retain many local 9/10/11 px labels, font-black usage or ad hoc rounded surfaces; inspect rendered states before changing, do not use raw regex counts as proof of actual defects.
- The Design System route is visible in end-user primary sidebar despite being a developer-only catalog.
- B4 E2E/axe checked technical/semantic accessibility in an authenticated QA environment. It did not set a Clinia-specific visual comparator or an information-architecture acceptance gate.

Status: THESE ARE STARTING INVESTIGATION TARGETS, not a claim that every route currently fails. Each discrepancy must be reproduced, severity-scored and resolved in authenticated QA with screenshots. See UX_RECOVERY_PLAN.md.

Do not make a new PR merely to update styling of a few buttons or change declarations in tests. Fix the route family in one cohesive functional and visual block with evidence.
