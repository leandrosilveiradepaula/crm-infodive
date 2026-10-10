import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    requirePermission: vi.fn(),
    requireSessionContext: vi.fn(),
    revalidatePath: vi.fn(),
    convertDealToSalesOrders: vi.fn(),
    generateIngramHWOrder: vi.fn(),
    uploadDocument: vi.fn(),
}));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: mocks.requireSessionContext,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('./supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../services/SalesService', () => ({
    SalesService: { convertDealToSalesOrders: mocks.convertDealToSalesOrders },
}));
vi.mock('../services/DistributorOrderService', () => ({
    DistributorOrderService: { generateIngramHWOrder: mocks.generateIngramHWOrder },
}));
vi.mock('../services/DocumentService', () => ({
    DocumentService: { uploadDocument: mocks.uploadDocument },
}));

import {
    convertDealToSalesOrdersAction,
    downloadDistributorOrderAction,
} from '../app/(dashboard)/sales/actions';
import {
    distributorOrderDownloadErrorFor,
    distributorOrderWarningFor,
    wonDealCompletionMessage,
} from './distributor-order-outcome';

describe('deal conversion distributor document evidence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ userId: 'user-a', organizationId: 'tenant-a' });
        mocks.requireSessionContext.mockResolvedValue({ userId: 'user-a', organizationId: 'tenant-a' });
        mocks.convertDealToSalesOrders.mockResolvedValue({ success: true, orders: [{ id: 'order-a' }] });
        mocks.generateIngramHWOrder.mockResolvedValue({
            fileName: 'Pedido_Ingram.xlsx', buffer: Buffer.from('test'),
        });
        mocks.uploadDocument.mockResolvedValue({ id: 'document-a' });
    });

    it('reports true completion only after the distributor document is persisted', async () => {
        await expect(convertDealToSalesOrdersAction('deal-a', {})).resolves.toMatchObject({
            success: true, distributorOrderSaved: true,
            distributorDocumentId: 'document-a', distributorOrderWarning: null,
        });
        expect(mocks.uploadDocument).toHaveBeenCalledOnce();
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/sales');
    });

    it('returns a visible partial-completion warning when workbook generation fails', async () => {
        mocks.generateIngramHWOrder.mockRejectedValue(new Error('O pedido deve conter entre 1 e 8 produtos'));
        const result = await convertDealToSalesOrdersAction('deal-a', {});
        expect(result).toMatchObject({ success: true, distributorOrderSaved: false });
        expect(result.distributorOrderWarning).toContain('oito produtos');
        expect(mocks.uploadDocument).not.toHaveBeenCalled();
    });

    it('does not claim distributor order success if document storage rejects the file', async () => {
        mocks.uploadDocument.mockRejectedValue(new Error('Storage unavailable'));
        const result = await convertDealToSalesOrdersAction('deal-a');
        expect(result).toMatchObject({ success: true, distributorOrderSaved: false });
        expect(result.distributorOrderWarning).toContain('não foi salvo');
    });

    it('requires a persisted document ID instead of trusting a null result', async () => {
        mocks.uploadDocument.mockResolvedValue(null);
        const result = await convertDealToSalesOrdersAction('deal-a');
        expect(result).toMatchObject({ success: true, distributorOrderSaved: false });
        expect(result.distributorOrderWarning).toBeTruthy();
    });

    it('does not attempt document generation when the sales conversion itself failed', async () => {
        mocks.convertDealToSalesOrders.mockRejectedValue(new Error('Database failed'));
        await expect(convertDealToSalesOrdersAction('deal-a')).resolves.toMatchObject({ success: false });
        expect(mocks.generateIngramHWOrder).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it('returns actionable but non-sensitive download errors', async () => {
        mocks.generateIngramHWOrder.mockRejectedValue(new Error('O pedido deve conter entre 1 e 8 produtos'));
        const result = await downloadDistributorOrderAction('deal-a');
        expect(result).toMatchObject({ success: false });
        expect(result.error).toContain('máximo oito produtos');
        expect(result.error).not.toContain('A venda foi registrada');
    });

    it('distinguishes degraded close-out from verified distributor completion', () => {
        expect(distributorOrderWarningFor(new Error('O pedido deve conter entre 1 e 8 produtos')))
            .toContain('não foi gerado');
        expect(distributorOrderDownloadErrorFor(new Error('unexpected secret')))
            .toBe('Não foi possível gerar o formulário do distribuidor.');
        expect(wonDealCompletionMessage(null)).toContain('salvo');
        expect(wonDealCompletionMessage('incompleto')).toContain('pendência');
    });
});
