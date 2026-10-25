import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mock.createAdminClient }));
import { SalesService } from './SalesService';

type Result = { data: unknown; error: { message: string } | null };
function db(products: unknown[], overrides: Record<string, Result> = {}) {
    const ops: Array<{ table: string; action: string; payload?: unknown }> = [];
    const from = vi.fn((table: string) => {
        const op: { table: string; action: string; payload?: unknown } = { table, action: 'read' };
        ops.push(op);
        const q = {
            select() { return q; }, eq() { return q; },
            insert(payload: unknown) { op.action = 'insert'; op.payload = payload; return q; },
            maybeSingle() { return Promise.resolve(result()); },
            then(resolve: (value: Result) => unknown) { return Promise.resolve(result()).then(resolve); },
        };
        const result = (): Result => overrides[table + ':' + op.action] ??
            overrides[table] ??
            (table === 'deals' ? { data: { id: 'deal-a', deal_products: products, billing_type: 'direct' }, error: null } :
                table === 'sales_orders' && op.action === 'read' ? { data: [], error: null } :
                    table === 'sales_orders' ? { data: { id: 'order-a' }, error: null } :
                        { data: [{ id: 'item-a' }], error: null });
        return q;
    });
    mock.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}
const product = { name: 'Produto A', sku: 'A', quantity: 1, unit_price: 20, distributor_id: 'dist-a' };
describe('conversion fail-closed persistence guards', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects empty product deals without creating phantom orders', async () => {
        const x = db([]);
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('sem produtos');
        expect(x.ops.some(o => o.action === 'insert')).toBe(false);
    });
    it('rejects malformed distributor identifiers without write', async () => {
        const x = db([{ ...product, distributor_id: 7 }]);
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('inválidos');
        expect(x.ops.some(o => o.action === 'insert')).toBe(false);
    });
    it('rejects a persisted order lacking a usable id', async () => {
        const x = db([product], { 'sales_orders:insert': { data: { id: '' }, error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('pedido');
        expect(x.ops.some(o => o.table === 'sales_order_items')).toBe(false);
    });
    it('rejects a malformed inserted item identity despite matching count', async () => {
        db([product], { 'sales_order_items:insert': { data: [{ id: null }], error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('Conversão parcial');
    });
    it('rejects duplicate inserted item IDs despite matching count', async () => {
        db([product, { ...product, sku: 'B', name: 'Produto B' }],
            { 'sales_order_items:insert': { data: [{ id: 'same' }, { id: 'same' }], error: null } });
        await expect(SalesService.convertDealToSalesOrders('u', 'tenant-a', 'deal-a')).rejects.toThrow('Conversão parcial');
    });
});