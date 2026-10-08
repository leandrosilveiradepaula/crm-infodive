import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { ContactService } from './ContactService';

type Result = { data: unknown; error: { message?: string } | null };
type Operation = { table: string; action: string; filters: [string, unknown][]; payload?: unknown };
type FakeQuery = {
    select: () => FakeQuery;
    eq: (key: string, value: unknown) => FakeQuery;
    order: () => FakeQuery;
    limit: () => FakeQuery;
    insert: (payload: unknown) => FakeQuery;
    update: (payload: unknown) => FakeQuery;
    delete: () => FakeQuery;
    single: () => Promise<Result>;
    maybeSingle: () => Promise<Result>;
    then: (ok: (value: Result) => unknown, fail?: (reason: unknown) => unknown) => Promise<unknown>;
};
function database(responses: Record<string, Result | Result[]>) {
    const operations: Operation[] = [];
    const queues = new Map(Object.entries(responses).map(([key, value]) => [key, Array.isArray(value) ? [...value] : [value]]));
    const from = vi.fn((table: string) => {
        const state: Operation = { table, action: 'select', filters: [] };
        operations.push(state);
        const query: FakeQuery = {
            select() { return query; },
            eq(key: string, value: unknown) { state.filters.push([key, value]); return query; },
            order() { return query; },
            limit() { return query; },
            insert(payload: unknown) { state.action = 'insert'; state.payload = payload; return query; },
            update(payload: unknown) { state.action = 'update'; state.payload = payload; return query; },
            delete() { state.action = 'delete'; return query; },
            single() { return Promise.resolve(take()); },
            maybeSingle() { return Promise.resolve(take()); },
            then(ok: (value: Result) => unknown, fail?: (reason: unknown) => unknown) { return Promise.resolve(take()).then(ok, fail); },
        };
        function take(): Result {
            const queue = queues.get(table + ':' + state.action);
            return queue?.length ? queue.shift()! : { data: state.action === 'select' ? [] : { id: 'contact-1' }, error: null };
        }
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations };
}

describe('ContactService offline integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('propagates list failures instead of presenting an empty list', async () => {
        database({ 'account_contacts:select': { data: null, error: { message: 'offline' } } });
        await expect(ContactService.getAccountContacts('u', 'tenant')).rejects.toThrow('Não foi possível carregar os contatos.');
    });

    it('blocks creation against another tenant account before any write', async () => {
        const db = database({ 'accounts:select': { data: null, error: null } });
        await expect(ContactService.createContact('u', 'tenant', { name: 'A', account_id: 'other-account' }))
            .rejects.toThrow('Conta não encontrada nesta organização.');
        expect(db.operations.some(op => op.action === 'insert')).toBe(false);
        expect(db.operations.find(op => op.table === 'accounts')?.filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('rejects duplicate check errors without inserting', async () => {
        const db = database({
            'accounts:select': { data: { id: 'account-1' }, error: null },
            'account_contacts:select': { data: null, error: { message: 'failed' } },
        });
        await expect(ContactService.createContact('u', 'tenant', { name: 'A', account_id: 'account-1', email: 'a@example.com' }))
            .rejects.toThrow('Não foi possível verificar contatos duplicados.');
        expect(db.operations.some(op => op.action === 'insert')).toBe(false);
    });

    it('allows only explicit writable fields and checks tenant on reassignment', async () => {
        const db = database({ 'accounts:select': { data: { id: 'account-2' }, error: null } });
        await ContactService.updateContact('u', 'contact-1', 'tenant', {
            name: 'maria', account_id: 'account-2', organization_id: 'forged', id: 'forged',
        } as unknown as Parameters<typeof ContactService.updateContact>[3]);
        const update = db.operations.find(op => op.action === 'update');
        expect(update?.payload).not.toHaveProperty('organization_id');
        expect(update?.payload).not.toHaveProperty('id');
        expect(update?.filters).toContainEqual(['organization_id', 'tenant']);
    });

    it('does not report success when update or delete affect zero rows', async () => {
        database({ 'account_contacts:update': { data: null, error: null } });
        await expect(ContactService.updateContact('u', 'missing', 'tenant', { name: 'A' }))
            .rejects.toThrow('Não foi possível atualizar o contato.');
        database({ 'account_contacts:delete': { data: null, error: null } });
        await expect(ContactService.deleteContact('u', 'missing', 'tenant'))
            .rejects.toThrow('Não foi possível excluir o contato.');
    });
});
