# CRM Infodive — centralized Design System migration (2026-11-23)

**Goal:** a visual configuration changes the entire ORIGINAL CRM without modifying individual pages. This strategy supersedes "make each module look right" as the immediate UX implementation priority. Do not change business logic, routes, permissions, tenant isolation, data or external integrations.

## Architecture and sources
- **Single file for default visual VALUES:** src/design-system/tokens.css.
- **Configurable primitives:** --ds-base-* for both themes, --ds-font-family-*, --ds-type-*, --ds-shadow-*, --ds-gradient-*, --ds-card-*, --ds-control-*, --ds-page-header-*.
- **Semantic compatibility aliases:** --background, --foreground, --primary, --surface, --success-readable, --destructive, --stage-* etc. They always refer to primitives; change the primitive, not the consuming module.
- **Tailwind 4 adapter:** @theme inline in that same token file exposes bg-primary, text-foreground, semantic text roles, and shadow-control-ui. src/app/globals.css imports it and contains only global resets, application utilities and shared focus behavior.
- **Primitives:** Typography and existing Button/Card/Input/Table/Dialog/PageHeader consume semantic roles. Feature-specific exceptions must be justified, named, reviewed and registered. No anonymous local palettes or gradients.
- **Themes:** :root and .dark override primitive VALUE pairs on the document root. Theme preference and login already exist; do NOT silently change user/organization persistence while migrating UI.
- **Future admin palette editor:** implement ONLY after permissions, schema and publication gates are scoped separately. It must submit typed allowlisted primitive values, validate both light/dark contrast, preview before publish, reject unknown CSS, version settings and support rollback. No arbitrary CSS in user input.

### How to reconfigure the visual core
Edit the appropriate --ds-base-* or --ds-type-* variable in src/design-system/tokens.css, not in pages. Example: a different --ds-base-primary changes all bg-primary and text-primary usages; --ds-type-page-title-size changes all Typography variant="pageTitle"; --ds-highlight-start changes all ds-panel-highlight. If a page is unaffected, that page is not yet migrated or is an approved domain exception.

**No new colors are prescribed by this program.** Current brand values are carried forward from globals.css. Dark mode values are preserved. New aliases use existing semantic colors.

## Verified migration inventory baseline — 2026-11-23

GitHub Actions run [45239400879](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45239400879), candidate SHA 6fd9d5901f29d5020f461e7665185ee9c84ff629:
- TypeScript, unit tests, Next.js build, synthetic WCAG A/AA for desktop/mobile + light/dark, git diff check and design-token non-regression check: **PASS**.
- **196 files** have **5,536 occurrences** in categories inventoried by scripts/report-design-system-debt.mjs.
- **11 changed UI files**, **zero increases** of guarded local style decisions against main.
- Includes local font-size classes, raw color palettes, gradients, radius and shadow classes; a regex occurrence is NOT necessarily an independent bug. This is a migration-debt measurement only, not UX approval.

| Family | Files with remaining occurrences | Occurrences |
|---|---:|---:|
| Comercial | 68 | 1,791 |
| Analytics and admin | 31 | 1,116 |
| Pipeline and drawers | 24 | 1,237 |
| Operation | 18 | 511 |
| Shell and Dashboard | 15 | 161 |
| Shared components | 15 | 53 |
| Other | 25 | 667 |
| **Total** | **196** | **5,536** |

Recalculate on the final SHA after each migration block using npm run design-system:inventory and attach node scripts/report-design-system-debt.mjs --markdown output. Do not blindly replace all matches: classify semantic role, behavior and justified exceptions before migrating. The core PR does NOT eliminate the 196-file backlog.

## Phases and actual status
| Family | What must be migrated | Current candidate state | Required QA |
|---|---|---|---|
| DS0 Central core | primitive color pairs, fonts, type, radius, shadows, gradients, spacing, Tailwind mapping | Implemented in candidate branch; CI not yet certified | token contract tests and theme inversion |
| DS1 Shared components | Typography, Button, Card, Input, Table, Dialog, PageHeader and other primitives | Partially migrated in candidate | snapshot, role/keyboard and WCAG checks |
| DS2 Shell/nav | all nav, headers and layout including #220 work | **PENDING** (#220 remains separate draft) | mobile/desktop, collapsed, both themes |
| DS3 Pipeline | Board, cards, tables, drawer, financial panels and dialogs | ViewDealModal partially migrated; board/card not certified | board/list, editing, finance, mobile |
| DS4 Commercial | Leads, contacts, companies, proposals, sales, products, price tables | PENDING | real authenticated actions |
| DS5 Operation | Inbox, activities, contracts, automations, Service Desk | PENDING | functional states and permission coverage |
| DS6 Analytics/admin | Reports, KPI/graphs, integrations, goals, settings | PENDING | chart statuses, data and theme comparison |
| DS7 Global acceptance | no remaining hardcodes except documented exceptions | PENDING | one core change propagates to ALL migrated families |

The earlier owner-reported estimate (~106 files) was replaced by the measured baseline below; future totals must be recomputed from the exact SHA. Run:
- npm run design-system:inventory — summary by screen family and top files.
- node scripts/report-design-system-debt.mjs --markdown — complete per-file migration matrix. Record verified totals, diff and completed routes against actual SHA rather than inventing a counter.
- npm run lint:design-system — fail if the current branch introduces new local design decisions compared with its merge base.

## Policy
**Allowed:** grid/flex positioning, responsive behavior, overflow, structural widths, existing semantic colors/tokens, shared primitives. **Forbidden in newly written UI:** color names like bg-blue-500, literal hex, local background gradients, text-[9px], new arbitrary font scales, rounded-xl/shadow-lg as a component-specific decision. Exceptions (e.g. an external partner icon or chart-required data scale) must have a documented semantic role, read-only mapping and justification; do not suppress a real accessibility issue.

The automated guard tracks increases per file and category against the baseline commit. Existing debt is permitted during migration only if it does not increase. This is an interim migration safeguard, NOT proof that the remaining existing violations are acceptable. Once migration is complete, zero unauthorized occurrences is the hard gate.

## Prove centralization
On the SAME candidate SHA, temporarily modify ONLY the DS core: primary color, font, page title scale, control/card radius, and highlight gradient. Rebuild and capture authenticated synthetic QA across shell, Pipeline/drawer, commercial, operation and analytics on mobile/desktop and light/dark. The resulting changes must propagate without edits in modules. No P0/P1, correct contrast and keyboard behavior. Restore final intended values and repeat regression on the final SHA. Until this passes, "Design System centrally configurable" is a PARTIAL technical claim.

## Hard gates and boundaries
No Supabase migrations, SQL, theme schema writes, production Vercel deploy, RBAC changes, API/server-action edits, integration updates, paid services or automatic main merges. Admin configurator is a separate authorization and security project, not included in the CSS core candidate. Treat PR #220 as a separate G1 UX draft and reconcile it after the DS core stabilizes, do not merge it merely because its E2E was green.
