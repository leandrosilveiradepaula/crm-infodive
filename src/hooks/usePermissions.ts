import { useAuth } from './useAuth';
import type { Permission } from '@/types/auth';
import { roleAllowsPermission } from '@/lib/permission-matrix';

export const usePermissions = () => {
    const { profile } = useAuth();

    const can = (permission: Permission): boolean =>
        roleAllowsPermission(profile?.role, permission);

    const canAny = (...permissions: Permission[]): boolean =>
        permissions.some(p => can(p));

    const canAll = (...permissions: Permission[]): boolean =>
        permissions.every(p => can(p));

    return { can, canAny, canAll };
};
