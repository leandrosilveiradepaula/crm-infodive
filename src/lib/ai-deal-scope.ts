import { createAdminClient } from './supabase/admin';
import { hasPermission } from './permissions';

/**
 * Role-aware read boundary for all AI deal context. The service-role key
 * bypasses RLS: this check must happen before any privileged deal SELECT.
 * No authorization value is read from user-editable JWT metadata.
 */
export async function getAiDealScope(
    userId: string,
    organizationId: string,
): Promise<{ canViewAll: boolean }> {
    if (!userId || !organizationId) throw new Error('Unauthorized deal context');
    const { data: profile, error } = await createAdminClient()
        .from('profiles')
        .select('role, roles, status')
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

    if (error || !profile || profile.status !== 'active') {
        throw new Error('Unauthorized deal context');
    }
    const canViewAll = hasPermission(profile.role, profile.roles, 'deals:view_all');
    if (!canViewAll && !hasPermission(profile.role, profile.roles, 'deals:edit')) {
        throw new Error('Forbidden deal context');
    }
    return { canViewAll };
}
