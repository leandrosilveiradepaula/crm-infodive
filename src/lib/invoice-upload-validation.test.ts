import { describe, expect, it, vi, beforeEach } from 'vitest';
import { validateInvoiceUpload } from './invoice-upload-validation';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(), requirePermission: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../services/SalesService', () => ({ SalesService: { updateSalesOrder: vi.fn() } }));
vi.mock('../services/DocumentService', () => ({ DocumentService: {} }));
vi.mock('../services/DistributorOrderService', () => ({ DistributorOrderService: {} }));
import { processInvoiceAction } from '../app/(dashboard)/sales/actions';

const orderId = '11111111-1111-4111-8111-111111111111';
const file = (name = 'nota.pdf', type = 'application/pdf', size = 4) => ({
    name, type, size, arrayBuffer: async () => new Uint8Array(size).buffer,
});
describe('invoice upload tenant and file guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ organizationId: 'tenant-a', userId: 'user-a' });
    });
    it('rejects missing or invalid order IDs', () => {
        expect(validateInvoiceUpload('', file()).ok).toBe(false);
        expect(validateInvoiceUpload('../escape', file()).ok).toBe(false);
    });
    it('rejects invalid file types and MIME mismatches', () => {
        expect(validateInvoiceUpload(orderId, file('evil.exe')).ok).toBe(false);
        expect(validateInvoiceUpload(orderId, file('nota.pdf', 'text/xml')).ok).toBe(false);
        expect(validateInvoiceUpload(orderId, file('nota.xml', 'application/xml')).ok).toBe(true);
    });
    it('rejects empty and oversized files', () => {
        expect(validateInvoiceUpload(orderId, file('nota.pdf', 'application/pdf', 0)).ok).toBe(false);
        expect(validateInvoiceUpload(orderId, file('nota.pdf', 'application/pdf', 11 * 1024 * 1024)).ok).toBe(false);
    });
    it('rejects foreign order before any storage upload', async () => {
        const upload = vi.fn();
        const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle,
        };
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn().mockReturnValue(query),
            storage: { from: vi.fn().mockReturnValue({ upload }) },
        });
        const fd = new FormData();
        fd.set('file', new File(['%PDF-1.7\n%%EOF'], 'nota.pdf', { type: 'application/pdf' }));
        const result = await processInvoiceAction(orderId, fd);
        expect(result.success).toBe(false);
        expect(upload).not.toHaveBeenCalled();
        expect(query.eq).toHaveBeenCalledWith('organization_id', 'tenant-a');
    });
    it('does not replace an existing object when uploading', async () => {
        const upload = vi.fn().mockResolvedValue({ error: { message: 'conflict' } });
        const query = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: orderId, deal_id: null }, error: null }),
        };
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn().mockReturnValue(query),
            storage: { from: vi.fn().mockReturnValue({ upload }) },
        });
        const fd = new FormData();
        fd.set('file', new File(['%PDF-1.7\n%%EOF'], 'nota.pdf', { type: 'application/pdf' }));
        const result = await processInvoiceAction(orderId, fd);
        expect(result.success).toBe(false);
        expect(upload).toHaveBeenCalledWith(
            expect.stringContaining('tenant-a/invoices/'),
            expect.any(ArrayBuffer),
            expect.objectContaining({ upsert: false, contentType: 'application/pdf' }),
        );
    });
});
