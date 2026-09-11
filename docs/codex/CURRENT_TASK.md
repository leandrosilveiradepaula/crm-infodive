# CURRENT_TASK.md

## Status

Active

## Objective

Perform a read-only repository verification of the current `present_in_usd` implementation after PR #9 and identify any remaining repository-side gaps before end-to-end smoke testing against a real environment.

This first task also validates the ChatGPT + GitHub + Codex control-plane workflow itself.

## Allowed scope

Read and inspect repository content related to:

- `present_in_usd` persistence contract and migration;
- `is_usd`, `exchange_rate`, and `present_in_usd` interactions;
- pipeline selector behavior;
- proposal display model;
- Web, PDF, DOCX, and PPT proposal paths;
- tests covering these areas;
- repository configuration needed to determine how migrations are expected to be applied.

Relevant historical commits/PRs may be inspected when useful, especially PRs #7, #8, and #9.

## Out of scope

Do not:

- edit source code;
- edit migrations;
- change tests;
- change dependencies;
- modify CI/CD configuration;
- alter authentication or authorization;
- alter financial calculations such as `deal.value` or commission;
- deploy anything;
- apply migrations to Supabase or any other database;
- connect to, modify, or expose external environments;
- create benchmark-specific hacks or hardcoded question-to-answer behavior.

## Implementation criteria

This is a read-only verification task. No implementation is authorized.

The verification must determine, from repository evidence:

1. whether the migration that introduces `deal_products.present_in_usd` exists and what schema contract it establishes;
2. whether repository code persists and normalizes `is_usd`, `usd_cost`, `exchange_rate`, and `present_in_usd` consistently;
3. whether proposal presentation only uses USD when `is_usd === true`, `present_in_usd === true`, and the exchange rate is finite and greater than zero;
4. whether invalid or inconsistent USD-display data falls back safely without inventing an exchange rate;
5. whether proposal display keeps BRL and USD totals separate;
6. whether monthly proposal presentation avoids annualizing the displayed amount;
7. whether Web, PDF, DOCX, and PPT follow the intended shared presentation path;
8. whether tests materially cover these contracts;
9. what, if anything, remains to be validated only in a real environment rather than from repository evidence.

## Mandatory tests

Because this task is read-only, start by inspecting the existing test suite and package scripts.

Run, when available and without causing external side effects:

- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `git diff --check`

If a command cannot be run in the Codex environment, report that as a blocker rather than claiming success.

Do not run commands that deploy, apply remote migrations, mutate external databases, or require secrets.

## Validations

Before inspecting:

- report current branch;
- report exact HEAD SHA;
- report `git status`.

During verification:

- cite exact file paths and relevant symbols/lines in the report;
- distinguish repository-confirmed facts from inferences;
- search for duplicated or unsafe exchange-rate conversion logic;
- verify that no `exchange_rate || 1` style fallback is used in proposal presentation;
- verify whether PPT is generated independently or inherits Web proposal rendering.

At completion:

- confirm whether the working tree is unchanged;
- report final `git status`.

## Risks

Pay special attention to:

- repository schema differing from the actual deployed Supabase schema;
- historical records with inconsistent `is_usd`, `present_in_usd`, or `exchange_rate` values;
- duplicated currency logic outside the shared proposal display model;
- differences between Web, PDF, DOCX, and PPT output paths;
- tests that merely mirror implementation without exercising business invariants.

## Commit rule

**Commit is NOT authorized for this task.**

Do not create a commit, branch for implementation, or pull request. If a code change is recommended, report it and wait for `CURRENT_TASK.md` to be updated with explicit authorization.

## Deploy rule

**Deploy and external-environment changes are NOT authorized.**

Do not apply migrations, change Supabase, deploy to Vercel, modify secrets, or perform any external mutation.

## Expected delivery format

Return a concise report with these sections:

1. Confirmed repository state — branch, HEAD, working tree.
2. Confirmed facts — repository evidence and test results.
3. Inferences — conclusions that are not directly observable.
4. Gaps/blockers — especially anything requiring a real environment.
5. Recommendations — ordered next actions.
6. Files changed — must be `none` for this task.
7. Tests/validations executed — exact commands and outcomes.
8. Commit/PR — must state `not created`.
9. Final `git status`.

If the Codex environment for this repository does not exist, stop immediately and report only that the repository needs a Codex Environment before execution can proceed.
