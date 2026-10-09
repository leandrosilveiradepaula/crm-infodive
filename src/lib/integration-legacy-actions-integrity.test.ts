import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requirePermission: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('@/lib/auth-server', () => ({ requirePermission: mocks.requirePermission }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import {
    createApiKey,
    getApiKeys,
    removeApiKey,
    revokeApiKey,
} from '@/app/(dashboard)/integrations/apikey-actions';
import {
    createWebhook,
    getWebhooks,
    removeWebhook,
} from '@/app/(dashboard)/integrations/webhook-actions';

type Result = { data: unknown; error: { message?: string } | null };
type Op = {
    table: string;
    mode: 'read' | 'insert' | 'update' | 'delete';
    filters: Array<[string, unknown]>;
    payload?: unknown;
};

function fakeDb(responses: Record<string, Result>) {
    const ops: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        ops.push(op);

        const take = (): Result =>
            responses[`${table}:${op.mode}`] ??
            responses[table] ??
            { data: [], error: null };

        const query: any = {
            select() { return query; },
            order() { return query; },
            eq(key: string, value: unknown) {
                op.filters.push([key, value]);
                return query;
            },
            insert(payload: unknown) {
                op.mode = 'insert';
                op.payload = payload;
                return query;
            },
            update(payload: unknown) {
                op.mode = 'update';
                op.payload = payload;
                return query;
            },
            delete() {
                op.mode = 'delete';
                return query;
            },
            maybeSingle() {
                return Promise.resolve(take());
            },
            then(ok: (value: Result) => unknown, fail?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(ok, fail);
            },
        };

        return query;
    });

    mocks.createAdminClient.mockReturnValue({ from });
    return { from, ops };
}

describe('legacy integration server actions integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({
            userId: 'user-a',
            organizationId: 'tenant-a',
        });
    });

    it('fails closed for malformed API-key reads while preserving a legitimate empty list', async () => {
        fakeDb({ api_keys: { data: null, error: null } });
        await expect(getApiKeys()).rejects.toThrow('Não foi possível carregar as chaves de integração.');

        fakeDb({ api_keys: { data: [], error: null } });
        await expect(getApiKeys()).resolves.toEqual([]);
    });

    it('validates API-key creation and requires the persisted row before returning it', async () => {
        const invalid = fakeDb({});
        await expect(createApiKey('   ')).rejects.toThrow('Nome da chave inválido.');
        expect(invalid.from).not.toHaveBeenCalled();

        fakeDb({ 'api_keys:insert': { data: null, error: null } });
        await expect(createApiKey('ERP')).rejects.toThrow('Não foi possível criar a chave de integração.');

        const persisted = { id: 'key-a', name: 'ERP', token_prefix: 'ak_123456', status: 'active' };
        const db = fakeDb({ 'api_keys:insert': { data: persisted, error: null } });
        await expect(createApiKey(' ERP ')).resolves.toEqual(persisted);
        expect(db.ops[0].payload).toEqual([expect.objectContaining({
            name: 'ERP',
            organization_id: 'tenant-a',
        })]);
    });

    it('does not report API-key revoke/delete success when no tenant-scoped row changed', async () => {
        let db = fakeDb({ 'api_keys:update': { data: null, error: null } });
        await expect(revokeApiKey('key-a')).rejects.toThrow('Não foi possível revogar a chave de integração.');
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);

        db = fakeDb({ 'api_keys:delete': { data: null, error: null } });
        await expect(removeApiKey('key-a')).rejects.toThrow('Não foi possível excluir a chave de integração.');
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('fails closed for webhook reads and validates creation before privileged persistence', async () => {
        fakeDb({ webhooks: { data: null, error: { message: 'db unavailable' } } });
        await expect(getWebhooks()).rejects.toThrow('Não foi possível carregar os webhooks.');

        const invalid = fakeDb({});
        await expect(createWebhook({ url: '', events: [], status: 'active' }))
            .rejects.toThrow('Configuração de webhook inválida.');
        expect(invalid.from).not.toHaveBeenCalled();

        fakeDb({ 'webhooks:insert': { data: null, error: null } });
        await expect(createWebhook({
            url: 'https://example.test/hook',
            events: ['deal.created'],
            status: 'active',
        })).rejects.toThrow('Não foi possível criar o webhook.');
    });

    it('requires an affected tenant-scoped webhook row before reporting deletion success', async () => {
        const db = fakeDb({ 'webhooks:delete': { data: null, error: null } });
        await expect(removeWebhook('hook-a')).rejects.toThrow('Não foi possível excluir o webhook.');
        expect(db.ops[0].filters).toContainEqual(['id', 'hook-a']);
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
});
