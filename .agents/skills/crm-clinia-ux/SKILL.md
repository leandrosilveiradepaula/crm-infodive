---
name: crm-clinia-ux
description: "Mandatory CRM Infodive UX and visual acceptance workflow. Use for every CRM screen, sidebar, navigation, dashboard, pipeline, drawer, modal, form, card, table, inbox, analytics, automation, responsive or accessibility design/review/change. Apply user-provided Clinia screenshots as reference, UI/UX Pro Max as decision support, real authenticated screenshot comparisons and evidence-based acceptance. Never mistake technical QA for visual approval."
---

# CRM Infodive — Clinia visual reference and acceptance

This skill is a project-local orchestration skill for the ORIGINAL Infodive CRM. Its purpose is to prevent the previously failed B1–B4 acceptance from recurring. It does not copy Clinia features or branding. It must be used together with repository governance, not instead of it.

## Before touching UI
1. Read AGENTS.md and the topmost docs/codex/CURRENT_TASK.md; verify task scope and clean branch.
2. Read MEMORY.md, docs/ux/CLINIA_VISUAL_CONTRACT.md, docs/ux/REFERENCE_MANIFEST.md, docs/ux/BASELINE_GAPS.md and docs/ux/UX_RECOVERY_PLAN.md.
3. Access the 19 actual Clinia screenshots from the user's private ChatGPT Library folder /CRM/UX Clinia - Referencias 2026-11-19, or the original conversation attachments. VISUALLY inspect the relevant images; do not substitute filenames or written summaries for image inspection. Never publish them into this public repo.
4. If this executor has no visual access, say exactly which sources are inaccessible and do not mark visual parity as PASS. Continue only with work that can be legitimately proven without reference images.
5. Execute the installed UI/UX Pro Max source skill using python3 .agents/skills/ui-ux-pro-max/scripts/search.py to query the relevant UX/domain and nextjs/react stack. The path is mandatory. If absent or broken, STOP the skill-dependent visual recommendation, diagnose the installation and never claim execution of absent tools.
6. Interpret general style recommendations against the photos and Infodive's existing brand. A generic landing-page pattern is NOT a CRM layout specification.

## For each route family
- Inventory actual existing route/state/action/role contract. Capture current authenticated QA browser view on the exact source SHA; do not browse production customer data for screenshots.
- Extract interaction hierarchy and composition from matching visual references (layout zones, nav, tabs, action hierarchy, density, table/board, drawer, icon style and colors). Make a concise source/current/target gap log with severity P0–P3.
- Implement a complete shared screen-family design: shared primitives, proper composition, responsive behavior, keyboard focus and real interactive states. Preserve all existing server actions, roles, currencies, tenant isolation, routing and business behavior.
- Do not implement "features" that exist only in Clinia screenshots. Inbox/chat, AI-agent settings, scheduling and flow canvas are reference patterns only where the CRM actually has corresponding capabilities.
- Run typecheck, lint, unit tests, build and functional E2E in permitted isolated QA. Capture ACTUAL authenticated browser screenshots at desktop/mobile, light/dark, relevant default/empty/modal states, and compare side-by-side with original references.
- Do not claim acceptance with merely green CI, accessibility axe/contrast, staged design preview, or 172 smoke assertions. Maintain evidence in docs/ux/UX_RECOVERY_PLAN.md and report specific unresolved visual gaps.
- Work in cohesive substantial PRs; do not open cosmetic micro-PRs. Human merges main. Do not deploy production or alter Supabase without explicit scoped authorization.

## Stop conditions
Stop the current visual acceptance claim (not necessarily every unrelated safe task) if: original references are not visually accessible, real QA browser cannot load relevant routes, results come only from mocks, P0/P1 unresolved, or SHA mismatch between evidence and candidate. Treat any one of these as NOT ACCEPTED.

## Evidence fields mandatory for an acceptance claim
Route family; screenshot reference filename and specific observed pattern; before/after QA screenshot link; git SHA; QA deployment ID; roles exercised; desktop/mobile and light/dark; actions/financial behavior preserved; manual comparison finding; axe/keyboard/functional outcomes; open discrepancy count and severity; reviewer and date.

## Priority
User screenshots > explicit Infodive feature contract > observed real QA behavior > UI/UX Pro Max suggestions > generic assistant aesthetic preference. Never copy protected Clinia source/assets or introduce hardcoded tenant/clinic data.
