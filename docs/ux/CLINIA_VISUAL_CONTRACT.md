# Clinia-inspired visual and interaction contract — ORIGINAL Infodive CRM

Authority: user-supplied 19 visual screenshots, received 2026-11-19, archived privately as described in REFERENCE_MANIFEST.md. The screenshots are the source for observable UI patterns. UI/UX Pro Max is the supporting design-intelligence guide; if a generated generic palette/layout conflicts with a screenshot, prioritize this contract and document the tradeoff. The CRM is B2B, NOT a clinic product.

## Product-level principles
1. A user should always know where they are, what they can do here, the current state, and the next action.
2. One visual grammar: shared structure, page header, action hierarchy, tabs, filters, cards, tables, dialogs/drawers, statuses, typography and spacing. Distinct business behavior can have distinct content; arbitrary visual divergences cannot.
3. Compact visual density with legibility: subdued blue-gray/neutral surfaces, restrained borders/shadows, coherent spacing and readable text. No tiny uppercase labels as a substitute for hierarchy; no gratuitous decorative cards or competing accent colors.
4. Use Infodive identity and semantically named tokens. Do not copy Clinia logo, branding, layout assets, text, clinical-specific data, or code.
5. Progressive disclosure: global navigation for primary areas, contextual sub-navigation inside an area, details in drawers or subpages, not a flat 15+ entry menu. Both collapsed icon navigation and descriptive labels must remain accessible by keyboard and screen reader.
6. No invented features: Clinia web chat, WhatsApp inbox, AI-agent studio and flow canvas are REFERENCE FAMILIES, not implied Infodive capabilities.

## Canonical shell and navigation
- Desktop: slim persistent icon rail with tooltips and active indicator; optional second-level panel for area navigation (e.g. reporting, inbox, settings). A single content title/action bar. No duplicate global header + oversized local header.
- Mobile/tablet: coherent compact drawer/navigation, no content clipped or hidden behind sticky chrome; maintain predictable back and deep links.
- Consolidate/organize Dashboard, Comercial (Pipeline, Leads, Empresas, Contatos), Relacionamento (Atividades, Contratos), Receita (Vendas, Produtos, Tabelas, Propostas), Operação (Inbox if functional, Automação, Service Desk), Análises (Relatórios, Metas), Administração (Integrações, Configurações). Exact taxonomy is an IA decision to validate against real capabilities and permissions, NOT a directive to remove or merge features.
- Internal Design System page must not occupy the primary user navigation; developer-only access/navigation where appropriate.
- One action primary per workspace, secondary actions visually quieter; consistent feedback and loading/empty/error.

## Screen families
### CRM sales workspace: Pipeline, Leads, Contatos, Empresas
- Reference: screenshot of CRM board and list with icon rail, a slim tab row, Quadro/Lista toggle, compact filter chips and a clear Create action.
- Preserve commercial meanings and user data. Switch views without losing filtering state; one consistent search/filter/empty and sort/bulk language.
- Table density predictable; column labels, action placement and statuses consistent. Cards must not use a separate unrelated style.
- The screenshot's "patients" and procedure names are examples from Clinia, NOT Infodive entities.

### Opportunity detail
- Reference: wide, focused opportunity drawer over a dimmed kanban, main editable details left and right-side Historico/Tarefas/Notas inspector; related Add Product modal inside a coherent overlay workflow.
- Preserve deal stage transitions, financial calculations, currency behavior, product pricing and RBAC. Avoid duplicating detail fields in unrelated floating modals.
- Keyboard/focus management, close/discard/save states and scrolling must work.

### Inbox and chat
- Reference: left contextual navigation, middle conversation queue, right live conversation; filters, assignment/status, send composer and relevant linked actions.
- Internal chat reference: channels, search, favorites and threaded content with a stable composer.
- Use these patterns ONLY for capabilities that exist. Do not invent WhatsApp integration, messaging back-end or simulate real sends. Mark missing capabilities explicitly outside the UX acceptance contract rather than faking a module.

### Statistics / analytics
- Reference: icon rail + contextual report sidebar; coherent time/department/owner/channel filters, KPI summaries, subtle trends, consistent charts and lower analysis sections.
- Metrics must come from real authorized aggregates; never fake performance data, timeframe, comparisons or status to look like Clinia.

### Automations and AI-agent settings (where supported)
- Reference: consistent visual workflow editor canvas, readable nodes/edges and top-level status controls; agent configuration as contextual multi-section setup with a clear completion state.
- Apply only to already-implemented functional engines. If the CRM does not support a referenced interaction, document it as OUT OF SCOPE, not as a visual defect to be filled with fake buttons.

### Marketing/reference cards
- Large marketing grids and phone-rendered webchat are communication examples, not application shell requirements. Do not import landing-page CTAs or phone mockups into operational CRM layouts.

## Shared component contract
Define and reuse shell, PageFrame, PageHeader, ContextNav, ActionBar, FilterRow, StatsCard, DataTable, EntityCard, ViewSwitch, StatusBadge, SideInspector, Modal and Empty/Loading/Error states. Avoid per-module custom raw buttons, tiny 9px labels, hardcoded color classes and inconsistent corner radii. Retain semantic intent of special states.

## Responsiveness, accessibility and feel
Test at >= 360, 390, 768, 1024, 1440 and 1920 px as appropriate; light/dark; keyboard-only, visible focus, aria names, reduced motion, 4.5:1 text contrast where applicable, no loss of content. Use meaningful subtle motion only, no layout jumps or animation dependency.

## Not visual proof
CI green, E2E route pass, no axe violations, generated design preview, or a list of components imported are NOT a screenshot-to-screenshot assessment. For every area compare real rendered UI to matching target patterns on the same QA SHA. Maintain difference ledger with severity, owner, route and before/after evidence. A reviewer must be able to inspect the actual result without trusting a self-reported percentage.

## Negative acceptance examples
- 172 technical checks passed but sidebar is still one long menu => FAIL UX.
- Pipeline uses consistent buttons but opportunity detail and filters look like unrelated apps => FAIL UX.
- QA screenshots use mock fixtures and are declared equivalent to authenticated CRM => FAIL evidence.
- A fake WhatsApp inbox looks like a reference but sends nowhere => FAIL functionality.
- One module becomes elegant while the rest is stylistically inconsistent => FAIL system-wide acceptance.
