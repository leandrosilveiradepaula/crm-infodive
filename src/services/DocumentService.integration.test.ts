import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DocumentService } from './DocumentService';

type Response = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: Array<[string, unknown]> };
function fakeDatabase(results: Record<string, Response>) {
    const operations: Op[] = [];
    const storageRemove = vi.fn(async () => results['storage:remove'] ?? { data: [], error: null });
    const storageUpload = vi.fn(async () => results['storage:upload'] ?? { data: { path: 'uploaded' }, error: null });
    const storageSignedUrl = vi.fn(async () => ({ data: { signedUrl: 'https://signed.example/document' }, error: null }));
    const storage = { from: vi.fn(() => ({
        upload: storageUpload,
        remove: storageRemove,
        createSignedUrl: storageSignedUrl,
    })) };
    const from = vi.fn((table: string) => {
        const operation: Op = { table, mode: 'read', filters: [] };
        operations.push(operation);
        const builder = {
            select() { return builder; },
            eq(k: string, value: unknown) { operation.filters.push([k, value]); return builder; },
            in() { return builder; },
            order() { return builder; },
            insert() { operation.mode = 'insert'; return builder; },
            delete() { operation.mode = 'delete'; return builder; },
            single() { return Promise.resolve(take()); },
            maybeSingle() { return Promise.resolve(take()); },
            then(ok: (result: Response) => unknown, fail?: (reason: unknown) => unknown) {
                return Promise.resolve(take()).then(ok, fail);
            },
        };
        function take(): Response {
            return results[table + ':' + operation.mode] || results[table] ||
                { data: operation.mode === 'read' ? [] : { id: 'row' }, error: null };
        }
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from, storage });
    return { operations, storageRemove, storageUpload, storageSignedUrl };
}
const validDeal = {
    'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
    'deals:read': { data: { id: 'deal-1' }, error: null },
};

describe('DocumentService fail-closed offline integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('checks the parent entity before listing documents', async () => {
        const db = fakeDatabase({ ...validDeal, 'deals:read': { data: null, error: null } });
        await expect(DocumentService.getDocuments('user', 'tenant', 'deal', 'foreign'))
            .rejects.toThrow('Entidade não encontrada ou acesso negado.');
        expect(db.operations.every(op => op.table !== 'documents')).toBe(true);
        expect(db.operations.find(op => op.table === 'deals')?.filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('blocks another seller from listing or uploading documents of an inaccessible deal', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        await expect(DocumentService.getDocuments('seller-a', 'tenant', 'deal', 'deal-b'))
            .rejects.toThrow('Entidade não encontrada ou acesso negado.');
        await expect(DocumentService.uploadDocument('seller-a', 'tenant', 'deal', 'deal-b', {
            name: 'test.pdf', type: 'application/pdf', size: 2,
            arrayBuffer: new ArrayBuffer(2),
        }, {})).rejects.toThrow('Entidade não encontrada ou acesso negado.');
        expect(db.operations.filter(op => op.table === 'deals').every(op =>
            op.filters.some(([key, value]) => key === 'owner_id' && value === 'seller-a')
        )).toBe(true);
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('blocks unauthorized document deletion before touching storage', async () => {
        const db = fakeDatabase({
            'documents:read': { data: { file_path: 'tenant/deal/deal-b/1.pdf', entity_type: 'deal', entity_id: 'deal-b' }, error: null },
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        await expect(DocumentService.deleteDocument('seller-a', 'tenant', 'doc-b'))
            .rejects.toThrow('Entidade não encontrada ou acesso negado.');
        expect(db.storageRemove).not.toHaveBeenCalled();
    });

    it('validates contact documents against the actual account_contacts table', async () => {
        const db = fakeDatabase({
            'account_contacts:read': { data: { id: 'contact-1' }, error: null },
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'documents:read': { data: [], error: null },
        });
        await expect(DocumentService.getDocuments('user', 'tenant', 'contact', 'contact-1'))
            .resolves.toEqual([]);
        const contactRead = db.operations.find(op => op.table === 'account_contacts');
        expect(contactRead).toBeDefined();
        expect(contactRead?.filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('does not present a database query failure as an empty document list', async () => {
        fakeDatabase({ ...validDeal, 'documents:read': { data: null, error: { message: 'DB down' } } });
        await expect(DocumentService.getDocuments('user', 'tenant', 'deal', 'deal-1'))
            .rejects.toThrow('Não foi possível carregar os documentos.');
    });

    it('does not mask a failed account-related deal or document read', async () => {
        fakeDatabase({
            'accounts:read': { data: { id: 'account-1' }, error: null },
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'documents:read': { data: [], error: null },
            'deals:read': { data: null, error: { message: 'DB down' } },
        });
        await expect(DocumentService.getDocuments('user', 'tenant', 'account', 'account-1'))
            .rejects.toThrow('Não foi possível carregar os documentos.');
    });

    it('does not include documents from another seller deal in the account rollup', async () => {
        const db = fakeDatabase({
            'accounts:read': { data: { id: 'account-1' }, error: null },
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'documents:read': { data: [], error: null },
            'deals:read': { data: [], error: null },
        });
        await expect(DocumentService.getDocuments('seller-a', 'tenant', 'account', 'account-1'))
            .resolves.toEqual([]);
        const relatedDeals = db.operations.find(op => op.table === 'deals');
        expect(relatedDeals?.filters).toContainEqual(['owner_id', 'seller-a']);
        expect(relatedDeals?.filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('fails when an upload succeeds but metadata is absent and cleans storage', async () => {
        const db = fakeDatabase({
            ...validDeal,
            'documents:insert': { data: null, error: null },
        });
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: 'test.pdf', type: 'application/pdf', size: 16,
            arrayBuffer: new ArrayBuffer(16),
        }, {})).rejects.toThrow('Não foi possível salvar o documento.');
        expect(db.storageUpload).toHaveBeenCalledTimes(1);
        expect(db.storageRemove).toHaveBeenCalledTimes(1);
    });

    it('rejects spoofed size and empty payload without calling storage', async () => {
        const db = fakeDatabase({});
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: 'test.pdf', type: 'application/pdf', size: 1,
            arrayBuffer: new ArrayBuffer(2),
        }, {})).rejects.toThrow('Tamanho do arquivo inválido.');
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: 'test.pdf', type: 'application/pdf', size: 0,
            arrayBuffer: new ArrayBuffer(0),
        }, {})).rejects.toThrow('Tamanho do arquivo inválido.');
        expect(db.storageUpload).not.toHaveBeenCalled();
        expect(db.operations).toHaveLength(0);
    });

    it('rejects oversized actual payload even when declared size matches', async () => {
        const db = fakeDatabase({});
        const oversized = 25 * 1024 * 1024 + 1;
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: 'test.pdf', type: 'application/pdf', size: oversized,
            arrayBuffer: new ArrayBuffer(oversized),
        }, {})).rejects.toThrow('Arquivo muito grande.');
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('rejects unusable names and missing binary payload before database access', async () => {
        const db = fakeDatabase({});
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: '../', type: 'application/pdf', size: 1,
            arrayBuffer: new ArrayBuffer(1),
        }, {})).rejects.toThrow('Nome de arquivo inválido.');
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            name: 'valid.pdf', type: 'application/pdf', size: 1,
            arrayBuffer: undefined as unknown as ArrayBuffer,
        }, {})).rejects.toThrow('Arquivo inválido.');
        expect(db.operations).toHaveLength(0);
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('never reports success or deletes metadata after storage removal fails', async () => {
        const db = fakeDatabase({
            'documents:read': { data: { file_path: 'tenant/deal/deal-1/a.pdf', entity_type: 'deal', entity_id: 'deal-1' }, error: null },
            ...validDeal,
            'storage:remove': { data: null, error: { message: 'storage down' } },
        });
        await expect(DocumentService.deleteDocument('user', 'tenant', 'document-1'))
            .rejects.toThrow('Não foi possível excluir o arquivo do documento.');
        expect(db.operations.every(op => op.mode !== 'delete')).toBe(true);
    });

    it('refuses document listing when no profile belongs to the tenant', async () => {
        const db = fakeDatabase({
            'accounts:read': { data: { id: 'account-1' }, error: null },
            'profiles:read': { data: null, error: null },
        });
        await expect(DocumentService.getDocuments('outsider', 'tenant', 'account', 'account-1'))
            .rejects.toThrow('Não foi possível validar o acesso ao documento.');
        expect(db.operations.some(op => op.table === 'accounts')).toBe(false);
        expect(db.operations.some(op => op.table === 'documents')).toBe(false);
    });

    it('refuses contact document uploads if tenant membership cannot be verified', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: null, error: null },
            'account_contacts:read': { data: { id: 'contact-1' }, error: null },
        });
        await expect(DocumentService.uploadDocument('outsider', 'tenant', 'contact', 'contact-1', {
            name: 'valid.pdf', type: 'application/pdf', size: 1,
            arrayBuffer: new ArrayBuffer(1),
        }, {})).rejects.toThrow('Não foi possível validar o acesso ao documento.');
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('rejects a signed URL when metadata points outside its tenant directory', async () => {
        const db = fakeDatabase({
            ...validDeal,
            'documents:read': { data: {
                file_path: 'another-tenant/deal/deal-1/confidential.pdf',
                entity_type: 'deal', entity_id: 'deal-1',
            }, error: null },
        });
        await expect(DocumentService.getSignedUrl('user', 'tenant', 'document-1'))
            .rejects.toThrow('Caminho do documento inválido.');
        expect(db.storageSignedUrl).not.toHaveBeenCalled();
    });

    it('rejects malformed nested or traversal paths before issuing a signed URL', async () => {
        for (const path of [
            'tenant/deal/deal-1/../../other.pdf',
            'tenant/deal/deal-1/evil/subfolder.pdf',
            'tenant/deal/deal-1/evil\\\\file.pdf',
        ]) {
            const db = fakeDatabase({
                ...validDeal,
                'documents:read': { data: {
                    file_path: path, entity_type: 'deal', entity_id: 'deal-1',
                }, error: null },
            });
            await expect(DocumentService.getSignedUrl('user', 'tenant', 'document-1'))
                .rejects.toThrow('Caminho do documento inválido.');
            expect(db.storageSignedUrl).not.toHaveBeenCalled();
        }
    });

    it('blocks storage deletion if a tenant-owned metadata row references a foreign file', async () => {
        const db = fakeDatabase({
            ...validDeal,
            'documents:read': { data: {
                file_path: 'tenant/deal/other-deal/private.pdf',
                entity_type: 'deal', entity_id: 'deal-1',
            }, error: null },
        });
        await expect(DocumentService.deleteDocument('user', 'tenant', 'document-1'))
            .rejects.toThrow('Caminho do documento inválido.');
        expect(db.storageRemove).not.toHaveBeenCalled();
        expect(db.operations.some(op => op.mode === 'delete')).toBe(false);
    });

    it('allows the documented entity path to be signed', async () => {
        const db = fakeDatabase({
            ...validDeal,
            'documents:read': { data: {
                file_path: 'tenant/deal/deal-1/file-1.pdf',
                entity_type: 'deal', entity_id: 'deal-1',
            }, error: null },
        });
        await expect(DocumentService.getSignedUrl('user', 'tenant', 'document-1'))
            .resolves.toBe('https://signed.example/document');
        expect(db.storageSignedUrl).toHaveBeenCalledWith('tenant/deal/deal-1/file-1.pdf', 300);
    });

    it('rejects unrecognized document category and excessive descriptions before writing', async () => {
        const db = fakeDatabase({});
        const file = { name: 'ok.pdf', type: 'application/pdf', size: 2, arrayBuffer: new ArrayBuffer(2) };
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', file, {
            category: 'unknown' as never,
        })).rejects.toThrow('Categoria do documento inválida.');
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', file, {
            description: 'x'.repeat(2001),
        })).rejects.toThrow('Descrição do documento inválida.');
        expect(db.operations).toHaveLength(0);
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('rejects excessively long or unsafe filenames before any privileged I/O', async () => {
        const db = fakeDatabase({});
        const file = { type: 'application/pdf', size: 2, arrayBuffer: new ArrayBuffer(2) };
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            ...file, name: 'a'.repeat(181) + '.pdf',
        }, {})).rejects.toThrow('Nome de arquivo inválido.');
        await expect(DocumentService.uploadDocument('user', 'tenant', 'deal', 'deal-1', {
            ...file, name: 'sensitive..pdf',
        }, {})).rejects.toThrow('Nome de arquivo inválido.');
        expect(db.operations).toHaveLength(0);
        expect(db.storageUpload).not.toHaveBeenCalled();
    });

    it('requires an affected metadata row after storage deletion', async () => {
        fakeDatabase({
            ...validDeal,
            'documents:read': { data: { file_path: 'tenant/deal/deal-1/a.pdf', entity_type: 'deal', entity_id: 'deal-1' }, error: null },
            'documents:delete': { data: null, error: null },
        });
        await expect(DocumentService.deleteDocument('user', 'tenant', 'document-1'))
            .rejects.toThrow('Não foi possível excluir o documento.');
    });
});
