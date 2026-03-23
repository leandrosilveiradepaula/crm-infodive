'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/auth';

interface PermissionGateProps {
    permission: Permission | Permission[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="leads:delete">
 *   <button>Delete Lead</button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (user needs ANY of them)
 * <PermissionGate permission={['leads:edit', 'leads:delete']}>
 *   <button>Edit or Delete</button>
 * </PermissionGate>
 * 
 * @example
 * // With fallback
 * <PermissionGate 
 *   permission="products:create"
 *   fallback={<p>You don't have permission</p>}
 * >
 *   <button>Create Product</button>
 * </PermissionGate>
 */
export const PermissionGate = ({ permission, fallback = null, children }: PermissionGateProps) => {
    const { can, canAny } = usePermissions();

    const hasPermission = Array.isArray(permission)
        ? canAny(...permission)
        : can(permission);

    return hasPermission ? <>{children}</> : <>{fallback}</>;
};
