import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), requirePermission: vi.fn() }));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./auth-server', () => ({ requirePermission: mocks.requirePermission }));

import { getAuditLogs } from '../app/(dashboard)/settings/audit-actions';
import { getUsers, updateUserAction, archiveUserAction } from '../app/(dashboard)/settings/users-actions';

type Result = { data: unknown; error: { message: string } | null };
type Operation = { table: string; action: string; filters: [string, unknown][] };
function db(results: Record<string, Result>) {
    const ops: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, action: 'read', filters: [] };
        ops.push(op);
        const result = () => results[table + ':' + op.action] || results[table] || { data: [], error: null };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            order() { return q; },
            update() { op.action = 'update'; return q; },
            maybeSingle() { return Promise.resolve(result()); },
            then(ok: (v: Result) => unknown) { return Promise.resolve(result()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}
describe('administrative actions offline integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ userId: 'admin-a', organizationId: 'tenant-a' });
    });
    it('audit list fails closed on error/malformed and preserves genuine empty', async () => {
        db({ audit_logs: { data: null, error: null } });
        await expect(getAuditLogs()).rejects.toThrow('Não foi possível carregar os registros de auditoria.');
        db({ audit_logs: { data: [], error: null } });
        await expect(getAuditLogs()).resolves.toEqual([]);
    });
    it('user list rejects malformed data and unknown roles', async () => {
        db({ profiles: { data: null, error: null } });
        await expect(getUsers()).resolves.toMatchObject({ success: false });
        db({ profiles: { data: [{ id: 'u', role: 'mystery', roles: [] }], error: null } });
        await expect(getUsers()).resolves.toMatchObject({ success: false });
    });
    it('user list preserves support role', async () => {
        db({ profiles: { data: [{ id: 'u', role: 'support', roles: ['support'] }], error: null } });
        const result = await getUsers();
        expect(result.success).toBe(true);
        expect(result.data?.[0].role).toBe('support');
    });
    it('invalid roles and empty changes cannot write', async () => {
        const fake = db({});
        await expect(updateUserAction('u', { role: 'unknown' as 'sales' })).resolves.toMatchObject({ success: false });
        await expect(updateUserAction('u', {})).resolves.toMatchObject({ success: false });
        expect(fake.from).not.toHaveBeenCalled();
    });
    it('update requires affected tenant row', async () => {
        const fake = db({ 'profiles:update': { data: null, error: null } });
        await expect(updateUserAction('u', { name: 'Valid' })).resolves.toMatchObject({ success: false });
        expect(fake.ops[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });
    it('archive verifies target, replacement owner and affected row', async () => {
        let fake = db({ profiles: { data: null, error: null } });
        await expect(archiveUserAction('u', 'foreign')).resolves.toMatchObject({ success: false });
        expect(fake.ops.every(op => op.table !== 'deals')).toBe(true);
        fake = db({ profiles: { data: { id: 'u' }, error: null }, 'profiles:update': { data: null, error: null } });
        await expect(archiveUserAction('u')).resolves.toMatchObject({ success: false });
        expect(fake.ops.find(op => op.action === 'update')?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });
});
