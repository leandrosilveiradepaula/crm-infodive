import { describe, expect, it } from 'vitest';
import { hasPermission, permissionsForRoles } from './permissions';

describe('permissions', () => {
    it('allows admin-only integration management', () => {
        expect(hasPermission('admin', [], 'integrations:manage')).toBe(true);
        expect(hasPermission('manager', [], 'integrations:manage')).toBe(false);
        expect(hasPermission('vendedor', [], 'integrations:manage')).toBe(false);
    });

    it('restricts audit-log visibility to admins', () => {
        expect(hasPermission('admin', [], 'settings:view_audit')).toBe(true);
        expect(hasPermission('manager', [], 'settings:view_audit')).toBe(false);
        expect(hasPermission('vendedor', [], 'settings:view_audit')).toBe(false);
        expect(hasPermission('support', [], 'settings:view_audit')).toBe(false);
    });

    it('supports multi-role profiles without weakening the matrix', () => {
        const permissions = permissionsForRoles('support', ['manager']);
        expect(permissions.has('clients:view_all')).toBe(true);
        expect(permissions.has('settings:configure_pipeline')).toBe(true);
        expect(permissions.has('settings:manage_users')).toBe(false);
    });

    it('normalizes the UI sales alias to vendedor', () => {
        expect(hasPermission('sales', [], 'deals:edit')).toBe(true);
        expect(hasPermission('sales', [], 'settings:manage_users')).toBe(false);
    });

    it('fails closed for unknown roles', () => {
        expect(hasPermission('unknown', [], 'clients:view_all')).toBe(false);
    });
    it('makes support read-only for clients while preserving existing business role workflows', () => {
        const writes = ['clients:create', 'clients:edit', 'clients:delete', 'clients:import'] as const;
        for (const role of ['admin', 'manager', 'vendedor'] as const) {
            expect(hasPermission(role, [], 'clients:view_all')).toBe(true);
            for (const permission of writes) expect(hasPermission(role, [], permission)).toBe(true);
        }
        expect(hasPermission('support', [], 'clients:view_all')).toBe(true);
        for (const permission of writes) {
            expect(hasPermission('support', [], permission)).toBe(false);
            expect(hasPermission('unknown', [], permission)).toBe(false);
        }
    });

    it('retains multi-role and vendedor/sales mapping for client changes', () => {
        expect(hasPermission('sales', [], 'clients:edit')).toBe(true);
        expect(hasPermission('support', ['manager'], 'clients:create')).toBe(true);
        expect(hasPermission('support', ['unsupported'], 'clients:delete')).toBe(false);
    });

});
