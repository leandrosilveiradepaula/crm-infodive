# UI/UX Pro Max v2.15.0 — project-local vendor provenance

Original repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Pinned Git commit: 2de1134dc4d1cfe112934611ae5803ae17a1bd7e
Original path: .claude/skills/ui-ux-pro-max/
Project-local path: .agents/skills/ui-ux-pro-max/
License: MIT (LICENSE copied from the upstream repository).

This folder vendors the PRIMARY UI/UX Pro Max skill only (48 non-test runtime files). The user-provided ZIP contains additional skills, CLI assets and test copies and was NOT imported as a single ChatGPT plugin. The upstream SKILL.md was adapted only by replacing the Claude-specific CLAUDE_PLUGIN_ROOT path with the project-local .agents/skills/ui-ux-pro-max path. All other runtime files retain the upstream text. No remote runtime install is needed.

Validation command from the root of crm-infodive:
  python3 .agents/skills/ui-ux-pro-max/scripts/search.py "B2B sales CRM operations dashboard dense clean neutral" --design-system --variance 3 --motion 2 --density 8 -p "Infodive CRM"
  python3 .agents/skills/ui-ux-pro-max/scripts/search.py "focus keyboard navigation" --domain ux -n 4
  python3 .agents/skills/ui-ux-pro-max/scripts/search.py "dashboard navigation" --stack nextjs -n 4

Before each UI change also read the user-specific mandatory contract at docs/ux/CLINIA_VISUAL_CONTRACT.md and call the CRM-specific orchestration skill at .agents/skills/crm-clinia-ux/SKILL.md. Do not substitute generic generator output for the screenshot-based requirements. Never place Clinia source screenshots in the public repository.
