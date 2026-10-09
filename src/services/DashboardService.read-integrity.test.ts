import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DashboardService } from './DashboardService';

type Result = { data: unknown; error: { message?: string } | null };
type Query = {
    table: string;
    filters: Array<[string, unknown]>;
};

function database(responses: Record<string, Result | Result[]>) {
    const operations: Query[] = [];
    const queues = new Map(Object.entries(responses).map(([key, value]) =>
        [key, Array.isArray(value) ? [...value] : [value]]
    ));
    const from = vi.fn((table: string) => {
        const operation: Query = { table, filters: [] };
        operations.push(operation);
        const take = (): Result => {
            const queue = queues.get(table);
            return queue?.length ? queue.shift()! : { data: [], error: null };
        };
        const builder = {
            select() { return builder; },
            eq(column: string, value: unknown) { operation.filters.push([column, value]); return builder; },
            in(column: string, value: unknown) { operation.filters.push([column, value]); return builder; },
            order() { return builder; },
            limit() { return builder; },
            maybeSingle: async () => take(),
            then(resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(resolve, reject);
            },
        };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations };
}

describe('DashboardService tenant and read integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('refuses to report fake zero revenue when the deal metrics query fails', async () => {
        database({
            profiles: { data: { role: 'admin', roles: [] }, error: null },
            deals: { data: null, error: { message: 'database unavailable' } },
        });
        await expect(DashboardService.getDashboardMetrics('admin-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar os indicadores do dashboard.');
    });

    it('does not disclose other owners deals through the dashboard summary', async () => {
        const db = database({
            profiles: { data: { role: 'vendedor', roles: [] }, error: null },
            deals: { data: [], error: null },
        });
        await expect(DashboardService.getDashboardMetrics('seller-a', 'tenant-a'))
            .resolves.toMatchObject({ totalDeals: 0 });
        const dealRead = db.operations.find(op => op.table === 'deals');
        expect(dealRead?.filters).toContainEqual(['owner_id', 'seller-a']);
        expect(dealRead?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('does not mask failed responsible-person lookups as valid metrics', async () => {
        database({
            profiles: [
                { data: { role: 'admin', roles: [] }, error: null },
                { data: null, error: { message: 'profile lookup failed' } },
            ],
            deals: { data: [{ id: 'deal-a', owner_id: 'seller-a' }], error: null },
        });
        await expect(DashboardService.getDashboardMetrics('admin-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar os responsáveis.');
    });

    it('limits recent deals to the current owner and refuses malformed reads', async () => {
        const db = database({
            profiles: { data: { role: 'vendedor', roles: [] }, error: null },
            deals: { data: null, error: { message: 'database unavailable' } },
        });
        await expect(DashboardService.getRecentDeals('seller-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as oportunidades recentes.');
        expect(db.operations.find(op => op.table === 'deals')?.filters).toContainEqual(['owner_id', 'seller-a']);
    });

    it('never reports recent deal account names from a failed account lookup', async () => {
        database({
            profiles: [
                { data: { role: 'admin', roles: [] }, error: null },
                { data: [{ id: 'seller-a', full_name: 'Seller A' }], error: null },
            ],
            deals: { data: [{ id: 'deal-a', owner_id: 'seller-a', account_id: 'account-a' }], error: null },
            accounts: { data: null, error: { message: 'database unavailable' } },
        });
        await expect(DashboardService.getRecentDeals('admin-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as contas.');
    });

    it('scopes the full dashboard deal list to the current owner', async () => {
        const db = database({
            profiles: { data: { role: 'vendedor', roles: [] }, error: null },
            deals: { data: [{ id: 'deal-a' }], error: null },
        });
        await expect(DashboardService.getDashboardDeals('seller-a', 'tenant-a'))
            .resolves.toEqual([{ id: 'deal-a' }]);
        expect(db.operations.find(op => op.table === 'deals')?.filters).toContainEqual(['owner_id', 'seller-a']);
    });

    it('does not query any deals when tenant profile validation fails', async () => {
        const db = database({
            profiles: { data: null, error: { message: 'profile unavailable' } },
        });
        await expect(DashboardService.getDashboardDeals('seller-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível validar o acesso ao dashboard.');
        expect(db.operations.some(op => op.table === 'deals')).toBe(false);
    });
});
