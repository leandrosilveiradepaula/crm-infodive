## DS4 compatibility and verified propagation (2026-11-24)

**One source of truth:** edit values in `src/design-system/tokens.css`, never in a feature screen. The `@theme inline` compatibility bridge maps both new semantic classes and remaining Tailwind built-ins (`text-sm`, `text-lg`, `rounded-lg`, `shadow-md`) to `--ds-*` primitives. This bridge means a source value can propagate to old pages without falsely marking those pages fully migrated.

**For KPI cards:** feature screens now pass `tone: 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral'`, defined once in `src/design-system/stat-tones.ts`. Do not pass raw `color`, `gradient` or `border` class strings to `StatsGrid`. Shared card geometry is configured via `--ds-stat-*` values.

**Automated acceptance:** `test/e2e/run-authenticated-smoke.mjs` temporarily changes and restores nine primitives in authenticated, isolated Leads, Contacts and Activities views, on desktop/mobile and light/dark. The probe verifies actual computed color, page-title size, panel radius, card shadow, body font, highlight gradient and legacy utility changes. `scripts/check-design-token-policy.mjs` rejects any measured hardcode in twelve fully migrated cross-family components. Global debt across remaining modules is separately listed by `npm run design-system:inventory`. These gates are technical proofs; human UX review remains necessary.

**User-vs-org theme:** individual light/dark preference exists; organization-wide default theme **does not yet persist**. The settings panel is now explicit instead of falsely confirming an unimplemented save. That capability requires separate schema, RBAC and contrast/rollback authorization. No per-tenant theme editor is delivered by this block.

---

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
