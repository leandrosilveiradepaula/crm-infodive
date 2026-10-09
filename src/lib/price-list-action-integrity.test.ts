import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), requirePermission: vi.fn(), requireSessionContext: vi.fn() }));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: mocks.requireSessionContext,
}));
import { getPriceLists, saveTemplateAction, getTemplateAction, importPriceListAction, deletePriceListAction } from '../app/(dashboard)/settings/price-lists-actions';

type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
function fakeDb(results: Record<string, Result>) {
    const ops: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        ops.push(op);
        const value = () => results[table + ':' + op.mode] ?? results[table] ?? { data: [], error: null };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return q; },
            upsert(payload: unknown) { op.mode = 'upsert'; op.payload = payload; return q; },
            delete() { op.mode = 'delete'; return q; },
            maybeSingle() { return Promise.resolve(value()); },
            then(ok: (value: Result) => unknown) { return Promise.resolve(value()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}
describe('price list offline integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ organizationId: 'tenant-a' });
        mocks.requireSessionContext.mockResolvedValue({ organizationId: 'tenant-a' });
    });
    it('rejects malformed price-list reads, but accepts real emptiness', async () => {
        fakeDb({ price_lists: { data: null, error: null } });
        await expect(getPriceLists()).resolves.toMatchObject({ success: false });
        fakeDb({ price_lists: { data: [], error: null } });
        await expect(getPriceLists()).resolves.toMatchObject({ success: true, data: [] });
    });
    it('validates template input and requires an upserted row', async () => {
        const bad = fakeDb({});
        await expect(saveTemplateAction('', {})).resolves.toMatchObject({ success: false });
        expect(bad.from).not.toHaveBeenCalled();
        const db = fakeDb({ 'price_list_templates:upsert': { data: null, error: null } });
        await expect(saveTemplateAction('Acme', { sku: 'Part Number' })).resolves.toMatchObject({ success: false });
        expect(db.ops[0].filters).toEqual([]);
        expect(db.ops[0].payload).toMatchObject({ organization_id: 'tenant-a' });
    });
    it('distinguishes absent templates from malformed persistence', async () => {
        fakeDb({ price_list_templates: { data: null, error: null } });
        await expect(getTemplateAction('Acme')).resolves.toMatchObject({ success: true, data: null });
        fakeDb({ price_list_templates: { data: { column_mapping: 'bad' }, error: null } });
        await expect(getTemplateAction('Acme')).resolves.toMatchObject({ success: false });
    });
    it('rejects invalid import before side effects and marks partial writes as failure', async () => {
        const bad = fakeDb({});
        await expect(importPriceListAction('List', 'Acme', 'file.csv', [
            { sku: 'a', name: 'A', cost: -1, quantity: 1 },
        ])).resolves.toMatchObject({ success: false });
        expect(bad.from).not.toHaveBeenCalled();

        const db = fakeDb({
            'price_lists:insert': { data: { id: 'list-a' }, error: null },
            'price_lists:update': { data: { id: 'list-a' }, error: null },
            products: { data: { id: 'prod-a', cost: 3 }, error: null },
            'products:update': { data: null, error: null },
        });
        await expect(importPriceListAction('List', 'Acme', 'file.csv', [
            { sku: 'a', name: 'A', cost: 5, quantity: 1 },
        ])).resolves.toMatchObject({ success: false, priceListId: 'list-a' });
        expect(db.ops.find(op => op.table === 'products' && op.mode === 'update')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
    });
    it('refuses success when deletion affected no tenant row', async () => {
        const db = fakeDb({ 'price_lists:delete': { data: null, error: null } });
        await expect(deletePriceListAction('list-a')).resolves.toMatchObject({ success: false });
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
});
