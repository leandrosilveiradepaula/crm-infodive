import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { DealService } from './DealService';

type DbResponse = { data: unknown; error: { code?: string; message?: string } | null };

type FakeBuilder = {
    select: (...args: unknown[]) => FakeBuilder;
    eq: (column: string, value: unknown) => FakeBuilder;
    in: (column: string, values: unknown[]) => FakeBuilder;
    order: (...args: unknown[]) => FakeBuilder;
    limit: (...args: unknown[]) => FakeBuilder;
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
type Operation = {
    table: string;
    mode: 'read' | 'insert' | 'update' | 'delete';
    payload?: unknown;
    filters: Array<[string, unknown]>;
};

function fakeDatabase(responses: Record<string, DbResponse | DbResponse[]>) {
    const operations: Operation[] = [];
    const queues = new Map<string, DbResponse[]>();
    for (const [key, value] of Object.entries(responses)) {
        queues.set(key, Array.isArray(value) ? [...value] : [value]);
    }

    function take(table: string, mode: Operation['mode']): DbResponse {
        const key = table + ':' + mode;
        const queue = queues.get(key) || queues.get(table);
        if (queue?.length) return queue.shift()!;
        return { data: mode === 'read' ? [] : { id: 'row-1' }, error: null };
    }

    const from = vi.fn((table: string) => {
        const state: Operation = { table, mode: 'read', filters: [] };
        operations.push(state);
        const builder: FakeBuilder = {
            select() { return builder; },
            eq(column: string, value: unknown) { state.filters.push([column, value]); return builder; },
            in(column: string, values: unknown[]) { state.filters.push([column, values]); return builder; },
            order() { return builder; },
            limit() { return builder; },
            insert(payload: unknown) { state.mode = 'insert'; state.payload = payload; return builder; },
            update(payload: unknown) { state.mode = 'update'; state.payload = payload; return builder; },
            delete() { state.mode = 'delete'; return builder; },
            single() { return Promise.resolve(take(table, state.mode)); },
            maybeSingle() { return Promise.resolve(take(table, state.mode)); },
            then(resolve: (value: DbResponse) => unknown, reject?: (reason: unknown) => unknown) {
                return Promise.resolve(take(table, state.mode)).then(resolve, reject);
            },
        };
        return builder;
    });

    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}

describe('DealService offline tenant and mutation integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('tenant-scopes the role decision and does not turn a failed pipeline read into an empty pipeline', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'deals:read': { data: null, error: { message: 'database unavailable' } },
        });

        await expect(DealService.getPipelineData('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar o pipeline.');

        const roleQuery = db.operations.find(operation => operation.table === 'profiles');
        expect(roleQuery?.filters).toContainEqual(['id', 'user-a']);
        expect(roleQuery?.filters).toContainEqual(['organization_id', 'tenant-a']);

        const dealQuery = db.operations.find(operation => operation.table === 'deals');
        expect(dealQuery?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(dealQuery?.filters).toContainEqual(['owner_id', 'user-a']);
    });

    it('distinguishes a failed detail query from a genuinely missing deal', async () => {
        fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: null, error: { message: 'query failed' } },
        });

        await expect(DealService.getDealDetails('admin-a', 'deal-1', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar a oportunidade.');

        fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });

        await expect(DealService.getDealDetails('admin-a', 'missing-deal', 'tenant-a'))
            .resolves.toBeNull();
    });

    it('rejects owner reassignment by a non-manager and cross-tenant target owners', async () => {
        let db = fakeDatabase({
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
        });

        await expect(DealService.updateDeal('seller-a', 'deal-1', 'tenant-a', { owner_id: 'user-b' }))
            .rejects.toThrow('Não foi possível alterar o responsável pela oportunidade.');
        expect(db.operations.some(operation => operation.table === 'deals' && operation.mode === 'update')).toBe(false);

        db = fakeDatabase({
            'profiles:read': [
                { data: { role: 'admin', roles: [] }, error: null },
                { data: null, error: null },
            ],
        });

        await expect(DealService.updateDeal('admin-a', 'deal-1', 'tenant-a', { owner_id: 'other-tenant-user' }))
            .rejects.toThrow('Não foi possível alterar o responsável pela oportunidade.');

        const targetOwnerQuery = db.operations
            .filter(operation => operation.table === 'profiles')[1];
        expect(targetOwnerQuery?.filters).toContainEqual(['id', 'other-tenant-user']);
        expect(targetOwnerQuery?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.some(operation => operation.table === 'deals' && operation.mode === 'update')).toBe(false);
    });

    it('does not let a salesperson duplicate a deal outside the existing owner visibility boundary', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'seller', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });

        await expect(DealService.duplicateDeal('user-a', 'deal-b', 'tenant-a'))
            .rejects.toThrow('Não foi possível duplicar a oportunidade.');

        const dealRead = db.operations.find(operation => operation.table === 'deals' && operation.mode === 'read');
        expect(dealRead?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(dealRead?.filters).toContainEqual(['owner_id', 'user-a']);
        expect(db.operations.some(operation => operation.mode === 'insert')).toBe(false);
    });

    it('rolls back the new deal and reports failure when product duplication fails', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1', title: 'Original', owner_id: 'user-x', organization_id: 'tenant-a' }, error: null },
            'deal_products:read': { data: [{ id: 'product-row-1', name: 'Produto' }], error: null },
            'deals:insert': { data: { id: 'deal-copy', title: 'Cópia de Original' }, error: null },
            'deal_products:insert': { data: null, error: { message: 'insert failed' } },
            'deals:delete': { data: { id: 'deal-copy' }, error: null },
        });

        await expect(DealService.duplicateDeal('admin-a', 'deal-1', 'tenant-a'))
            .rejects.toThrow('Não foi possível duplicar os produtos da oportunidade.');

        const rollback = db.operations.find(operation => operation.table === 'deals' && operation.mode === 'delete');
        expect(rollback?.filters).toContainEqual(['id', 'deal-copy']);
        expect(rollback?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('does not report product deletion success when no tenant-scoped row was affected', async () => {
        fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'deal_products:read': { data: { deal_id: 'deal-1' }, error: null },
            'deal_products:delete': { data: null, error: null },
        });

        await expect(DealService.removeDealProduct('user-a', 'missing-item', 'tenant-a'))
            .rejects.toThrow('Não foi possível remover o produto da oportunidade.');
    });

    it('rejects partial bulk deletion and validates reorder results instead of ignoring Supabase errors', async () => {
        fakeDatabase({
            'deal_products:delete': { data: [{ id: 'item-1' }], error: null },
        });
        await expect(DealService.bulkRemoveDealProducts('user-a', ['item-1', 'item-2'], 'tenant-a'))
            .rejects.toThrow('Não foi possível atualizar os produtos da oportunidade.');

        const db = fakeDatabase({
            'deal_products:update': [
                { data: { id: 'item-1' }, error: null },
                { data: null, error: { message: 'write failed' } },
            ],
        });
        await expect(DealService.reorderDealProducts('user-a', 'tenant-a', [
            { id: 'item-1', display_order: 0 },
            { id: 'item-2', display_order: 1 },
        ])).rejects.toThrow('Falha ao reordenar alguns produtos');

        expect(db.operations.filter(operation => operation.table === 'deal_products' && operation.mode === 'update'))
            .toHaveLength(2);
    });
    it('does not allow product edit payloads to overwrite identity or tenant fields', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'deal_products:read': { data: { deal_id: 'deal-1' }, error: null },
            'deal_products:update': { data: { id: 'item-1' }, error: null },
        });
        await DealService.updateDealProduct('user-a', 'item-1', 'tenant-a', {
            name: 'Produto seguro',
            organization_id: 'tenant-b',
            deal_id: 'deal-other',
            id: 'other',
        } as unknown as Parameters<typeof DealService.updateDealProduct>[3]);
        const update = db.operations.find(operation => operation.table === 'deal_products' && operation.mode === 'update');
        expect(update?.payload).toEqual({ name: 'Produto seguro' });
        expect(update?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('fails closed when catalog verification errors before bulk insert', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'products:read': { data: null, error: { message: 'catalog unavailable' } },
        });
        await expect(DealService.bulkAddDealProducts('user-a', 'deal-1', 'tenant-a', [
            { name: 'Produto', product_id: '11111111-1111-4111-8111-111111111111' },
        ])).rejects.toThrow('Não foi possível validar os produtos selecionados.');
        expect(db.operations.some(operation => operation.table === 'deal_products' && operation.mode === 'insert')).toBe(false);
    });

    it('rejects partial bulk inserts instead of declaring success', async () => {
        fakeDatabase({
            'profiles:read': { data: { role: 'admin', roles: [] }, error: null },
            'deals:read': { data: { id: 'deal-1' }, error: null },
            'deal_products:insert': { data: [{ id: 'item-1' }], error: null },
        });
        await expect(DealService.bulkAddDealProducts('user-a', 'deal-1', 'tenant-a', [
            { name: 'Produto 1' }, { name: 'Produto 2' },
        ])).rejects.toThrow('Não foi possível atualizar todos os produtos da oportunidade.');
    });

    it('prevents a salesperson from reading or creating a room for someone else\'s deal', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        const result = await DealService.getOrCreateRoom('seller-a', 'deal-b', 'tenant-a');
        expect(result).toMatchObject({ error: 'Acesso negado ou oportunidade não encontrada' });
        const dealQuery = db.operations.find(operation => operation.table === 'deals');
        expect(dealQuery?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(dealQuery?.filters).toContainEqual(['owner_id', 'seller-a']);
        expect(db.operations.some(operation => operation.table === 'deal_rooms')).toBe(false);
    });

    it('blocks product inserts when the parent deal is not visible in the tenant', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
        });
        await expect(DealService.addDealProduct('seller-a', 'deal-b', 'tenant-a', { name: 'Produto' }))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        await expect(DealService.bulkAddDealProducts('seller-a', 'deal-b', 'tenant-a', [{ name: 'Produto' }]))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        expect(db.operations.filter(op => op.table === 'deal_products' && op.mode === 'insert')).toHaveLength(0);
        const parentReads = db.operations.filter(op => op.table === 'deals' && op.mode === 'read');
        expect(parentReads).toHaveLength(2);
        for (const read of parentReads) {
            expect(read.filters).toContainEqual(['owner_id', 'seller-a']);
            expect(read.filters).toContainEqual(['organization_id', 'tenant-a']);
        }
    });

    it('blocks modification or deletion of a product whose deal is not accessible', async () => {
        const db = fakeDatabase({
            'profiles:read': { data: { role: 'vendedor', roles: [] }, error: null },
            'deals:read': { data: null, error: null },
            'deal_products:read': { data: { deal_id: 'other-deal' }, error: null },
        });
        await expect(DealService.updateDealProduct('seller-a', 'item-1', 'tenant-a', { name: 'Changed' }))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        await expect(DealService.removeDealProduct('seller-a', 'item-1', 'tenant-a'))
            .rejects.toThrow('Oportunidade indisponível ou sem permissão.');
        expect(db.operations.some(op => op.table === 'deal_products' && ['update','delete'].includes(op.mode))).toBe(false);
    });

});
