import { useAuth } from './useAuth';
import { Permission } from '@/types/auth';
import { hasPermission } from '@/lib/permissions';

export const usePermissions = () => {
    const { profile } = useAuth();

    const can = (permission: Permission): boolean => {
        if (!profile) return false;
        return hasPermission(profile.role, profile.roles, permission);
    };

    const canAny = (...permissions: Permission[]): boolean => {
        return permissions.some(p => can(p));
    };

    const canAll = (...permissions: Permission[]): boolean => {
        return permissions.every(p => can(p));
    };

    return { can, canAny, canAll };
};
