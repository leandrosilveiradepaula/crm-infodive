import { useAuth } from './useAuth';
import { Permission } from '@/types/auth';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    admin: [
        'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
        'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete', 'deals:change_owner',
        'products:create', 'products:edit', 'products:delete',
        'clients:view_all',
        'settings:manage_users', 'settings:configure_pipeline'
    ],
    manager: [
        'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
        'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete', 'deals:change_owner',
        'clients:view_all',
        'settings:configure_pipeline'
    ],
    vendedor: [
        'leads:create', 'leads:edit',
        'deals:create', 'deals:edit',
        'products:create', 'products:edit', 'products:delete',
        'clients:view_all'
    ],
    support: [
        'clients:view_all'
    ]
};

export const usePermissions = () => {
    const { profile } = useAuth();

    const can = (permission: Permission): boolean => {
        if (!profile) return false;
        const permissions = (profile.role ? ROLE_PERMISSIONS[profile.role] : []) || [];
        return permissions.includes(permission);
    };

    const canAny = (...permissions: Permission[]): boolean => {
        return permissions.some(p => can(p));
    };

    const canAll = (...permissions: Permission[]): boolean => {
        return permissions.every(p => can(p));
    };

    return { can, canAny, canAll };
};
