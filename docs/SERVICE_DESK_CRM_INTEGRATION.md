# CRM #200 / Service Desk #12 — Shared CRM module integration

## Architectural authority

**CRM Supabase `mpmhmjepmmpxbsmekldf` is the only production source of truth.**
Service Desk is an embedded CRM module; it does not own Supabase Auth,
profiles, companies, contracts, organizations, passwords or independent tenancy.

- Identities: `auth.users` + active `public.profiles` on CRM.
- Customers: `public.accounts` IDs, never copied.
- Contracts: `public.service_contracts` IDs and their account+organization.
- Tenant authority: server-rechecked CRM profile; DB function
  `crm_internal.current_organization_id()` for user-scoped RLS.
- Module data: `service_desk.*` in the **same** PostgreSQL database.
- Host: CRM Next.js route `/service-desk`; no Service Desk Vercel or key.
- External isolated QA DB `jbswryivihaxcrhnzkpl` remains paused and is not an operational dependency.

## Candidate deliverables and protection

`supabase/migrations/20261027123000_service_desk_crm_module.sql` is **not
applied**. Its preflight explicitly rejects missing CRM table/function contracts
or existing module schema. It never modifies `public.service_contracts`.
The module schema is private with RLS enabled and no `anon`/`authenticated`
table grants. The only public-facing entrypoints are **service-role-only**
reviewed RPCs; Next.js server actions first verify CRM session and current
profile role and organization and then invoke those RPCs. Database triggers
revalidate active requester, assignee, client, contract and tenant, including
when privileged callers bypass RLS. The ticket transitions are explicitly
enumerated with old-status compare-and-swap.

This is an additive **first integration slice**, not a claim that
legacy Service Desk's SLA automation, knowledge editing, attachments,
full ticket lifecycle and every old UI screen have already been ported.
Tables for these areas are namespace-isolated but operations beyond
tickets remain disabled pending their own reviewed authorization.

## Pre-production acceptance and rollback

1. Review migration against current live CRM schema, ensure backup and
   explicitly approve applying CRM production migration in a separate gate.
   No mass replay of old Service Desk `public` migrations.
2. Run `npm ci && npx tsc --noEmit && npm test && npm run build` on PR SHA.
   Run dedicated disposable PostgreSQL 16 negative tests after CI fixture
   and full SQL parser verification; passing source tests alone is not E2E.
3. Validate the same CRM Supabase Auth identities, cross-org RLS, profile
   revocation, client and contract lookup, create/list/transition tickets,
   conflict on stale status and existing CRM regressions.
4. Require Vercel exact-SHA Preview and authenticated browser evidence on
   this CRM build before human production merge.
5. Only after approved schema and functional Preview: human merge/cutover,
   release observation, and optional reversible retirement of old QA project.
   No autonomous production migration, env cutover or deletion.

**Rollback:** remove embedded route from next code release, leave additive
module tables isolated until an explicit reviewed data decision; avoid
automatic destructive DDL. Keep CRM's prior production artifact reference.

**Factory certification:** this candidate does not set
`product_ready=true`, does not revive F6/PR #10 and does not claim the
Factory executed the code itself. The legacy lineage remains historical
evidence; new CRM integration needs its own SHA, CI and browser receipts.
