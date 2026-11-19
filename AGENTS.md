# AGENTS.md

## Purpose

This file contains permanent repository-level instructions for coding agents working in this project. Task-specific requirements belong in `docs/codex/CURRENT_TASK.md`, not here.

## ChatGPT + GitHub + Codex governance

GitHub is the shared control plane between ChatGPT, Codex, and maintainers.

Before doing any work, Codex must:

1. Read this `AGENTS.md` completely.
2. Read `docs/codex/CURRENT_TASK.md` completely.
3. Verify and report the current branch, HEAD commit, and working-tree status before editing anything.
4. Confirm that the requested work fits the scope authorized in `CURRENT_TASK.md`.

During work, Codex must:

- Respect the authorized scope strictly.
- Avoid unrelated refactors, cleanup, formatting changes, dependency changes, or edits to files not required by the task.
- Never change external environments, deploy, run remote migrations, modify production data, or perform other external side effects unless `CURRENT_TASK.md` explicitly authorizes them.
- Execute the tests and validations required by `CURRENT_TASK.md`, plus any narrowly relevant checks needed to support truthful conclusions.
- Never claim to have reviewed, executed, tested, validated, deployed, or verified something that was not actually reviewed, executed, tested, deployed, or verified.
- Never expose secrets, tokens, credentials, private keys, connection strings, or sensitive environment values in code, logs, comments, issues, pull requests, or reports.
- Never invent requirements when information is missing or ambiguous. Stop and report the missing decision instead of guessing.
- Do not implement question-to-hardcoded-answer mappings, lookup tables of old answers, benchmark-specific hacks, or test-only shortcuts. Changes must improve the general capability and correctness of the project.

## Git discipline

- Do not make a commit unless `docs/codex/CURRENT_TASK.md` explicitly authorizes commits for the current task.
- Do not create or update a pull request unless the current task authorizes it.
- Do not force-push, rewrite shared history, delete branches, or perform destructive Git operations unless explicitly authorized.
- Keep commits scoped to the current task.
- Before any authorized commit, review the final diff and confirm that no unrelated files are included.

## Required completion report

At the end of each Codex run, report clearly:

- branch and HEAD;
- files changed, or an explicit statement that no files changed;
- concise diff summary;
- tests and validations actually executed, with results;
- known risks, assumptions, blockers, and unresolved questions;
- whether a commit or PR was created, including SHA/PR number when applicable;
- final `git status`.

Differentiate explicitly between:

- **Confirmed fact**: directly observed in the repository, command output, test result, or authorized external system.
- **Inference**: conclusion derived from confirmed facts but not directly observed.
- **Recommendation**: proposed next action or design choice.

## Scope ownership

`AGENTS.md` is permanent governance. Do not place temporary task details, one-off implementation instructions, benchmark-specific values, temporary branch names, or short-lived acceptance criteria here.

`docs/codex/CURRENT_TASK.md` is the authoritative description of the current task and may change from task to task.


## Mandatory CRM UX/UI recovery contract (19 November 2026)

For ANY work that changes the CRM's appearance, navigation, interaction, page composition, or visual acceptance:

1. Read MEMORY.md, docs/ux/CLINIA_VISUAL_CONTRACT.md, docs/ux/REFERENCE_MANIFEST.md and docs/ux/UX_RECOVERY_PLAN.md before proposing or editing a UI file.
2. Invoke the project skill at .agents/skills/crm-clinia-ux/SKILL.md and use the project-local UI/UX Pro Max skill when available. Never claim a skill was executed if its tool/script was not actually run.
3. Treat the privately archived user-provided Clinia screenshots as the PRIMARY visual reference, not generic SaaS design suggestions. Borrow interaction and layout principles, NOT the Clinia brand, code, text, imagery or medical-specific features.
4. Preserve Infodive CRM's B2B product domain, data, permissions, server actions, financial logic, integrations and tenant isolation. Do not turn the CRM into a clinical product. Do not invent non-existent WhatsApp, agent, workflow or scheduling functionality.
5. Require a documented information architecture, a shared screen-family contract, current-vs-target comparison and visual evidence from authenticated, synthetic QA before accepting a redesigned module. Axe, TypeScript, builds, responsive checks and E2E smoke are necessary, NEVER sufficient for a UX/UI completion claim.
6. Capture real application screenshots for each critical screen family on the SAME tested SHA and authenticated QA deployment, across light/dark and desktop/mobile, with references and annotations of material divergences. An image not actually inspected is NOT accepted as proof. Never capture or publish private production customer data.
7. The owner has rejected the former B1–B4 result as visual acceptance despite the technical QA PASS and merge of PRs #215–#218. Treat those PRs as a technical baseline, NOT the approved visual target. Do not mark issue #214 done for UX until this contract is satisfied.
8. Work in cohesive end-to-end implementation blocks, not cosmetic micro-PRs or repeated prompts for "prossiga". Human merge is the only default handoff gate. Never merge to main or deploy to production automatically.
9. Maintain docs/ux/UX_RECOVERY_PLAN.md and MEMORY.md with observed proof, actual SHA, routes covered, and unresolved discrepancies. Never advance status solely on CI green; require functional, visual and product acceptance separately.
10. The source ZIP (UI/UX Pro Max) and 19 reference screenshots are retained in private ChatGPT Library at /CRM/UX Clinia - Referencias 2026-11-19. This public GitHub repository must not contain copies of the third-party screenshots, personal CRM data, or secrets. A fresh executor without Library access must explicitly state that reference images are not directly available and cannot assert visual equivalence.

Historical CURRENT_TASK sections do not override the current topmost authorized task. Record a new scoped CURRENT_TASK section before editing the application, preserving old tasks as history.
