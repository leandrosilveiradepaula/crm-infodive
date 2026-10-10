import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SalesService } from './SalesService';
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
            in(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return q; },
            delete() { op.mode = 'delete'; return q; },
            maybeSingle() { return Promise.resolve(value()); },
            then(ok: (result: Result) => unknown) { return Promise.resolve(value()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}
describe('SalesService tenant and mutation integrity', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects null order reads and preserves a valid empty list', async () => {
        fakeDb({ sales_orders: { data: null, error: null } });
        await expect(SalesService.getSalesOrders('tenant-a')).rejects.toThrow();
        fakeDb({ sales_orders: { data: [], error: null } });
        await expect(SalesService.getSalesOrders('tenant-a')).resolves.toEqual([]);
    });
    it('scopes seller profile reads to the same tenant and fails on profile query error', async () => {
        const db = fakeDb({
            sales_orders: { data: [{ id: 'order-a', created_by: 'seller-a' }], error: null },
            profiles: { data: null, error: { message: 'unavailable' } },
        });
        await expect(SalesService.getSalesOrders('tenant-a')).rejects.toThrow();
        expect(db.ops.find(x => x.table === 'profiles')?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('prevents organization and identity spoofing in updates and rejects zero affected rows', async () => {
        const db = fakeDb({ 'sales_orders:update': { data: null, error: null } });
        await expect(SalesService.updateSalesOrder('tenant-a', 'order-a', {
            id: 'foreign', deal_id: 'foreign', status: 'entregue',
        })).rejects.toThrow();
        expect(db.ops[0].payload).toEqual({ status: 'entregue' });
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('refuses successful deletion when no scoped record was affected', async () => {
        const db = fakeDb({ 'sales_orders:delete': { data: null, error: null } });
        await expect(SalesService.deleteSalesOrder('tenant-a', 'order-a')).rejects.toThrow();
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('validates installment status and requires a persisted row', async () => {
        const bad = fakeDb({});
        await expect(SalesService.updateInstallmentStatus('tenant-a', 'i', 'invalid')).rejects.toThrow();
        expect(bad.from).not.toHaveBeenCalled();
        const db = fakeDb({ 'sales_order_installments:update': { data: null, error: null } });
        await expect(SalesService.updateInstallmentStatus('tenant-a', 'i', 'paid')).rejects.toThrow();
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
});
