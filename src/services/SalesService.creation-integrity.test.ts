import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SalesService } from './SalesService';
type Result = { data: unknown; error: { message: string } | null };
type Operation = { table: string; action: string; filters: Array<[string, unknown]>; payload?: unknown };
function fakeDb(results: Record<string, Result>) {
    const operations: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, action: 'read', filters: [] };
        operations.push(op);
        const result = () => results[table + ':' + op.action] ?? results[table] ?? { data: [], error: null };
        const query = {
            select() { return query; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return query; },
            order() { return query; },
            insert(data: unknown) { op.action = 'insert'; op.payload = data; return query; },
            maybeSingle() { return Promise.resolve(result()); },
            then(ok: (res: Result) => unknown) { return Promise.resolve(result()).then(ok); },
        };
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}
const validOrder = { deal_id: 'deal-a', id: 'spoof' };
const validItems = [{ product_name: 'Widget', quantity: 2, unit_price: 5 }];
describe('sales order creation and installments integrity', () => {
    beforeEach(() => vi.clearAllMocks());
    it('rejects malformed orders and items before privileged reads/writes', async () => {
        const db = fakeDb({});
        await expect(SalesService.createSalesOrder('tenant-a', {}, validItems)).rejects.toThrow();
        await expect(SalesService.createSalesOrder('tenant-a', validOrder, [{ product_name: 'Bad', quantity: -1, unit_price: 5 }])).rejects.toThrow();
        expect(db.from).not.toHaveBeenCalled();
    });
    it('checks deal ownership before creating the order', async () => {
        const db = fakeDb({ deals: { data: null, error: null } });
        await expect(SalesService.createSalesOrder('tenant-a', validOrder, validItems)).rejects.toThrow();
        expect(db.operations[0].filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.some(x => x.action === 'insert')).toBe(false);
    });
    it('writes only allowed fields and requires all item inserts to persist', async () => {
        const db = fakeDb({
            deals: { data: { id: 'deal-a' }, error: null },
            'sales_orders:insert': { data: { id: 'order-a' }, error: null },
            'sales_order_items:insert': { data: [], error: null },
        });
        await expect(SalesService.createSalesOrder('tenant-a', validOrder, validItems)).rejects.toThrow();
        const created = db.operations.find(x => x.table === 'sales_orders' && x.action === 'insert');
        expect(created?.payload).toEqual([expect.objectContaining({
            organization_id: 'tenant-a', deal_id: 'deal-a', total_value: 10,
        })]);
        expect(JSON.stringify(created?.payload)).not.toContain('spoof');
    });
    it('rejects invalid installment amounts/dates without a database call', async () => {
        const db = fakeDb({});
        await expect(SalesService.createInstallments('tenant-a', 'order-a', [{ dueDate: '2026-02-30', amount: 5 }])).rejects.toThrow();
        await expect(SalesService.createInstallments('tenant-a', 'order-a', [{ dueDate: '2026-10-10', amount: -1 }])).rejects.toThrow();
        expect(db.from).not.toHaveBeenCalled();
    });
    it('verifies owning order and complete installment persistence', async () => {
        let db = fakeDb({ sales_orders: { data: null, error: null } });
        await expect(SalesService.createInstallments('tenant-a', 'order-a', [{ dueDate: '2026-10-10', amount: 5 }])).rejects.toThrow();
        expect(db.operations.some(x => x.action === 'insert')).toBe(false);
        db = fakeDb({
            sales_orders: { data: { id: 'order-a' }, error: null },
            'sales_order_installments:insert': { data: [], error: null },
        });
        await expect(SalesService.createInstallments('tenant-a', 'order-a', [{ dueDate: '10/10/2026', amount: 5 }])).rejects.toThrow();
        expect(db.operations.find(x => x.action === 'insert')?.payload).toEqual([expect.objectContaining({
            organization_id: 'tenant-a', due_date: '2026-10-10', status: 'pending',
        })]);
    });
});
