import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { ProductService } from './ProductService';

type DbResult = { data: unknown; error: { code?: string; message?: string } | null };
type Operation = { table: string; mode: 'read' | 'insert' | 'update' | 'delete'; payload?: unknown; filters: [string, unknown][] };
function fakeDb(responses: Record<string, DbResult | DbResult[]> = {}) {
    const ops: Operation[] = [];
    const queue = new Map(Object.entries(responses).map(([key, values]) =>
        [key, Array.isArray(values) ? [...values] : [values]]
    ));
    const from = vi.fn((table: string) => {
        const op: Operation = { table, mode: 'read', filters: [] };
        ops.push(op);
        const builder = {
            select() { return builder; },
            eq(key: string, value: unknown) { op.filters.push([key, value]); return builder; },
            order() { return builder; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return builder; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return builder; },
            delete() { op.mode = 'delete'; return builder; },
            single() { return Promise.resolve(take()); },
            maybeSingle() { return Promise.resolve(take()); },
            then(resolve: (value: DbResult) => unknown, reject?: (reason: unknown) => unknown) {
                return Promise.resolve(take()).then(resolve, reject);
            },
        };
        const take = (): DbResult => {
            const values = queue.get(table + ':' + op.mode);
            return values?.length ? values.shift()! : {
                data: op.mode === 'read' ? [] : { id: 'persisted' }, error: null,
            };
        };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}

describe('ProductService offline tenant and persistence integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not replace failed or malformed list responses with an empty catalog', async () => {
        fakeDb({ 'products:read': { data: null, error: { message: 'unavailable' } } });
        await expect(ProductService.getProducts('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar os produtos.');
        fakeDb({ 'products:read': { data: null, error: null } });
        await expect(ProductService.getProducts('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar os produtos.');
    });

    it('blocks invalid names before writing and does not claim null inserts succeeded', async () => {
        const db = fakeDb();
        await expect(ProductService.createProduct('user-a', 'tenant-a', { name: '  ' }))
            .resolves.toMatchObject({ success: false });
        expect(db.ops).toHaveLength(0);

        fakeDb({ 'products:insert': { data: null, error: null } });
        await expect(ProductService.createProduct('user-a', 'tenant-a', { name: 'Produto' }))
            .resolves.toMatchObject({ success: false });
    });

    it('does not allow updates to overwrite identity, tenant or audit fields', async () => {
        const db = fakeDb({ 'products:update': { data: { id: 'item-a' }, error: null } });
        await expect(ProductService.updateProduct('user-a', 'item-a', 'tenant-a', {
            name: 'novo produto', id: 'forged', organization_id: 'foreign', created_at: 'forged',
        })).resolves.toMatchObject({ success: true });
        const mutation = db.ops.find(op => op.mode === 'update');
        expect(mutation?.payload).toEqual({ name: 'Novo Produto' });
        expect(mutation?.filters).toContainEqual(['id', 'item-a']);
        expect(mutation?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('rejects identity-only updates without ever calling the database', async () => {
        const db = fakeDb();
        await expect(ProductService.updateProduct('user-a', 'item-a', 'tenant-a', {
            id: 'forged',
            organization_id: 'foreign',
        })).resolves.toMatchObject({ success: false });
        expect(db.ops).toHaveLength(0);
    });

    it('cannot report update or delete success when tenant-scoped rows are absent', async () => {
        const db = fakeDb({
            'products:update': { data: null, error: null },
            'products:delete': { data: null, error: null },
        });
        await expect(ProductService.updateProduct('user-a', 'missing', 'tenant-a', {
            name: 'Produto',
        })).resolves.toMatchObject({ success: false });
        await expect(ProductService.deleteProduct('user-a', 'missing', 'tenant-a'))
            .resolves.toMatchObject({ success: false });
        expect(db.ops.filter(op => op.mode === 'update' || op.mode === 'delete').every(
            op => op.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-a')
        )).toBe(true);
    });

    it('copies missing-SKU products with generated SKU and preserves catalog fields', async () => {
        const db = fakeDb({
            'products:read': { data: {
                id: 'source', organization_id: 'tenant-a',
                name: 'Original', category: 'Hardware', brand: 'IBM',
                sku: null, price: 120, cost: 80, show_sku_on_proposal: false,
            }, error: null },
            'products:insert': { data: { id: 'copy' }, error: null },
        });
        await expect(ProductService.duplicateProduct('user-a', 'tenant-a', 'source'))
            .resolves.toMatchObject({ success: true });
        const write = db.ops.find(op => op.mode === 'insert');
        const payload = (write?.payload as Record<string, unknown>[])[0];
        expect(payload).toMatchObject({
            organization_id: 'tenant-a', price: 120, cost: 80,
            show_sku_on_proposal: false,
        });
        expect(payload.sku).toMatch(/^SKU-COPY-[0-9a-f]{8}$/);
        expect(db.ops.find(op => op.mode === 'read')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
    });

    it('rejects a duplicate insert with no persisted row', async () => {
        fakeDb({
            'products:read': { data: { id: 'source', sku: 'CAT', name: 'Original' }, error: null },
            'products:insert': { data: null, error: null },
        });
        await expect(ProductService.duplicateProduct('user-a', 'tenant-a', 'source'))
            .resolves.toMatchObject({ success: false });
    });
});
