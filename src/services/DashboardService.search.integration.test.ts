import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DashboardService } from './DashboardService';

type Result = { data: unknown; error: { message?: string } | null };
type SearchOperation = {
    table: string;
    filters: Array<[string, unknown]>;
    column: string | null;
};

function fakeDatabase(responses: Record<string, Result>) {
    const operations: SearchOperation[] = [];
    const from = vi.fn((table: string) => {
        const operation: SearchOperation = { table, filters: [], column: null };
        operations.push(operation);
        const take = (): Result => responses[table + ':' + operation.column] ||
            { data: [], error: null };
        const builder = {
            select() { return builder; },
            eq(column: string, value: unknown) {
                operation.filters.push([column, value]);
                return builder;
            },
            ilike(column: string, value: unknown) {
                operation.column = column;
                operation.filters.push([column, value]);
                return builder;
            },
            limit() { return builder; },
            or() { throw new Error('raw PostgREST OR must not be used'); },
            maybeSingle: async () => take(),
            then(resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(resolve, reject);
            },
        };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}

describe('DashboardService global search isolation and correctness', () => {
    beforeEach(() => vi.clearAllMocks());

    it('uses tenant-scoped ilike queries and deduplicates matching deals', async () => {
        const db = fakeDatabase({
            'profiles:null': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:title': { data: [{ id: '1', title: 'Acme' }], error: null },
            'deals:company': { data: [{ id: '1', title: 'Acme' }, { id: '2', title: 'Other' }], error: null },
            'accounts:name': { data: [{ id: 'company-1', name: 'Acme' }], error: null },
        });

        const result = await DashboardService.searchGlobal('user-1', 'tenant-1', ' Acme ');
        expect(result.deals.map(deal => deal.id)).toEqual(['1', '2']);
        expect(result.customers).toHaveLength(1);
        expect(db.operations).toHaveLength(4);
        expect(db.operations.every(operation =>
            operation.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-1')
        )).toBe(true);
        expect(db.operations.map(operation => operation.column)).toEqual([null, 'title', 'company', 'name']);
        expect(db.operations.filter(operation => operation.table === 'deals').every(operation =>
            operation.filters.some(([key, value]) => key === 'owner_id' && value === 'user-1')
        )).toBe(true);
    });

    it('does not embed arbitrary OR syntax from a search string', async () => {
        const db = fakeDatabase({ 'profiles:null': { data: { role: 'admin', roles: [] }, error: null } });
        const malicious = 'Acme,or(id.eq.1)';
        await DashboardService.searchGlobal('user-1', 'tenant-1', malicious);
        expect(db.operations.find(operation => operation.table === 'deals' && operation.column === 'title')?.filters)
            .toContainEqual(['title', '%' + malicious + '%']);
    });

    it('does not silently substitute empty results on database errors', async () => {
        fakeDatabase({
            'profiles:null': { data: { role: 'admin', roles: [] }, error: null },
            'deals:company': { data: null, error: { message: 'database unavailable' } },
        });
        await expect(DashboardService.searchGlobal('user-1', 'tenant-1', 'Acme'))
            .rejects.toThrow('Não foi possível concluir a busca.');
    });

    it('does not query customer or deals data if tenant role cannot be verified', async () => {
        const db = fakeDatabase({
            'profiles:null': { data: null, error: { message: 'connection failed' } },
        });
        await expect(DashboardService.searchGlobal('user-1', 'tenant-1', 'Acme'))
            .rejects.toThrow('Não foi possível validar a permissão de busca.');
        expect(db.operations).toHaveLength(1);
        expect(db.operations[0].table).toBe('profiles');
    });

    it('avoids database calls for empty or one-letter search terms', async () => {
        const db = fakeDatabase({});
        await expect(DashboardService.searchGlobal('user-1', 'tenant-1', 'a'))
            .resolves.toEqual({ deals: [], customers: [] });
        expect(db.from).not.toHaveBeenCalled();
    });
});
