import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { ContactService } from './ContactService';

type DbResponse = { data: unknown; error: { message?: string } | null };
type Mode = 'read' | 'insert' | 'update' | 'delete';
type Operation = {
    table: string;
    mode: Mode;
    filters: Array<[string, unknown]>;
    payload?: unknown;
};

type FakeBuilder = {
    select: (...args: unknown[]) => FakeBuilder;
    eq: (column: string, value: unknown) => FakeBuilder;
    neq: (column: string, value: unknown) => FakeBuilder;
    order: (...args: unknown[]) => FakeBuilder;
    limit: (...args: unknown[]) => Promise<DbResponse>;
    insert: (payload: unknown) => FakeBuilder;
    update: (payload: unknown) => FakeBuilder;
    delete: () => FakeBuilder;
    single: () => Promise<DbResponse>;
    maybeSingle: () => Promise<DbResponse>;
    then: (
        resolve: (value: DbResponse) => unknown,
        reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
};

function fakeDatabase(responses: Record<string, DbResponse | DbResponse[]>) {
    const operations: Operation[] = [];
    const queues = new Map<string, DbResponse[]>();
    for (const [key, value] of Object.entries(responses)) {
        queues.set(key, Array.isArray(value) ? [...value] : [value]);
    }

    function take(table: string, mode: Mode): DbResponse {
        const queue = queues.get(table + ':' + mode) || queues.get(table);
        if (queue?.length) return queue.shift()!;
        return { data: mode === 'read' ? [] : { id: 'row-1' }, error: null };
    }

    const from = vi.fn((table: string) => {
        const state: Operation = { table, mode: 'read', filters: [] };
        operations.push(state);
        const builder: FakeBuilder = {
            select() { return builder; },
            eq(column: string, value: unknown) { state.filters.push([column, value]); return builder; },
            neq(column: string, value: unknown) { state.filters.push(['neq:' + column, value]); return builder; },
            order() { return builder; },
            limit() { return Promise.resolve(take(table, state.mode)); },
            insert(payload: unknown) { state.mode = 'insert'; state.payload = payload; return builder; },
            update(payload: unknown) { state.mode = 'update'; state.payload = payload; return builder; },
            delete() { state.mode = 'delete'; return builder; },
            single() { return Promise.resolve(take(table, state.mode)); },
            maybeSingle() { return Promise.resolve(take(table, state.mode)); },
            then(resolve, reject) {
                return Promise.resolve(take(table, state.mode)).then(resolve, reject);
            },
        };
        return builder;
    });

    mocks.createAdminClient.mockReturnValue({ from });
    return { operations };
}

describe('ContactService offline tenant and mutation integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not turn an account-contact query failure into a valid empty list', async () => {
        fakeDatabase({
            'account_contacts:read': { data: null, error: { message: 'database unavailable' } },
        });

        await expect(ContactService.getAccountContacts('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar os contatos.');
    });

    it('fails closed when duplicate validation cannot query the database', async () => {
        const db = fakeDatabase({
            'account_contacts:read': { data: null, error: { message: 'duplicate lookup failed' } },
        });

        await expect(ContactService.createContact('user-a', 'tenant-a', {
            name: 'Contato',
            email: 'contato@example.com',
            is_primary: false,
        })).rejects.toThrow('Não foi possível validar a duplicidade do contato.');

        expect(db.operations.some(operation => operation.mode === 'insert')).toBe(false);
    });

    it('rejects a contact linked to an account from another organization before insertion', async () => {
        const db = fakeDatabase({
            'accounts:read': { data: null, error: null },
        });

        await expect(ContactService.createContact('user-a', 'tenant-a', {
            name: 'Contato',
            email: 'contato@example.com',
            account_id: 'account-other-tenant',
            is_primary: false,
        })).rejects.toThrow('A conta vinculada ao contato é inválida.');

        const accountLookup = db.operations.find(operation => operation.table === 'accounts');
        expect(accountLookup?.filters).toContainEqual(['id', 'account-other-tenant']);
        expect(accountLookup?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.some(operation => operation.mode === 'insert')).toBe(false);
    });

    it('applies duplicate validation to updates while excluding the edited contact', async () => {
        const db = fakeDatabase({
            'account_contacts:read': { data: [{ id: 'contact-other' }], error: null },
        });

        await expect(ContactService.updateContact('user-a', 'contact-1', 'tenant-a', {
            email: 'duplicado@example.com',
        })).rejects.toThrow('Já existe um contato com estes dados.');

        const duplicateLookup = db.operations.find(operation =>
            operation.table === 'account_contacts' &&
            operation.mode === 'read'
        );
        expect(duplicateLookup?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(duplicateLookup?.filters).toContainEqual(['email', 'duplicado@example.com']);
        expect(duplicateLookup?.filters).toContainEqual(['neq:id', 'contact-1']);
        expect(db.operations.some(operation => operation.mode === 'update')).toBe(false);
    });

    it('does not report update or delete success when no tenant-scoped row was affected', async () => {
        fakeDatabase({
            'account_contacts:update': { data: null, error: null },
        });
        await expect(ContactService.updateContact('user-a', 'missing-contact', 'tenant-a', {
            role: 'Diretoria',
        })).rejects.toThrow('Não foi possível atualizar o contato.');

        fakeDatabase({
            'account_contacts:delete': { data: null, error: null },
        });
        await expect(ContactService.deleteContact('user-a', 'missing-contact', 'tenant-a'))
            .rejects.toThrow('Não foi possível excluir o contato.');
    });
});
