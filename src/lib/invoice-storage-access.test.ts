import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidInvoiceStoragePath, parseInvoiceStoragePath } from './invoice-storage-access';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireSessionContext: vi.fn(),
    requirePermission: vi.fn(),
    revalidatePath: vi.fn(),
}));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({
    requireSessionContext: mocks.requireSessionContext,
    requirePermission: mocks.requirePermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('../services/SalesService', () => ({ SalesService: {} }));
vi.mock('../services/DocumentService', () => ({ DocumentService: {} }));
vi.mock('../services/DistributorOrderService', () => ({ DistributorOrderService: {} }));

import { getSignedUrlForRawPath } from '../app/(dashboard)/sales/actions';

const orderId = '11111111-1111-4111-8111-111111111111';
const filePath = 'tenant-a/invoices/' + orderId + '_1696969696969.pdf';

function fakeDb(row: unknown, error: { message: string } | null = null, storageError: unknown = null) {
    const filters: Array<[string, unknown]> = [];
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error });
    const q = {
        select() { return q; },
        eq(k: string, v: unknown) { filters.push([k, v]); return q; },
        maybeSingle,
    };
    const createSignedUrl = vi.fn().mockResolvedValue(
        storageError ? { data: null, error: storageError } :
            { data: { signedUrl: 'https://example.test/signed' }, error: null },
    );
    const from = vi.fn().mockReturnValue(q);
    const storageFrom = vi.fn().mockReturnValue({ createSignedUrl });
    mocks.createAdminClient.mockReturnValue({ from, storage: { from: storageFrom } });
    return { from, filters, createSignedUrl, storageFrom };
}

describe('invoice raw-storage signed URLs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireSessionContext.mockResolvedValue({ userId: 'u', organizationId: 'tenant-a' });
    });

    it('supports stored legacy timestamp and randomized invoice names', () => {
        expect(parseInvoiceStoragePath('tenant-a', filePath)).toEqual({ orderId });
        expect(isValidInvoiceStoragePath('tenant-a', orderId, filePath)).toBe(true);
        expect(isValidInvoiceStoragePath('tenant-a', orderId,
            'tenant-a/invoices/' + orderId + '_71c32e45-f480-495b-9cb2-72c962536ab0.xml')).toBe(true);
    });

    it('rejects foreign tenants, arbitrary attachments and traversal/encoded paths', () => {
        for (const path of [
            'tenant-b/invoices/' + orderId + '_10.pdf',
            'tenant-a/deal/' + orderId + '/contract.pdf',
            'tenant-a/invoices/../secrets.pdf',
            'tenant-a/invoices/' + orderId + '_10.pdf/extra',
            'tenant-a/invoices/' + orderId + '_10%2F.pdf',
            'tenant-a/invoices/other_order_10.pdf',
        ]) {
            expect(parseInvoiceStoragePath('tenant-a', path)).toBeNull();
        }
    });

    it('rejects invalid paths before privileged DB or storage access', async () => {
        const db = fakeDb(null);
        await expect(getSignedUrlForRawPath('tenant-a/documents/private.pdf')).rejects.toThrow();
        expect(db.from).not.toHaveBeenCalled();
        expect(db.createSignedUrl).not.toHaveBeenCalled();
    });

    it('requires an exact persisted, tenant-scoped invoice reference before signing', async () => {
        const db = fakeDb(null);
        await expect(getSignedUrlForRawPath(filePath)).rejects.toThrow('Nota fiscal não encontrada');
        expect(db.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.filters).toContainEqual(['invoice_url', filePath]);
        expect(db.filters).toContainEqual(['id', orderId]);
        expect(db.createSignedUrl).not.toHaveBeenCalled();
    });

    it('rejects a mismatched stored path or a Storage failure', async () => {
        const mismatch = fakeDb({ id: orderId, invoice_url: 'tenant-a/invoices/else.pdf' });
        await expect(getSignedUrlForRawPath(filePath)).rejects.toThrow();
        expect(mismatch.createSignedUrl).not.toHaveBeenCalled();

        const broken = fakeDb({ id: orderId, invoice_url: filePath }, null, { message: 'offline' });
        await expect(getSignedUrlForRawPath(filePath)).rejects.toThrow('link seguro');
        expect(broken.createSignedUrl).toHaveBeenCalledOnce();
    });

    it('signs a persisted invoice for five minutes without trusting arbitrary client paths', async () => {
        const db = fakeDb({ id: orderId, invoice_url: filePath });
        await expect(getSignedUrlForRawPath(filePath)).resolves.toBe('https://example.test/signed');
        expect(db.storageFrom).toHaveBeenCalledWith('documents');
        expect(db.createSignedUrl).toHaveBeenCalledWith(filePath, 300);
    });
});
