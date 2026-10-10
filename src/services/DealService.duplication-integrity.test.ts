import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DealService } from './DealService';

type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
const product = { id: 'prod-a', deal_id: 'deal-a', organization_id: 'tenant-a', name: 'Widget', quantity: 1, unit_price: 20 };
function fakeDb(overrides: Record<string, Result> = {}, products: unknown[] = [product]) {
    const operations: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        operations.push(op);
        const current = (): Result => {
            const configured = overrides[table + ':' + op.mode] ?? overrides[table];
            if (configured) return configured;
            if (table === 'profiles') return { data: { id: 'actor-a', role: 'manager', roles: [], status: 'active' }, error: null };
            if (table === 'deals') {
                if (op.mode === 'insert') return { data: { id: 'copy-a', organization_id: 'tenant-a' }, error: null };
                if (op.mode === 'delete') return { data: { id: 'copy-a' }, error: null };
                return { data: { id: 'deal-a', organization_id: 'tenant-a', title: 'Oportunidade' }, error: null };
            }
            if (op.mode === 'insert') return { data: [{ id: 'copy-product-a' }], error: null };
            return { data: products, error: null };
        };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            delete() { op.mode = 'delete'; return q; },
            single() { return Promise.resolve(current()); },
            maybeSingle() { return Promise.resolve(current()); },
            then(resolve: (res: Result) => unknown) { return Promise.resolve(current()).then(resolve); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, operations };
}
describe('deal duplication persistence and tenant integrity', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects invalid actor and deal references before database access', async () => {
        const db = fakeDb();
        await expect(DealService.duplicateDeal('', 'deal-a', 'tenant-a')).rejects.toThrow();
        await expect(DealService.duplicateDeal('actor-a', '', 'tenant-a')).rejects.toThrow();
        expect(db.from).not.toHaveBeenCalled();
    });
    it('rejects null product lists and products from other organizations before insert', async () => {
        const db = fakeDb({ 'deal_products:read': { data: null, error: null } });
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('validar os produtos');
        expect(db.operations.some(o => o.mode === 'insert')).toBe(false);
        const db2 = fakeDb({}, [{ ...product, organization_id: 'foreign' }]);
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('validar os produtos');
        expect(db2.operations.some(o => o.mode === 'insert')).toBe(false);
    });
    it('refuses malformed copied deal identities before creating its products', async () => {
        const db = fakeDb({ 'deals:insert': { data: { id: '', organization_id: 'tenant-a' }, error: null } });
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('confirmar a cópia');
        expect(db.operations.some(o => o.table === 'deal_products' && o.mode === 'insert')).toBe(false);
    });
    it('rolls back when product insert count is inconsistent', async () => {
        const db = fakeDb({ 'deal_products:insert': { data: [], error: null } });
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('todos os produtos');
        const rolledBack = db.operations.find(o => o.table === 'deals' && o.mode === 'delete');
        expect(rolledBack?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(rolledBack?.filters).toContainEqual(['id', 'copy-a']);
    });
    it('refuses success when duplicated product IDs are malformed or identical', async () => {
        const db = fakeDb({ 'deal_products:insert': { data: [{ id: '' }], error: null } });
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a')).rejects.toThrow('todos os produtos');
        expect(db.operations.some(o => o.mode === 'delete')).toBe(true);
    });
    it('reports failed compensation rather than claiming a clean rollback', async () => {
        const db = fakeDb({
            'deal_products:insert': { data: null, error: null },
            'deals:delete': { data: null, error: null },
        });
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a'))
            .rejects.toThrow('nem reverter');
        expect(db.operations.some(o => o.table === 'deals' && o.mode === 'delete')).toBe(true);
    });
    it('duplicates tenant-scoped products and confirms persisted rows', async () => {
        const db = fakeDb();
        await expect(DealService.duplicateDeal('actor-a', 'deal-a', 'tenant-a'))
            .resolves.toMatchObject({ id: 'copy-a' });
        const copiedProducts = db.operations.find(o => o.table === 'deal_products' && o.mode === 'insert');
        expect(copiedProducts?.payload).toEqual([expect.objectContaining({
            deal_id: 'copy-a', organization_id: 'tenant-a', name: 'Widget',
        })]);
        expect(JSON.stringify(copiedProducts?.payload)).not.toContain('"id":"prod-a"');
        expect(db.operations.some(o => o.mode === 'delete')).toBe(false);
    });
});