import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { UserService } from './UserService';

type Result = { data: unknown; error: { message: string } | null };
type Operation = { table: string; action: string; filters: [string, unknown][]; payload?: unknown };
function fakeDb(results: Record<string, Result>) {
    const ops: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, action: 'read', filters: [] };
        ops.push(op);
        const result = () => results[table + ':' + op.action] || results[table] || { data: [], error: null };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            update(payload: unknown) { op.action = 'update'; op.payload = payload; return q; },
            insert(payload: unknown) { op.action = 'insert'; op.payload = payload; return q; },
            maybeSingle() { return Promise.resolve(result()); },
            then(ok: (v: Result) => unknown) { return Promise.resolve(result()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}

describe('UserService offline tenant and persistence integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects null user lists and unknown roles, retaining support mapping', async () => {
        fakeDb({ profiles: { data: null, error: null } });
        expect((await UserService.getUsers('tenant-a')).error).toBeTruthy();
        fakeDb({ profiles: { data: [{ role: 'alien' }], error: null } });
        expect((await UserService.getUsers('tenant-a')).error).toBeTruthy();
        fakeDb({ profiles: { data: [{ id: 'u', role: 'support' }], error: null } });
        expect((await UserService.getUsers('tenant-a')).users[0].role).toBe('support');
    });

    it('validates roles and confirms a tenant-scoped row was updated', async () => {
        const invalid = fakeDb({});
        await expect(UserService.updateUserRole('u', 'tenant-a', 'superadmin')).resolves.toMatchObject({ success: false });
        expect(invalid.from).not.toHaveBeenCalled();
        const db = fakeDb({ 'profiles:update': { data: null, error: null } });
        await expect(UserService.updateUserRole('u', 'tenant-a', 'manager')).resolves.toMatchObject({ success: false });
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('rejects invalid user profile changes before write and verifies affected row', async () => {
        const invalid = fakeDb({});
        await expect(UserService.updateUserProfile('u', 'tenant-a', { role: 'unknown' })).resolves.toMatchObject({ success: false });
        await expect(UserService.updateUserProfile('u', 'tenant-a', {})).resolves.toMatchObject({ success: false });
        expect(invalid.from).not.toHaveBeenCalled();
        fakeDb({ 'profiles:update': { data: null, error: null } });
        await expect(UserService.updateUserProfile('u', 'tenant-a', { full_name: 'New' })).resolves.toMatchObject({ success: false });
    });

    it('validates self-profile fields and requires a persisted scoped update', async () => {
        const invalid = fakeDb({});
        await expect(UserService.updateMyProfile('u', 'tenant-a', { full_name: ' ' })).resolves.toMatchObject({ success: false });
        expect(invalid.from).not.toHaveBeenCalled();
        const db = fakeDb({ 'profiles:update': { data: null, error: null } });
        await expect(UserService.updateMyProfile('u', 'tenant-a', { full_name: 'Valid' })).resolves.toMatchObject({ success: false });
        expect(db.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('does not create invitations on invalid role, failed lookup, or null insert', async () => {
        const invalid = fakeDb({});
        await expect(UserService.createInvitation('a@example.test', 'god', 'tenant-a', 'admin')).resolves.toMatchObject({ success: false });
        expect(invalid.from).not.toHaveBeenCalled();
        let db = fakeDb({ profiles: { data: null, error: { message: 'db unavailable' } } });
        await expect(UserService.createInvitation('a@example.test', 'sales', 'tenant-a', 'admin')).resolves.toMatchObject({ success: false });
        expect(db.ops.every(op => op.table !== 'invitations')).toBe(true);
        db = fakeDb({ profiles: { data: null, error: null }, 'invitations:insert': { data: null, error: null } });
        await expect(UserService.createInvitation('a@example.test', 'sales', 'tenant-a', 'admin')).resolves.toMatchObject({ success: false });
        expect(db.ops.find(op => op.table === 'invitations')?.payload).toMatchObject({ organization_id: 'tenant-a', role: 'vendedor' });
    });
});
