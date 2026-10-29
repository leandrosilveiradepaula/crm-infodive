import { createAdminClient } from './supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The admin client bypasses RLS. Never search all CRM contacts or blacklists:
 * contacts inherit tenant identity through their accounts parent, while the
 * blacklist has its own organization_id. Both reads must be explicitly scoped.
 *
 * Fail closed if either read fails or returns an unexpected shape. A failed
 * lookup must not trigger paid extraction or create contact suggestions.
 */
export async function findExistingSenderEmails(
  organizationId: string,
  senders: string[],
): Promise<Set<string>> {
  if (!UUID.test(organizationId) || !Array.isArray(senders) ||
      senders.length > 100 ||
      senders.some(email => typeof email !== 'string' || !email || email.length > 320)) {
    throw new Error('Invalid tenant-scoped sender lookup');
  }
  if (senders.length === 0) return new Set();

  const db = createAdminClient();
  // account_contacts has account_id, not organization_id: use an INNER
  // relationship so the parent organization must match for a row to appear.
  const { data: contacts, error: contactsError } = await db
    .from('account_contacts')
    .select('email,accounts!inner(organization_id)')
    .eq('accounts.organization_id', organizationId)
    .in('email', senders);

  if (contactsError || !Array.isArray(contacts)) {
    throw new Error('Tenant-scoped contact lookup unavailable');
  }

  const { data: blacklist, error: blacklistError } = await db
    .from('contact_blacklists')
    .select('email')
    .eq('organization_id', organizationId)
    .in('email', senders);

  if (blacklistError || !Array.isArray(blacklist)) {
    throw new Error('Tenant-scoped blacklist lookup unavailable');
  }

  const values = new Set<string>();
  for (const row of [...contacts, ...blacklist]) {
    if (!row || typeof row.email !== 'string' || !row.email) {
      throw new Error('Malformed tenant-scoped sender lookup');
    }
    values.add(row.email.toLowerCase());
  }
  return values;
}
