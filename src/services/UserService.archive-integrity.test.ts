import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { UserService } from './UserService';

type Result = { data: unknown; error: { message: string } | null };
type Operation = {
    table: string;
    mode: 'read' | 'update';
    filters: Array<[string, unknown]>;
    payload?: unknown;
};
function fakeDb(resolve: (operation: Operation) => Result) {
    const operations: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, mode: 'read', filters: [] };
        operations.push(op);
        const query = {
            select() { return query; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return query; },
            in(k: string, v: unknown) { op.filters.push([k, v]); return query; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return query; },
            maybeSingle() { return Promise.resolve(resolve(op)); },
            then(ok: (result: Result) => unknown) {
                return Promise.resolve(resolve(op)).then(ok);
            },
        };
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}

function standardResult(op: Operation): Result {
    if (op.table === 'profiles' && op.mode === 'read') {
        return { data: { id: op.filters.find(([k]) => k === 'id')?.[1], status: 'active' }, error: null };
    }
    if (op.table === 'profiles' && op.mode === 'update') {
        return { data: { id: 'user-a' }, error: null };
    }
    if (op.table === 'deals' && op.mode === 'read') {
        return { data: [{ id: 'deal-a' }], error: null };
    }
    if (op.table === 'deals' && op.mode === 'update') {
        return { data: [{ id: 'deal-a' }], error: null };
    }
    return { data: null, error: null };
}

describe('privileged UserService archive integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('blocks missing actor, self-archive and invalid reassignment before database access', async () => {
        const db = fakeDb(standardResult);
        await expect(UserService.archiveUser('user-a', 'tenant-a')).resolves.toMatchObject({ success: false });
        await expect(UserService.archiveUser('user-a', 'tenant-a', undefined, 'user-a')).resolves.toMatchObject({ success: false });
        await expect(UserService.archiveUser('user-a', 'tenant-a', 'user-a', 'admin-a')).resolves.toMatchObject({ success: false });
        expect(db.from).not.toHaveBeenCalled();
    });

    it('rejects missing or inactive archive targets without changing deals or profiles', async () => {
        const db = fakeDb(op => op.table === 'profiles' && op.mode === 'read'
            ? { data: null, error: null } : standardResult(op));
        await expect(UserService.archiveUser('user-a', 'tenant-a', undefined, 'admin-a'))
            .resolves.toMatchObject({ success: false });
        expect(db.operations).toHaveLength(1);
        expect(db.operations[0].filters).toContainEqual(['organization_id', 'tenant-a']);

        const inactive = fakeDb(op => op.table === 'profiles' && op.mode === 'read'
            ? { data: { id: 'user-a', status: 'inactive' }, error: null } : standardResult(op));
        await expect(UserService.archiveUser('user-a', 'tenant-a', undefined, 'admin-a'))
            .resolves.toMatchObject({ success: false });
        expect(inactive.operations.every(op => op.mode === 'read')).toBe(true);
    });

    it('rejects an inactive/foreign replacement before transferring deals', async () => {
        const db = fakeDb(op => op.table === 'profiles' && op.mode === 'read' &&
            op.filters.some(([key, value]) => key === 'id' && value === 'other-a')
            ? { data: null, error: null } : standardResult(op));
        await expect(UserService.archiveUser('user-a', 'tenant-a', 'other-a', 'admin-a'))
            .resolves.toMatchObject({ success: false });
        expect(db.operations.some(op => op.table === 'deals')).toBe(false);
        expect(db.operations.filter(op => op.table === 'profiles')
            .every(op => op.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-a'))).toBe(true);
    });

    it('detects transfer row-count mismatch and does not archive', async () => {
        const db = fakeDb(op => op.table === 'deals' && op.mode === 'update'
            ? { data: [], error: null } : standardResult(op));
        await expect(UserService.archiveUser('user-a', 'tenant-a', 'other-a', 'admin-a'))
            .resolves.toMatchObject({ success: false });
        expect(db.operations.find(op => op.table === 'deals' && op.mode === 'update')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.some(op => op.table === 'profiles' && op.mode === 'update')).toBe(false);
    });

    it('rejects a zero-row archive even after valid preconditions', async () => {
        const db = fakeDb(op => op.table === 'profiles' && op.mode === 'update'
            ? { data: null, error: null } : standardResult(op));
        await expect(UserService.archiveUser('user-a', 'tenant-a', undefined, 'admin-a'))
            .resolves.toMatchObject({ success: false });
        expect(db.operations.find(op => op.table === 'profiles' && op.mode === 'update')?.filters)
            .toContainEqual(['status', 'active']);
    });

    it('archives an active tenant user only with verified transfers and affected profile', async () => {
        const db = fakeDb(standardResult);
        await expect(UserService.archiveUser('user-a', 'tenant-a', 'other-a', 'admin-a'))
            .resolves.toEqual({ success: true });
        const transfer = db.operations.find(op => op.table === 'deals' && op.mode === 'update');
        expect(transfer?.payload).toEqual({ owner_id: 'other-a' });
        expect(transfer?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.operations.find(op => op.table === 'profiles' && op.mode === 'update')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
    });
});
