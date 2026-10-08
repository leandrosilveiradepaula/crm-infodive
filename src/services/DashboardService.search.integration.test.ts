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
            then(resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) {
                const result = responses[table + ':' + operation.column] ||
                    { data: [], error: null };
                return Promise.resolve(result).then(resolve, reject);
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
            'deals:title': { data: [{ id: '1', title: 'Acme' }], error: null },
            'deals:company': { data: [{ id: '1', title: 'Acme' }, { id: '2', title: 'Other' }], error: null },
            'accounts:name': { data: [{ id: 'company-1', name: 'Acme' }], error: null },
        });

        const result = await DashboardService.searchGlobal('user-1', 'tenant-1', ' Acme ');
        expect(result.deals.map(deal => deal.id)).toEqual(['1', '2']);
        expect(result.customers).toHaveLength(1);
        expect(db.operations).toHaveLength(3);
        expect(db.operations.every(operation =>
            operation.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-1')
        )).toBe(true);
        expect(db.operations.map(operation => operation.column)).toEqual(['title', 'company', 'name']);
    });

    it('does not embed arbitrary OR syntax from a search string', async () => {
        const db = fakeDatabase({});
        const malicious = 'Acme,or(id.eq.1)';
        await DashboardService.searchGlobal('user-1', 'tenant-1', malicious);
        expect(db.operations[0].filters).toContainEqual(['title', '%' + malicious + '%']);
    });

    it('does not silently substitute empty results on database errors', async () => {
        fakeDatabase({
            'deals:company': { data: null, error: { message: 'database unavailable' } },
        });
        await expect(DashboardService.searchGlobal('user-1', 'tenant-1', 'Acme'))
            .rejects.toThrow('Não foi possível concluir a busca.');
    });

    it('avoids database calls for empty or one-letter search terms', async () => {
        const db = fakeDatabase({});
        await expect(DashboardService.searchGlobal('user-1', 'tenant-1', 'a'))
            .resolves.toEqual({ deals: [], customers: [] });
        expect(db.from).not.toHaveBeenCalled();
    });
});
