import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    requirePermission: vi.fn(),
    archiveUser: vi.fn(),
    updateUserProfile: vi.fn(),
    revalidatePath: vi.fn(),
}));
vi.mock('./auth-server', () => ({
    requirePermission: mocks.requirePermission,
    requireSessionContext: vi.fn(),
}));
vi.mock('../services/UserService', () => ({
    UserService: { archiveUser: mocks.archiveUser, updateUserProfile: mocks.updateUserProfile },
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import {
    archiveUserAction, updateUserProfile,
} from '../app/(dashboard)/settings/actions';

describe('legacy settings admin actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePermission.mockResolvedValue({ organizationId: 'tenant-a', userId: 'admin-a' });
        mocks.archiveUser.mockResolvedValue({ success: true });
        mocks.updateUserProfile.mockResolvedValue({ success: true });
    });

    it('prevents self-archiving and invalid reassignment without calling privileged service', async () => {
        await expect(archiveUserAction('admin-a')).resolves.toMatchObject({ success: false });
        await expect(archiveUserAction('user-a', 'user-a')).resolves.toMatchObject({ success: false });
        await expect(archiveUserAction('user-a', 'admin-a')).resolves.toMatchObject({ success: false });
        expect(mocks.archiveUser).not.toHaveBeenCalled();
    });

    it('passes verified actor to archive service and only revalidates on success', async () => {
        await expect(archiveUserAction('user-a', 'other-a')).resolves.toEqual({ success: true });
        expect(mocks.archiveUser).toHaveBeenCalledWith('user-a', 'tenant-a', 'other-a', 'admin-a');
        expect(mocks.revalidatePath).toHaveBeenCalledWith('/settings');
        mocks.archiveUser.mockResolvedValueOnce({ success: false });
        mocks.revalidatePath.mockClear();
        await archiveUserAction('user-a');
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it('maps legacy name to persisted full_name without losing other allowed fields', async () => {
        await expect(updateUserProfile('user-a', { name: 'Example', phone: '555', role: 'manager' }))
            .resolves.toEqual({ success: true });
        expect(mocks.updateUserProfile).toHaveBeenCalledWith('user-a', 'tenant-a', {
            full_name: 'Example', phone: '555', role: 'manager',
        });
    });

    it('rejects empty and unrecognized update payloads before calling service', async () => {
        await expect(updateUserProfile('user-a', {})).resolves.toMatchObject({ success: false });
        await expect(updateUserProfile('user-a', { organization_id: 'elsewhere' } as never))
            .resolves.toMatchObject({ success: false });
        expect(mocks.updateUserProfile).not.toHaveBeenCalled();
    });
});
