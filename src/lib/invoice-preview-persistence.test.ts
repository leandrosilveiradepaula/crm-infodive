import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requirePermission: vi.fn(),
    revalidatePath: vi.fn(),
    updateSalesOrder: vi.fn(),
    createInstallments: vi.fn(),
    uploadDocument: vi.fn(),
}));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../services/SalesService', () => ({
    SalesService: {
        updateSalesOrder: mocks.updateSalesOrder,
        createInstallments: mocks.createInstallments,
    },
}));
vi.mock('../services/DocumentService', () => ({
    DocumentService: { uploadDocument: mocks.uploadDocument },
}));
vi.mock('../services/DistributorOrderService', () => ({
    DistributorOrderService: {},
}));

import { processInvoiceAction } from '../app/(dashboard)/sales/actions';

const orderId = '11111111-1111-4111-8111-111111111111';
function setup({ dealId = null as string | null, uploadError = null as unknown } = {}) {
    const upload = vi.fn().mockResolvedValue({ error: uploadError });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const q = {
        select() { return q; },
        eq() { return q; },
        maybeSingle: vi.fn().mockResolvedValue({
            data: { id: orderId, deal_id: dealId }, error: null,
        }),
    };
    mocks.createAdminClient.mockReturnValue({
        from: vi.fn().mockReturnValue(q),
        storage: { from: vi.fn().mockReturnValue({ upload, remove }) },
    });
    return { upload, remove };
}
function invoice(confirmed: boolean) {
    const form = new FormData();
    form.set('file', new File(['<NFe><infNFe><nNF>123</nNF></infNFe></NFe>'],
        'nota.xml', { type: 'application/xml' }));
    form.set('confirmSave', String(confirmed));
    return form;
}
describe('invoice analysis versus persisted writes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ organizationId: 'tenant-a', userId: 'user-a' });
        mocks.updateSalesOrder.mockResolvedValue({ id: orderId });
        mocks.createInstallments.mockResolvedValue([]);
        mocks.uploadDocument.mockResolvedValue({ id: 'document-a' });
    });
    it('extracts XML data without Storage or database mutations when not confirmed', async () => {
        const db = setup();
        const result = await processInvoiceAction(orderId, invoice(false));
        expect(result).toMatchObject({ success: true, saved: false, fileUrl: null });
        expect(result).toHaveProperty('extractedData', expect.objectContaining({ number: '123' }));
        expect(db.upload).not.toHaveBeenCalled();
        expect(db.remove).not.toHaveBeenCalled();
        expect(mocks.updateSalesOrder).not.toHaveBeenCalled();
    });
    it('uploads once and updates the scoped order only on explicit confirmation', async () => {
        const db = setup();
        const result = await processInvoiceAction(orderId, invoice(true));
        expect(result).toMatchObject({ success: true, saved: true });
        expect(db.upload).toHaveBeenCalledOnce();
        expect(mocks.updateSalesOrder).toHaveBeenCalledWith('tenant-a', orderId,
            expect.objectContaining({ invoice_url: expect.stringContaining('tenant-a/invoices/') }));
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/sales');
    });
    it('never updates a sales order after a Storage upload error', async () => {
        const db = setup({ uploadError: { message: 'Storage offline' } });
        const result = await processInvoiceAction(orderId, invoice(true));
        expect(result.success).toBe(false);
        expect(mocks.updateSalesOrder).not.toHaveBeenCalled();
        expect(db.remove).not.toHaveBeenCalled();
    });
    it('cleans up a new unlinked Storage object on sales-order persistence failure', async () => {
        const db = setup();
        mocks.updateSalesOrder.mockRejectedValue(new Error('DB unavailable'));
        const result = await processInvoiceAction(orderId, invoice(true));
        expect(result).toMatchObject({ success: false, saved: false });
        expect(db.remove).toHaveBeenCalledWith([expect.stringContaining('tenant-a/invoices/')]);
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });
    it('reports a partial commit instead of deleting an invoice already linked to a sales order', async () => {
        const db = setup({ dealId: 'deal-a' });
        mocks.uploadDocument.mockRejectedValue(new Error('Document insert failed'));
        const result = await processInvoiceAction(orderId, invoice(true));
        expect(result).toMatchObject({ success: false, saved: true, partialSuccess: true });
        expect(result).toHaveProperty('error', expect.stringContaining('Verifique antes de reenviar'));
        expect(db.remove).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/sales');
    });
});
