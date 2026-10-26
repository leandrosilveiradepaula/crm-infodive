import type { Permission, Role } from '@/types/auth';

/**
 * One permission matrix shared by browser presentation and server enforcement.
 * This does not grant authority to the browser: server requests must separately
 * authenticate the signed session and read the active role from profiles.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  admin: [
    'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
    'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete',
    'deals:change_owner',
    'products:create', 'products:edit', 'products:delete',
    'clients:view_all',
    'settings:manage_users', 'settings:configure_pipeline',
    'settings:manage_organization', 'integrations:manage', 'audit:view',
  ],
  manager: [
    'leads:view_all', 'leads:create', 'leads:edit', 'leads:delete',
    'deals:view_all', 'deals:create', 'deals:edit', 'deals:delete',
    'deals:change_owner', 'clients:view_all',
    'settings:configure_pipeline',
  ],
  vendedor: [
    'leads:create', 'leads:edit',
    'deals:create', 'deals:edit',
    'products:create', 'products:edit', 'products:delete',
    'clients:view_all',
  ],
  support: ['clients:view_all'],
};

export function roleAllowsPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)) return false;
  return ROLE_PERMISSIONS[role as Role].includes(permission);
}
