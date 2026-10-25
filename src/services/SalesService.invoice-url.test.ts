import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalesService } from './SalesService';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

const orderId = '11111111-1111-4111-8111-111111111111';
const path = 'tenant-a/invoices/' + orderId + '_1696969696969.pdf';

function fakeDb() {
    const filters: Array<[string, unknown]> = [];
    const updates: unknown[] = [];
    const q = {
        update(payload: unknown) { updates.push(payload); return q; },
        eq(k: string, v: unknown) { filters.push([k, v]); return q; },
        select() { return q; },
        maybeSingle() { return Promise.resolve({ data: { id: orderId }, error: null }); },
    };
    const from = vi.fn().mockReturnValue(q);
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, filters, updates };
}

describe('sales order invoice_url write guard', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects a foreign or unrelated invoice reference before database access', async () => {
        const db = fakeDb();
        await expect(SalesService.updateSalesOrder('tenant-a', orderId,
            { invoice_url: 'tenant-b/invoices/' + orderId + '_123.pdf' }))
            .rejects.toThrow('Caminho da nota fiscal');
        await expect(SalesService.updateSalesOrder('tenant-a', orderId,
            { invoice_url: 'tenant-a/invoices/other-id_123.pdf' }))
            .rejects.toThrow('Caminho da nota fiscal');
        expect(db.from).not.toHaveBeenCalled();
    });

    it('preserves the valid invoice reference while scoping the update to its order and tenant', async () => {
        const db = fakeDb();
        await expect(SalesService.updateSalesOrder('tenant-a', orderId, { invoice_url: path }))
            .resolves.toMatchObject({ id: orderId });
        expect(db.updates).toEqual([{ invoice_url: path }]);
        expect(db.filters).toContainEqual(['id', orderId]);
        expect(db.filters).toContainEqual(['organization_id', 'tenant-a']);
    });
});
