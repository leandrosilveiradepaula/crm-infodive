import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { AccountService } from './AccountService';

type DbResponse = { data: unknown; error: { message?: string } | null };
type Mode = 'read' | 'insert' | 'update' | 'delete' | 'upsert';
type Operation = {
    table: string;
    mode: Mode;
    payload?: unknown;
    filters: Array<[string, unknown]>;
};

type FakeBuilder = {
    select: (...args: unknown[]) => FakeBuilder;
    eq: (column: string, value: unknown) => FakeBuilder;
    order: (...args: unknown[]) => FakeBuilder;
    insert: (payload: unknown) => FakeBuilder;
    update: (payload: unknown) => FakeBuilder;
    delete: () => FakeBuilder;
    upsert: (payload: unknown, options?: unknown) => FakeBuilder;
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
            order() { return builder; },
            insert(payload: unknown) { state.mode = 'insert'; state.payload = payload; return builder; },
            update(payload: unknown) { state.mode = 'update'; state.payload = payload; return builder; },
            delete() { state.mode = 'delete'; return builder; },
            upsert(payload: unknown) { state.mode = 'upsert'; state.payload = payload; return builder; },
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

describe('AccountService offline persistence integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not turn an accounts query failure into a valid empty list', async () => {
        fakeDatabase({
            'accounts:read': { data: null, error: { message: 'database unavailable' } },
        });

        await expect(AccountService.getAccounts('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as contas.');
    });

    it('rolls back a just-created account aggregate when a child insert fails', async () => {
        const db = fakeDatabase({
            'accounts:insert': { data: { id: 'account-new' }, error: null },
            'account_contacts:insert': { data: null, error: { message: 'contact insert failed' } },
            'account_contacts:delete': { data: null, error: null },
            'account_branches:delete': { data: null, error: null },
            'accounts:delete': { data: { id: 'account-new' }, error: null },
        });

        const result = await AccountService.createAccount('user-a', 'tenant-a', {
            name: 'Cliente A',
            contacts: [{
                id: 'contact-input',
                name: 'Contato',
                email: 'contato@example.com',
                is_primary: true,
            }],
        });

        expect(result.success).toBe(false);
        const rollback = db.operations.find(operation => operation.table === 'accounts' && operation.mode === 'delete');
        expect(rollback?.filters).toContainEqual(['id', 'account-new']);
        expect(rollback?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('restores previous contacts if replacement fails during account update', async () => {
        const oldContact = {
            id: 'contact-old',
            account_id: 'account-1',
            organization_id: 'tenant-a',
            name: 'Anterior',
            email: 'old@example.com',
            is_primary: true,
        };
        const db = fakeDatabase({
            'accounts:read': { data: { id: 'account-1' }, error: null },
            'account_contacts:read': { data: [oldContact], error: null },
            'account_contacts:delete': [
                { data: [{ id: 'contact-old' }], error: null },
                { data: null, error: null },
            ],
            'account_contacts:insert': [
                { data: null, error: { message: 'replacement failed' } },
                { data: { id: 'contact-old' }, error: null },
            ],
        });

        const result = await AccountService.updateAccount('user-a', 'tenant-a', 'account-1', {
            contacts: [{
                id: 'contact-new',
                name: 'Novo',
                email: 'new@example.com',
                is_primary: true,
            }],
        });

        expect(result.success).toBe(false);
        const inserts = db.operations.filter(operation => operation.table === 'account_contacts' && operation.mode === 'insert');
        expect(inserts).toHaveLength(2);
        expect(inserts[1]?.payload).toEqual([oldContact]);
    });

    it('does not report account deletion success when no tenant-scoped row was affected', async () => {
        fakeDatabase({
            'accounts:delete': { data: null, error: null },
        });

        await expect(AccountService.deleteAccount('user-a', 'tenant-a', 'missing-account'))
            .resolves.toMatchObject({ success: false });
    });

    it('fails an imported row instead of moving an existing email contact to another account', async () => {
        const db = fakeDatabase({
            'accounts:upsert': {
                data: { id: 'account-new', created_at: '2026-10-08T00:00:00Z', updated_at: '2026-10-08T00:00:00Z' },
                error: null,
            },
            'account_contacts:read': {
                data: { id: 'contact-existing', account_id: 'account-other' },
                error: null,
            },
        });

        const result = await AccountService.bulkCreateAccounts('user-a', 'tenant-a', [{
            name: 'Cliente A',
            cnpj: '12345678000100',
            contacts: [{ name: 'Contato', email: 'same@example.com' }],
        }]);

        expect(result).toMatchObject({ created: 0, updated: 0, failed: 1 });
        expect(db.operations.some(operation =>
            operation.table === 'account_contacts' &&
            (operation.mode === 'update' || operation.mode === 'insert')
        )).toBe(false);
    });
});
