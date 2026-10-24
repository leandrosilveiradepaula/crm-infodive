import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { ProposalService } from './ProposalService';

type Result = { data: unknown; error: { message?: string } | null };
type Operation = { table: string; action: string; filters: Array<[string, unknown]> };
function fakeDatabase(rows: Record<string, Result | Result[]>) {
    const queues = new Map(Object.entries(rows).map(([key, value]) => [key, Array.isArray(value) ? [...value] : [value]]));
    const operations: Operation[] = [];
    const from = vi.fn((table: string) => {
        const operation: Operation = { table, action: 'read', filters: [] };
        operations.push(operation);
        const take = (): Result => {
            const items = queues.get(table + ':' + operation.action);
            return items?.length ? items.shift()! : { data: operation.action === 'read' ? [] : { id: 'row' }, error: null };
        };
        const builder = {
            select() { return builder; },
            eq(key: string, value: unknown) { operation.filters.push([key, value]); return builder; },
            order() { return builder; },
            limit() { return builder; },
            insert() { operation.action = 'insert'; return builder; },
            update() { operation.action = 'update'; return builder; },
            delete() { operation.action = 'delete'; return builder; },
            single: async () => take(),
            maybeSingle: async () => take(),
            then: (resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) =>
                Promise.resolve(take()).then(resolve, reject),
        };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations };
}

describe('ProposalService tenant owner guards', () => {
    beforeEach(() => vi.clearAllMocks());

    it('prevents seller from reading proposals of another owner', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        await expect(ProposalService.fetchProposals('seller-a', 'other-deal', 'tenant-a'))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        expect(db.operations.find(op => op.table === 'deals')?.filters).toContainEqual(['owner_id', 'seller-a']);
        expect(db.operations.some(op => op.table === 'proposals')).toBe(false);
    });

    it('prevents editing an inaccessible deal proposal', async () => {
        const db = fakeDatabase({
            'proposals:read': { data: { deal_id: 'other-deal' }, error: null },
            'profiles:read': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        await expect(ProposalService.updateProposal('seller-a', 'proposal-1', 'tenant-a', { status: 'draft' } as Parameters<typeof ProposalService.updateProposal>[3]))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        expect(db.operations.some(op => op.action === 'update')).toBe(false);
    });

    it('fails closed on database read errors without showing valid empty proposals', async () => {
        fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'proposals:read': { data: null, error: { message: 'network failure' } },
        });
        await expect(ProposalService.fetchProposals('admin-a', 'deal-1', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as propostas.');
    });

    it('rejects a delete with no affected row', async () => {
        fakeDatabase({
            'proposals:read': { data: { deal_id: 'deal-1' }, error: null },
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'proposals:delete': { data: null, error: null },
        });
        await expect(ProposalService.deleteProposal('admin-a', 'proposal-1', 'tenant-a'))
            .rejects.toThrow('Não foi possível excluir a proposta.');
    });
    it('preserves creator access to standalone proposals', async () => {
        const db = fakeDatabase({
            'proposals:read': { data: { deal_id: null, created_by: 'author-a' }, error: null },
            'profiles:read': { data: { id: 'author-a' }, error: null },
            'proposals:delete': { data: { id: 'proposal-1' }, error: null },
        });
        await expect(ProposalService.deleteProposal('author-a', 'proposal-1', 'tenant-a')).resolves.toBe(true);
        expect(db.operations.some(op => op.table === 'deals')).toBe(false);
    });

    it('rejects access to a standalone proposal created by another user', async () => {
        const db = fakeDatabase({
            'proposals:read': { data: { deal_id: null, created_by: 'other-user' }, error: null },
        });
        await expect(ProposalService.deleteProposal('author-a', 'proposal-1', 'tenant-a'))
            .rejects.toThrow('Proposta indisponível ou sem permissão.');
        expect(db.operations.some(op => op.action === 'delete')).toBe(false);
    });

    it('rejects standalone proposal access after tenant membership disappears', async () => {
        const db = fakeDatabase({
            'proposals:read': { data: { deal_id: null, created_by: 'author-a' }, error: null },
            'profiles:read': { data: null, error: null },
        });
        await expect(ProposalService.deleteProposal('author-a', 'proposal-1', 'tenant-a'))
            .rejects.toThrow('Não foi possível validar o acesso à proposta.');
        expect(db.operations.every(op => op.action !== 'delete')).toBe(true);
    });

    it('rejects successful-looking null or malformed proposal list responses', async () => {
        for (const result of [{ data: null, error: null }, { data: { bogus: true }, error: null }]) {
            fakeDatabase({
                'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
                'deals:read': { data: { id: 'deal-1' }, error: null },
                'proposals:read': result,
            });
            await expect(ProposalService.fetchProposals('admin', 'deal-1', 'tenant-a'))
                .rejects.toThrow('Não foi possível carregar as propostas.');
        }
    });

    it('rejects unsupported status, invalid signature option and no-op updates before queries', async () => {
        const db = fakeDatabase({});
        await expect(ProposalService.updateProposal('author', 'proposal', 'tenant', {
            status: 'invalid' as never,
        })).rejects.toThrow('Status de proposta inválido.');
        await expect(ProposalService.updateProposal('author', 'proposal', 'tenant', {
            allow_signature: 'yes' as never,
        })).rejects.toThrow('Configuração de assinatura inválida.');
        await expect(ProposalService.updateProposal('author', 'proposal', 'tenant', {
            createdBy: 'forged',
        })).rejects.toThrow('Nenhuma alteração de proposta permitida.');
        expect(db.operations).toHaveLength(0);
    });

    it('does not report success if no proposal row was updated', async () => {
        fakeDatabase({
            'proposals:read': { data: { deal_id: 'deal-1' }, error: null },
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'proposals:update': { data: null, error: null },
        });
        await expect(ProposalService.updateProposal('admin', 'proposal-1', 'tenant-a', {
            status: 'sent',
        })).rejects.toThrow('Não foi possível atualizar a proposta.');
    });

    it('rejects invalid create titles without touching the database', async () => {
        const db = fakeDatabase({});
        await expect(ProposalService.createProposal('admin', 'tenant-a', { title: '   ' }))
            .rejects.toThrow('Título da proposta inválido.');
        expect(db.operations).toHaveLength(0);
    });

    it('rejects foreign tenant account/lead references before inserting proposals', async () => {
        for (const reference of [
            { accountId: 'foreign-account' },
            { leadId: 'foreign-lead' },
        ]) {
            const db = fakeDatabase({
                'accounts:read': { data: null, error: null },
                'leads:read': { data: null, error: null },
            });
            await expect(ProposalService.createProposal('admin', 'tenant-a', {
                title: 'Proposta', number: '1001', ...reference,
            })).rejects.toThrow('Referência da proposta indisponível nesta organização.');
            expect(db.operations.every(op => op.action !== 'insert')).toBe(true);
        }
    });

    it('fails closed when the deal proposal version query fails', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'proposals:read': { data: null, error: { message: 'DB error' } },
        });
        await expect(ProposalService.createProposal('admin', 'tenant-a', {
            title: 'Proposta', number: '1001', dealId: 'deal-1',
        })).rejects.toThrow('Não foi possível consultar a versão da proposta.');
        expect(db.operations.every(op => op.action !== 'insert')).toBe(true);
    });

    it('requires an inserted proposal row before reporting success', async () => {
        fakeDatabase({ 'proposals:insert': { data: null, error: null } });
        await expect(ProposalService.createProposal('author', 'tenant', {
            title: 'Proposta', number: '1001',
        })).rejects.toThrow('Não foi possível criar a proposta.');
    });

});
