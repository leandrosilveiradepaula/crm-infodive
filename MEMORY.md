# MEMORY — CRM Infodive UX/UI source of truth

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
Update docs/codex/CURRENT_TASK.md with a scoped whole-block implementation authorization; complete baseline/audit; consolidate shell/navigation; commercial workspaces; operational workspaces; analytics and admin; final end-to-end visual acceptance against original references. Do not reopen previously merged PRs, and do not start an unrelated application.
