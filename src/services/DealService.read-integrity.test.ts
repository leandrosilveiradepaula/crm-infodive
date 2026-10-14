import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DealService } from './DealService';

type Result = { data: unknown; error: { message: string } | null };
type Query = { table: string; select: string; filters: Array<[string, unknown]> };
type Overrides = Record<string, Result>;
function fakeDb(override: Overrides = {}) {
    const operations: Query[] = [];
    const from = vi.fn((table: string) => {
        const op: Query = { table, select: '', filters: [] };
        operations.push(op);
        const value = (): Result => {
            const key = table === 'profiles' && op.select.includes('role, roles')
                ? 'profiles:auth' : table;
            if (override[key]) return override[key];
            if (key === 'profiles:auth') return { data: { id: 'actor-a', role: 'manager', roles: [] }, error: null };
            if (table === 'deals' && op.select === '*') {
                return { data: { id: 'deal-a', account_id: 'account-a' }, error: null };
            }
            if (table === 'accounts' && op.select === '*') {
                return { data: { id: 'account-a' }, error: null };
            }
            return { data: [], error: null };
        };
        const q = {
            select(value: string) { op.select = value; return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            maybeSingle() { return Promise.resolve(value()); },
            then(onFulfilled: (v: Result) => unknown) { return Promise.resolve(value()).then(onFulfilled); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, operations };
}

describe('deal pipeline read integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('treats a malformed deal list as a query failure, not an empty pipeline', async () => {
        fakeDb({ deals: { data: null, error: null } });
        await expect(DealService.getPipelineData('actor-a', 'tenant-a')).rejects.toThrow('pipeline');
    });

    it('treats a missing profiles list as an error, not anonymous staff', async () => {
        fakeDb({ profiles: { data: null, error: null } });
        await expect(DealService.getPipelineData('actor-a', 'tenant-a')).rejects.toThrow('responsáveis');
    });

    it('fails when distributor read returns null without a database error', async () => {
        fakeDb({ accounts: { data: null, error: null } });
        await expect(DealService.getPipelineData('actor-a', 'tenant-a')).rejects.toThrow('distribuidores');
    });

    it('fails when customer account listing returns malformed data', async () => {
        const db = fakeDb();
        const accountQueries = { i: 0 };
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn((table: string) => {
                if (table !== 'accounts') return db.from(table);
                accountQueries.i++;
                const isLast = accountQueries.i > 1;
                const q = {
                    select() { return q; }, eq() { return q; }, order() { return q; },
                    then(resolve: (r: Result) => unknown) {
                        return Promise.resolve({
                            data: isLast ? null : [],
                            error: null,
                        }).then(resolve);
                    },
                };
                return q;
            }),
        });
        await expect(DealService.getPipelineData('actor-a', 'tenant-a')).rejects.toThrow('contas');
    });

    it('retains genuine empty pipeline data as empty arrays', async () => {
        fakeDb();
        const value = await DealService.getPipelineData('actor-a', 'tenant-a');
        expect(value.deals).toEqual([]);
        expect(value.distributors).toEqual([]);
        expect(value.allAccounts).toEqual([]);
    });

    it('rejects null deal products or activities instead of presenting empty tabs', async () => {
        fakeDb({ deal_products: { data: null, error: null } });
        await expect(DealService.getDealDetails('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('produtos');
        fakeDb({ activities: { data: null, error: null } });
        await expect(DealService.getDealDetails('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('atividades');
    });

    it('rejects malformed contact list for a referenced account and retains tenant filters', async () => {
        const x = fakeDb({ account_contacts: { data: null, error: null } });
        await expect(DealService.getDealDetails('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('contatos');
        expect(x.operations.filter(op => op.table === 'account_contacts')
            .every(op => op.filters.some(([k, v]) => k === 'organization_id' && v === 'tenant-a'))).toBe(true);
    });
});
