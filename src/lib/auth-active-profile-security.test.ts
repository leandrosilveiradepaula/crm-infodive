import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    createAdminClient: vi.fn(),
}));
vi.mock('./session', () => ({ getSession: mocks.getSession }));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { requirePermission, requireSessionContext, requireUserId } from './auth-server';

type ProfileResult = { data: Record<string, unknown> | null; error: { message: string } | null };
function fakeProfiles(results: ProfileResult[]) {
    const calls: Array<[string, unknown]> = [];
    const next = [...results];
    const q = {
        select() { return q; },
        eq(key: string, value: unknown) { calls.push([key, value]); return q; },
        single: vi.fn(async () => next.shift() ?? { data: null, error: { message: 'missing' } }),
    };
    const from = vi.fn().mockReturnValue(q);
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, calls, single: q.single };
}
function activeProfile(overrides: Record<string, unknown> = {}) {
    return { data: { organization_id: 'tenant-a', status: 'active', role: 'admin', roles: [], ...overrides }, error: null };
}
describe('server-side authenticated tenant identity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getSession.mockResolvedValue({
            userId: 'user-a', organizationId: 'old-tenant', isLoggedIn: true,
            save: vi.fn().mockResolvedValue(undefined),
        });
    });

    it('rejects logged-out sessions without calling the privileged DB', async () => {
        const db = fakeProfiles([activeProfile()]);
        mocks.getSession.mockResolvedValue({ isLoggedIn: false, userId: 'spoofed' });
        await expect(requireUserId()).rejects.toThrow('Unauthorized');
        expect(db.from).not.toHaveBeenCalled();
    });

    it('derives user identity and tenant exclusively from active server profile', async () => {
        const db = fakeProfiles([activeProfile()]);
        await expect(requireUserId()).resolves.toBe('user-a');
        expect(db.calls).toContainEqual(['id', 'user-a']);
        const cookie = await mocks.getSession.mock.results[0].value;
        expect(cookie.organizationId).toBe('tenant-a');
        expect(cookie.save).toHaveBeenCalledOnce();
    });

    it('rejects absent, inactive, null and unknown profile status', async () => {
        for (const status of [null, 'inactive', 'suspended', 'pending']) {
            const db = fakeProfiles([activeProfile({ status })]);
            await expect(requireSessionContext()).rejects.toThrow('deactivated');
            expect(db.from).toHaveBeenCalledWith('profiles');
        }
        fakeProfiles([{ data: null, error: null }]);
        await expect(requireSessionContext()).rejects.toThrow('Unauthorized');
    });

    it('fails closed when the server-side profile query fails', async () => {
        fakeProfiles([{ data: null, error: { message: 'network unreachable' } }]);
        await expect(requireSessionContext()).rejects.toThrow('Unauthorized');
    });

    it('enforces active status again when resolving permissions', async () => {
        for (const status of ['suspended', null, 'inactive']) {
            fakeProfiles([activeProfile(), activeProfile({ status })]);
            await expect(requirePermission('settings:manage_users'))
                .rejects.toThrow('active profile required');
        }
    });

    it('authorizes a verified active tenant admin but never stale tenant from cookie', async () => {
        const db = fakeProfiles([activeProfile(), activeProfile()]);
        await expect(requirePermission('settings:manage_users')).resolves.toEqual({
            organizationId: 'tenant-a', userId: 'user-a',
        });
        expect(db.calls).toContainEqual(['organization_id', 'tenant-a']);
        expect(db.calls).not.toContainEqual(['organization_id', 'old-tenant']);
    });
});
