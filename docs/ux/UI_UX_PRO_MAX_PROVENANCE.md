# UI/UX Pro Max intake, constraints and actual usage

Original private source: /CRM/UX Clinia - Referencias 2026-11-19/ui-ux-pro-max-skill-main.zip
Version declared by skill.json: 2.15.0; upstream project: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill; license: MIT. SHA-256 of uploaded ZIP: a80226887c19565bcbc79ccf5748b066be33fb46b3d244d41ffe650f192976a4.

The archive is a MULTI-SKILL SOURCE TREE with 13 SKILL.md entrypoints, including CLI-mirrored entries. It is not valid to report "the ZIP was installed as one ChatGPT skill". It must be split or a specific skill selected for an individual import; ChatGPT plugin/library registration is distinct from a repository-local agent skill.

Project policy: .agents/skills/crm-clinia-ux/SKILL.md orchestrates the project acceptance workflow. The official PRIMARY UI/UX Pro Max skill is installed separately in this repository at .agents/skills/ui-ux-pro-max (48 runtime source files copied from pinned upstream Git commit 2de1134dc4d1cfe112934611ae5803ae17a1bd7e; entrypoint adapted only for the project-local script path; LICENSE included). Run python3 .agents/skills/ui-ux-pro-max/scripts/search.py with the task-specific query and --domain/--stack, and inspect the output. No npm install is necessary. This is a repository-local skill accessible to code agents, not a global ChatGPT plugin installation, and it is not a repackaged upload of all 13 ZIP skill entries.

Representative commands actually run against the user-supplied archive during source-of-truth preparation:
- python3 <source>/scripts/search.py "B2B sales CRM operations dashboard dense clean neutral" --design-system --variance 3 --motion 2 --density 8 -p "Infodive CRM"
- python3 <source>/scripts/search.py "navigation overloaded sidebar progressive disclosure" --domain ux -n 4
- python3 <source>/scripts/search.py "enterprise CRM Next.js Tailwind dashboard layout" --stack nextjs -n 4

Observed recommendation: Minimalism/Swiss-style layout, enterprise density 8/10, subtle motion 2/10, clear focus/contrast and coherent grid. The generic search returned a marketing page pattern ("Product Demo + Features") unsuitable for a CRM OPERATIONS application; explicitly discard it. Its suggested palette is not an override of the user's Clinia screenshots or existing Infodive brand.

DO NOT run untrusted install scripts from an uploaded ZIP in CI, Vercel or production. Only install reviewed/pinned code in a development environment after validating its provenance. Upstream library information is supplementary; every screen must pass the direct screenshot reference contract and real QA.

Local CI correction: the vendored scripts/design_system.py had 46 trailing-whitespace lines normalized, without logic changes; consequently, 46/48 original runtime files are blob-identical (the other two are SKILL.md and design_system.py).
