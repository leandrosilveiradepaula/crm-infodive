import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateInvoiceContent, validateInvoiceUpload } from './invoice-upload-validation';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(), requirePermission: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../services/SalesService', () => ({ SalesService: {} }));
vi.mock('../services/DocumentService', () => ({ DocumentService: {} }));
vi.mock('../services/DistributorOrderService', () => ({ DistributorOrderService: {} }));

import { processInvoiceAction } from '../app/(dashboard)/sales/actions';

const orderId = '11111111-1111-4111-8111-111111111111';
const buffer = (value: string) => new TextEncoder().encode(value).buffer as ArrayBuffer;
describe('invoice file bytes fail-closed checks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ userId: 'user-a', organizationId: 'tenant-a' });
    });

    it('requires canonical UUID order identifier instead of accepting 36 arbitrary hex/hyphens', () => {
        const file = { name: 'nota.pdf', size: 100, type: 'application/pdf', arrayBuffer: vi.fn() };
        expect(validateInvoiceUpload(orderId, file).ok).toBe(true);
        expect(validateInvoiceUpload('-'.repeat(36), file).ok).toBe(false);
        expect(validateInvoiceUpload('z'.repeat(36), file).ok).toBe(false);
    });

    it('recognizes PDF magic and terminal EOF marker', () => {
        expect(validateInvoiceContent('pdf', buffer('%PDF-1.7\nhello\n%%EOF\n'))).toBeNull();
        expect(validateInvoiceContent('pdf', buffer('%PDF-1.7\nunfinished'))).toContain('PDF');
        expect(validateInvoiceContent('pdf', buffer('MZ .exe %%EOF'))).toContain('PDF');
    });

    it('accepts UTF-8 invoice XML but rejects binary disguised as XML', () => {
        expect(validateInvoiceContent('xml', buffer('<?xml version="1.0"?>\n<NFe><infNFe /></NFe>'))).toBeNull();
        expect(validateInvoiceContent('xml', new Uint8Array([0xff, 0xfe, 0x00]).buffer)).toContain('UTF-8');
    });

    it('rejects DTD, entity declarations and disallowed control bytes', () => {
        expect(validateInvoiceContent('xml', buffer('<!DOCTYPE NFe [<!ENTITY x SYSTEM "file:///secret">]><NFe>&x;</NFe>')))
            .toContain('proibidos');
        expect(validateInvoiceContent('xml', buffer('<NFe>\u0000</NFe>'))).toContain('proibidos');
    });

    it('does not treat incomplete XML or arbitrary text as a complete XML file', () => {
        expect(validateInvoiceContent('xml', buffer('hello world'))).toContain('XML');
        expect(validateInvoiceContent('xml', buffer('<NFe>unfinished'))).toContain('XML');
    });

    it('rejects forged PDF content before any privileged Storage write', async () => {
        const upload = vi.fn();
        const q = {
            select() { return q; },
            eq() { return q; },
            maybeSingle: vi.fn().mockResolvedValue({
                data: { id: orderId, deal_id: null }, error: null,
            }),
        };
        mocks.createAdminClient.mockReturnValue({
            from: vi.fn().mockReturnValue(q),
            storage: { from: vi.fn().mockReturnValue({ upload }) },
        });
        const form = new FormData();
        form.set('file', new File(['NOT A PDF'], 'nota.pdf', { type: 'application/pdf' }));
        const result = await processInvoiceAction(orderId, form);
        expect(result.success).toBe(false);
        expect(upload).not.toHaveBeenCalled();
    });
});
