# CRM #171 — Contract access and query scalability

Journey V2: `88e94d11-4ada-4630-aa6a-fbf2c5665b2b`; immutable source `fea4669258fcd832c7e187e7b00c1c5fb4d90a76`.

## Verified source divergence

The issue described a large `.in('deal_id', visibleIds)` request, but source `ContractService.getContracts` no longer had it. It instead read all tenant contracts with a service-role client, without checking the caller's owner role. The service-role client bypasses user RLS.

## Candidate

The server action derives user ID and organization from the active session and authoritative profile. The service checks current role; admin/manager can list tenant contracts, and `vendedor` lists only contracts joined to deals belonging to that user and tenant. No client-owned ID list is transmitted. Ordering is descending by `created_at` and then `id`. Mutations recheck the current profile, tenant and referenced deal ownership; seller mutations without an authorized deal are denied.

## Important outstanding verification

This candidate is a **draft**. Verify PostgREST's `deals!inner` relationship and `visible_deal` filter against the deployed CRM schema. Confirm whether contracts without deals should be visible to sellers (currently denied), whether existing business roles need additional permissions, and whether server-side contract mutation permissions are stricter than the intended product policy. Run Vitest, TypeScript, build, CI on the exact SHA and authenticated Preview; do not merge or deploy to production until these checks pass. Tests currently use mocks and do not prove database-level SQL execution, cross-tenant FK enforcement or performance. The source migration contains a `contracts.deal_id -> deals.id` FK, but a deployed schema check is still required. No migration or live data change is authorized by this PR.

## Known limitations

The listing now retrieves bounded 500-row pages with stable created_at/id ordering and ID deduplication, but this is not a snapshot-isolated cursor: concurrent inserts/updates can shift offset pages. Verify deployed PostgREST max-rows behavior, query plans and whether a database-side cursor or keyset pagination is needed. Tests use mocks only, not a real database. Mutation authorization is checked before the service-role write; concurrent ownership changes are not transactionally locked, so a database-side atomic authorization boundary is still needed for strict race-free enforcement. Cross-table authorization for service-role reads is enforced by server code, not user RLS. Failures must not be represented as complete results.


## Independent read-only verification and remaining boundaries — 30/10/2026

The CRM managed database has a contracts.deal_id foreign key to deals.id,
both tables have RLS enabled and the contracts_deal_id_idx exists. The
source query shape has a valid relational key, but inspection alone is not
an authenticated PostgREST request or Preview E2E. At inspection time,
four contracts had no deal association, none had null created_at, and no
cross-tenant deal reference was observed. Seller access to these legacy
unowned contracts intentionally fails closed; business-role semantics
still require independent validation.

The candidate now uses keyset pages of 500 ordered by created_at/id;
null sort keys and duplicate IDs produce explicit errors, and Server
Actions no longer turn denied/failed reads into empty successful lists.
Update/delete compare-and-set the previously authorized deal reference
and reject zero affected rows; proposal links require the same tenant.

Not certified: production-scale composite index/query plan, PostgREST
schema cache, authenticated Preview, and transactionally atomic seller
authorization under ownership changes. The existing service-role
prechecks cannot eliminate all TOCTOU races without a DB-side boundary.
Changes to schema, RLS, data, cost, Preview and production are not part
of this scoped commit.
