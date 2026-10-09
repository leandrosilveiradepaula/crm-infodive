import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(), requirePermission: vi.fn(), requireSessionContext: vi.fn(),
}));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission, requireSessionContext: mocks.requireSessionContext,
}));
import { createPurchaseOrder, getPurchaseOrders, updatePurchaseOrder } from '../app/(dashboard)/purchases/purchase-orders-actions';

type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
function fakeDb(results: Record<string, Result>) {
    const ops: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        ops.push(op);
        const value = (): Result => results[table + ':' + op.mode] ?? results[table] ?? { data: [], error: null };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return q; },
            maybeSingle() { return Promise.resolve(value()); },
            then(ok: (result: Result) => unknown) { return Promise.resolve(value()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}
describe('purchase order tenant and persistence integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ organizationId: 'tenant-a' });
        mocks.requireSessionContext.mockResolvedValue({ organizationId: 'tenant-a' });
    });
    it('rejects malformed list but retains a genuine empty result', async () => {
        fakeDb({ purchase_orders: { data: null, error: null } });
        await expect(getPurchaseOrders()).resolves.toMatchObject({ success: false });
        fakeDb({ purchase_orders: { data: [], error: null } });
        await expect(getPurchaseOrders()).resolves.toMatchObject({ success: true, data: [] });
    });
    it('rejects invalid status, date, and notes before any privileged database call', async () => {
        const db = fakeDb({});
        await expect(createPurchaseOrder({ status: 'unknown' as 'draft' })).resolves.toMatchObject({ success: false });
        await expect(createPurchaseOrder({ expected_delivery_date: 'tomorrow' })).resolves.toMatchObject({ success: false });
        await expect(createPurchaseOrder({ notes: 'x'.repeat(10001) })).resolves.toMatchObject({ success: false });
        expect(db.from).not.toHaveBeenCalled();
    });
    it('checks referenced sales order belongs to tenant before creating a purchase order', async () => {
        const db = fakeDb({ sales_orders: { data: null, error: null } });
        await expect(createPurchaseOrder({ sales_order_id: 'foreign-sales-order' })).resolves.toMatchObject({ success: false });
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.ops.some(op => op.mode === 'insert')).toBe(false);
    });
    it('does not accept identity/tenant spoofing and requires a real updated row', async () => {
        const db = fakeDb({ 'purchase_orders:update': { data: null, error: null } });
        await expect(updatePurchaseOrder('po-a', { id: 'hijack', organization_id: 'foreign', notes: 'ok' } as never))
            .resolves.toMatchObject({ success: false });
        const write = db.ops.find(op => op.mode === 'update');
        expect(write?.payload).toEqual({ notes: 'ok' });
        expect(write?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('requires a persisted row before reporting a successful creation', async () => {
        const db = fakeDb({ 'purchase_orders:insert': { data: null, error: null } });
        await expect(createPurchaseOrder({ notes: 'Valid' })).resolves.toMatchObject({ success: false });
        expect(db.ops[0].payload).toEqual([expect.objectContaining({
            notes: 'Valid', status: 'draft', organization_id: 'tenant-a',
        })]);
    });
});
