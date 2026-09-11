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
