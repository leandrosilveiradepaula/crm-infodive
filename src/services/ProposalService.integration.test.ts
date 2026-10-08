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

});
