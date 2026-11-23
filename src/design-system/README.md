# Infodive CRM Design System core

**Default visual values live in one file:** tokens.css (colors, light/dark, typography, radii, shadows, gradients, spacing, control sizes). src/app/globals.css imports it.

### Layers
- Configurable primitives: --ds-base-*, --ds-font-family-*, --ds-type-*, --ds-shadow-*, --ds-gradient-*, --ds-card-*, --ds-control-*.
- Semantic aliases: --background, --primary, --surface, --success-readable, --stage-won, etc. Existing modules keep functioning while they migrate.
- Tailwind v4: @theme inline translates the aliases to semantic utilities, with no duplicate hardcoded values in a JavaScript theme.
- Components: Typography, Button, Card, Input, Table, Dialog and PageHeader consume tokens.
- Domains: semantic special states (sales stage, success, error) can have roles; no feature gets its own ungoverned palette.

### Examples
- Primary color: edit --ds-base-primary in :root and .dark. Every bg-primary consumer updates.
- Page heading: edit --ds-type-page-title-size. Typography variant="pageTitle" follows.
- Panel radius: edit --ds-base-radius-panel. All consumers of var(--radius-panel) update.
- Financial gradient: edit --ds-financial-start/--ds-financial-end, never local "from-blue-50".
- Shared component heights: edit --ds-control-height-default.

### Status and exclusions
This initial core does NOT mean all legacy screens are migrated. The authoritative matrix and exit criteria are in docs/ux/DESIGN_SYSTEM_MIGRATION.md. The new guard prevents INCREASES while the reporter exposes remaining debt. Never declare global completion from these core files or from a green CI run alone.

This change is source-controlled configuration. It does NOT implement a production-facing theme editor, per-tenant runtime CSS overrides, any new Supabase setting, or new font-file licensing. Those need a separate gated implementation with validation and rollback.
