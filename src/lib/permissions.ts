import type { Permission } from '@/types/auth';

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
    admin: [
        'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
        'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete', 'deals:change_owner',
        'products:create', 'products:edit', 'products:delete',
        'clients:view_all', 'clients:create', 'clients:edit', 'clients:delete', 'clients:import',
        'settings:manage_users', 'settings:view_audit', 'settings:configure_pipeline',
        'integrations:manage'
    ],
    manager: [
        'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
        'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete', 'deals:change_owner',
        'clients:view_all', 'clients:create', 'clients:edit', 'clients:delete', 'clients:import',
        'settings:configure_pipeline'
    ],
    vendedor: [
        'leads:create', 'leads:edit',
        'deals:create', 'deals:edit',
        'products:create', 'products:edit', 'products:delete',
        'clients:view_all', 'clients:create', 'clients:edit', 'clients:delete', 'clients:import'
    ],
    support: [
        'clients:view_all'
    ]
};

export function normalizeRole(role: string | null | undefined): string {
    return role === 'sales' ? 'vendedor' : (role || '');
}

export function permissionsForRoles(role: string | null | undefined, roles: unknown): Set<Permission> {
    const roleNames = new Set<string>();
    const primary = normalizeRole(role);
    if (primary) roleNames.add(primary);
    if (Array.isArray(roles)) {
        for (const value of roles) {
            if (typeof value === 'string') {
                const normalized = normalizeRole(value);
                if (normalized) roleNames.add(normalized);
            }
        }
    }
    const permissions = new Set<Permission>();
    for (const roleName of roleNames) {
        for (const permission of ROLE_PERMISSIONS[roleName] || []) permissions.add(permission);
    }
    return permissions;
}

export function hasPermission(role: string | null | undefined, roles: unknown, permission: Permission): boolean {
    return permissionsForRoles(role, roles).has(permission);
}
