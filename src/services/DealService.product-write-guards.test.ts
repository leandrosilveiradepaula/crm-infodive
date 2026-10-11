import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DealService } from './DealService';
import { validateDealProductWrite } from '../lib/deal-product-write-validation';
type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
function fakeDb(overrides: Record<string, Result> = {}) {
    const operations: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        operations.push(op);
        const current = (): Result => {
            const override = overrides[table + ':' + op.mode] ?? overrides[table];
            if (override) return override;
            if (table === 'profiles') return { data: { role: 'manager', roles: [] }, error: null };
            if (table === 'deals') return { data: { id: 'deal-a' }, error: null };
            if (table === 'accounts') return { data: { id: 'dist-a' }, error: null };
            if (table === 'products') return { data: { id: 'catalog-a' }, error: null };
            if (table === 'deal_products') {
                return { data: { id: 'item-a', deal_id: 'deal-a', organization_id: 'tenant-a' }, error: null };
            }
            return { data: null, error: null };
        };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return q; },
            delete() { op.mode = 'delete'; return q; },
            maybeSingle() { return Promise.resolve(current()); },
            single() { return Promise.resolve(current()); },
            then(ok: (result: Result) => unknown) { return Promise.resolve(current()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, operations };
}
describe('deal product mutation integrity', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects malformed names, quantities, money and position without database calls', async () => {
        const db = fakeDb();
        for (const invalid of [
            { name: ' ' }, { name: 'Widget', quantity: 0 },
            { name: 'Widget', unit_price: Infinity },
            { name: 'Widget', cost: -1 },
            { name: 'Widget', display_order: -1 },
        ]) {
            await expect(DealService.addDealProduct('actor-a', 'deal-a', 'tenant-a', invalid))
                .rejects.toThrow();
        }
        expect(db.from).not.toHaveBeenCalled();
        expect(() => validateDealProductWrite({ quantity: 2.5 }, false)).toThrow();
        expect(() => validateDealProductWrite({ margin: -12 }, false)).not.toThrow();
    });
    it('requires a tenant-owned distributor before inserting a deal product', async () => {
        const db = fakeDb({ accounts: { data: null, error: null } });
        await expect(DealService.addDealProduct('actor-a', 'deal-a', 'tenant-a',
            { name: 'Widget', distributor_id: 'foreign-id' })).rejects.toThrow('Distribuidor');
        expect(db.operations.find(o => o.table === 'accounts')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.some(o => o.mode === 'insert')).toBe(false);
    });
    it('refuses success when an inserted product has no persisted identity', async () => {
        const db = fakeDb({ 'deal_products:insert': { data: null, error: null } });
        await expect(DealService.addDealProduct('actor-a', 'deal-a', 'tenant-a',
            { name: 'Widget', quantity: 1, unit_price: 25 })).rejects.toThrow('confirmar');
        const insert = db.operations.find(o => o.mode === 'insert');
        expect(insert?.payload).toEqual([expect.objectContaining({
            name: 'Widget', deal_id: 'deal-a', organization_id: 'tenant-a',
        })]);
    });
    it('rejects non-finite updates before DB access and zero-row persisted updates', async () => {
        const db = fakeDb();
        await expect(DealService.updateDealProduct('actor-a', 'item-a', 'tenant-a',
            { quantity: NaN })).rejects.toThrow('Quantidade');
        expect(db.from).not.toHaveBeenCalled();
        const failing = fakeDb({ 'deal_products:update': { data: null, error: null } });
        await expect(DealService.updateDealProduct('actor-a', 'item-a', 'tenant-a',
            { name: 'Widget alterado' })).rejects.toThrow('atualizar');
        expect(failing.operations.find(o => o.mode === 'update')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
    });
    it('refuses a delete result that does not identify the requested product', async () => {
        const db = fakeDb({ 'deal_products:delete': { data: { id: 'wrong' }, error: null } });
        await expect(DealService.removeDealProduct('actor-a', 'item-a', 'tenant-a'))
            .rejects.toThrow('remover');
        expect(db.operations.find(o => o.mode === 'delete')?.filters)
            .toContainEqual(['id', 'item-a']);
    });
    it('confirms tenant-scoped product inserts and updates', async () => {
        const db = fakeDb();
        await expect(DealService.addDealProduct('actor-a', 'deal-a', 'tenant-a',
            { name: 'Widget', quantity: 1, unit_price: 10 })).resolves.toMatchObject({ id: 'item-a' });
        await expect(DealService.updateDealProduct('actor-a', 'item-a', 'tenant-a',
            { name: 'Novo nome', unit_price: 0 })).resolves.toMatchObject({ id: 'item-a' });
        expect(db.operations.filter(o => o.mode === 'insert' || o.mode === 'update'))
            .every(o => o.filters.some(([k,v]) => k === 'organization_id' && v === 'tenant-a') ||
                o.mode === 'insert')).toBe(true);
    });
});