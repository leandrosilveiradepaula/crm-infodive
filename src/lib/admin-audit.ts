import { createAdminClient } from './supabase/admin';
import { requirePermission } from './server-authorization';
import type { Permission } from '@/types/auth';

/** Only reviewed literal actions may create privileged audit intent records. */
const ADMIN_EVENT_PERMISSIONS = {
  'users.update_role': 'settings:manage_users',
  'users.update': 'settings:manage_users',
  'users.archive': 'settings:manage_users',
  'users.invite': 'settings:manage_users',
  'organization.save': 'settings:manage_organization',
  'pipeline.save': 'settings:configure_pipeline',
  'integrations.toggle': 'integrations:manage',
  'integrations.apikey.create': 'integrations:manage',
  'integrations.apikey.revoke': 'integrations:manage',
  'integrations.apikey.delete': 'integrations:manage',
  'integrations.webhook.create': 'integrations:manage',
  'integrations.webhook.delete': 'integrations:manage',
} as const satisfies Record<string, Permission>;

export type AdminAuditEvent = keyof typeof ADMIN_EVENT_PERMISSIONS;

/**
 * Fail closed BEFORE privileged writes if we cannot durably record the
 * authorized attempt. No caller-provided actor, tenant, IP or payload is
 * accepted. Do not confuse an attempt with confirmation of mutation success.
 */
export async function requireAuditedAdminAction(event: AdminAuditEvent) {
  if (!Object.prototype.hasOwnProperty.call(ADMIN_EVENT_PERMISSIONS, event)) {
    throw new Error('Forbidden: unrecognized administrative action');
  }
  const context = await requirePermission(ADMIN_EVENT_PERMISSIONS[event]);
  const db = createAdminClient();
  const { error } = await db.from('audit_logs').insert({
    user_name: context.userId,
    organization_id: context.organizationId,
    action: 'admin.' + event + '.authorized_attempt',
    details: 'Administrative action authorized at server boundary; outcome not asserted',
    category: 'security',
  });
  if (error) throw new Error('Forbidden: administrative audit is unavailable');
  return context;
}
