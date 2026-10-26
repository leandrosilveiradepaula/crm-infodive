import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext, type AuthorizedSessionContext } from '@/lib/auth-server';
import { roleAllowsPermission } from '@/lib/permission-matrix';
import type { Permission } from '@/types/auth';

/**
 * The service_role bypasses RLS: no privileged server mutation may rely on
 * a PermissionGate, user_metadata, cached cookie role, or caller-provided org.
 * Every call verifies the signed session and a CURRENT trusted profile row.
 */
export async function requirePermission(permission: Permission): Promise<AuthorizedSessionContext> {
  const context = await requireSessionContext();
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('role,status,organization_id')
    .eq('id', context.userId)
    .eq('organization_id', context.organizationId)
    .maybeSingle();

  if (error || !profile || profile.status !== 'active' ||
      profile.organization_id !== context.organizationId ||
      !roleAllowsPermission(profile.role, permission)) {
    throw new Error('Forbidden: server-side permission required');
  }
  return context;
}
