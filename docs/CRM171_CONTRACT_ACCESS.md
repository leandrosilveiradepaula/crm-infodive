# CRM #171 — Contract access and query scalability

Journey V2: `88e94d11-4ada-4630-aa6a-fbf2c5665b2b`; immutable source `fea4669258fcd832c7e187e7b00c1c5fb4d90a76`.

## Verified source divergence

The issue described a large `.in('deal_id', visibleIds)` request, but source `ContractService.getContracts` no longer had it. It instead read all tenant contracts with a service-role client, without checking the caller's owner role. The service-role client bypasses user RLS.

## Candidate

The server action derives user ID and organization from the active session and authoritative profile. The service checks current role; admin/manager can list tenant contracts, and `vendedor` lists only contracts joined to deals belonging to that user and tenant. No client-owned ID list is transmitted. Ordering is descending by `created_at` and then `id`. Mutations recheck the current profile, tenant and referenced deal ownership; seller mutations without an authorized deal are denied.

## Important outstanding verification

This candidate is a **draft**. Verify PostgREST's `deals!inner` relationship and `visible_deal` filter against the deployed CRM schema. Confirm whether contracts without deals should be visible to sellers (currently denied), whether existing business roles need additional permissions, and whether server-side contract mutation permissions are stricter than the intended product policy. Run Vitest, TypeScript, build, CI on the exact SHA and authenticated Preview; do not merge or deploy to production until these checks pass. Tests currently use mocks and do not prove database-level SQL execution, cross-tenant FK enforcement or performance. The source migration contains a `contracts.deal_id -> deals.id` FK, but a deployed schema check is still required. No migration or live data change is authorized by this PR.

## Known limitations

The current listing does not implement explicit page/window parameters. It uses a relational filter to avoid giant IN lists, but a full performance/pagination evaluation is still needed. Cross-table authorization for service-role reads is enforced by server code, not user RLS. Failures must not be represented as complete results.
