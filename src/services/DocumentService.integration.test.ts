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
    const storage = { from: vi.fn(() => ({
        upload: storageUpload,
        remove: storageRemove,
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
    return { operations, storageRemove, storageUpload };
}
const validDeal = { 'deals:read': { data: { id: 'deal-1' }, error: null } };

describe('DocumentService fail-closed offline integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('checks the parent entity before listing documents', async () => {
        const db = fakeDatabase({ 'deals:read': { data: null, error: null } });
        await expect(DocumentService.getDocuments('user', 'tenant', 'deal', 'foreign'))
            .rejects.toThrow('Entidade não encontrada ou acesso negado.');
        expect(db.operations.every(op => op.table !== 'documents')).toBe(true);
        expect(db.operations[0].filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('validates contact documents against the actual account_contacts table', async () => {
        const db = fakeDatabase({
            'account_contacts:read': { data: { id: 'contact-1' }, error: null },
            'documents:read': { data: [], error: null },
        });
        await expect(DocumentService.getDocuments('user', 'tenant', 'contact', 'contact-1'))
            .resolves.toEqual([]);
        expect(db.operations[0].table).toBe('account_contacts');
        expect(db.operations[0].filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('does not present a database query failure as an empty document list', async () => {
        fakeDatabase({ ...validDeal, 'documents:read': { data: null, error: { message: 'DB down' } } });
        await expect(DocumentService.getDocuments('user', 'tenant', 'deal', 'deal-1'))
            .rejects.toThrow('Não foi possível carregar os documentos.');
    });

    it('does not mask a failed account-related deal or document read', async () => {
        fakeDatabase({
            'accounts:read': { data: { id: 'account-1' }, error: null },
            'documents:read': { data: [], error: null },
            'deals:read': { data: null, error: { message: 'DB down' } },
        });
        await expect(DocumentService.getDocuments('user', 'tenant', 'account', 'account-1'))
            .rejects.toThrow('Não foi possível carregar os documentos.');
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

    it('never reports success or deletes metadata after storage removal fails', async () => {
        const db = fakeDatabase({
            'documents:read': { data: { file_path: 'tenant/deal/deal-1/a.pdf' }, error: null },
            'storage:remove': { data: null, error: { message: 'storage down' } },
        });
        await expect(DocumentService.deleteDocument('user', 'tenant', 'document-1'))
            .rejects.toThrow('Não foi possível excluir o arquivo do documento.');
        expect(db.operations.every(op => op.mode !== 'delete')).toBe(true);
    });

    it('requires an affected metadata row after storage deletion', async () => {
        fakeDatabase({
            'documents:read': { data: { file_path: 'tenant/deal/deal-1/a.pdf' }, error: null },
            'documents:delete': { data: null, error: null },
        });
        await expect(DocumentService.deleteDocument('user', 'tenant', 'document-1'))
            .rejects.toThrow('Não foi possível excluir o documento.');
    });
});
