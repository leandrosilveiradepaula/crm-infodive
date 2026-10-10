import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SalesService } from './SalesService';

type Result = { data: unknown; error: { message: string } | null };
type Operation = { table: string; mode: string; filters: Array<[string, unknown]>; payload?: unknown };
const deal = { id: 'deal-a', billing_type: 'direct', deal_products: [
    { sku: 'sku-a', name: 'Item A', quantity: 1, unit_price: 10, distributor_id: 'dist-a' },
] };
function fakeDb(results: Record<string, Result>) {
    const operations: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, mode: 'read', filters: [] };
        operations.push(op);
        const value = () => results[table + ':' + op.mode] ?? results[table] ?? { data: [], error: null };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            maybeSingle() { return Promise.resolve(value()); },
            then(ok: (result: Result) => unknown) { return Promise.resolve(value()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}
describe('deal to sales-order conversion integrity', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects invalid identities without accessing the database', async () => {
        const db = fakeDb({});
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', '')).rejects.toThrow();
        expect(db.from).not.toHaveBeenCalled();
    });
    it('rejects missing tenant deal or malformed product payload', async () => {
        const db = fakeDb({ deals: { data: null, error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow();
        expect(db.operations[0].filters).toContainEqual(['organization_id', 'tenant-a']);
        fakeDb({ deals: { data: { ...deal, deal_products: [{ name: 'bad', quantity: 0, unit_price: 5 }] }, error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('Produtos');
    });
    it('refuses sequential duplicate conversions and avoids inserts', async () => {
        const db = fakeDb({ deals: { data: deal, error: null }, sales_orders: { data: [{ id: 'old' }], error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('Já existem');
        expect(db.operations.some(x => x.mode === 'insert')).toBe(false);
        expect(db.operations.find(x => x.table === 'sales_orders')?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('does not continue after a sales-order insert failure', async () => {
        const db = fakeDb({
            deals: { data: deal, error: null }, sales_orders: { data: [], error: null },
            'sales_orders:insert': { data: null, error: null },
        });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('pedido');
        expect(db.operations.some(x => x.table === 'sales_order_items')).toBe(false);
    });
    it('requires the exact item count before returning conversion success', async () => {
        const db = fakeDb({
            deals: { data: deal, error: null }, sales_orders: { data: [], error: null },
            'sales_orders:insert': { data: { id: 'order-a' }, error: null },
            'sales_order_items:insert': { data: [], error: null },
        });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('Conversão parcial');
        expect(db.operations.find(x => x.table === 'sales_order_items')?.payload).toEqual([expect.objectContaining({
            sales_order_id: 'order-a', organization_id: 'tenant-a',
        })]);
    });
});
