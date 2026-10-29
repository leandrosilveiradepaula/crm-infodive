import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../src/lib/supabase/admin', () => ({
  createAdminClient: mocked.createAdminClient,
}));

import { findExistingSenderEmails } from '../src/lib/email-sync-tenant';

const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ORG = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function query(data: unknown, error: unknown = null) {
  const q = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn().mockResolvedValue({ data, error }),
  };
  q.select.mockReturnValue(q);
  q.eq.mockReturnValue(q);
  return q;
}

describe('email sync: service-role tenant boundary (CRM #22)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('filters contacts through their tenant-owned accounts and filters blacklists directly', async () => {
    const contacts = query([{ email: 'Existing@Example.test' }]);
    const blacklist = query([{ email: 'Blocked@Example.test' }]);
    const from = vi.fn((table: string) => {
      if (table === 'account_contacts') return contacts;
      if (table === 'contact_blacklists') return blacklist;
      throw new Error('Unexpected table');
    });
    mocked.createAdminClient.mockReturnValue({ from });
    const senders = ['existing@example.test', 'blocked@example.test', 'other@example.test'];
    const known = await findExistingSenderEmails(ORG, senders);
    expect(known).toEqual(new Set(['existing@example.test', 'blocked@example.test']));
    expect(contacts.select).toHaveBeenCalledWith('email,accounts!inner(organization_id)');
    expect(contacts.eq).toHaveBeenCalledWith('accounts.organization_id', ORG);
    expect(contacts.in).toHaveBeenCalledWith('email', senders);
    expect(blacklist.select).toHaveBeenCalledWith('email');
    expect(blacklist.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(blacklist.in).toHaveBeenCalledWith('email', senders);
  });

  it('does not take an organization from a sender or from a different tenant', async () => {
    const contacts = query([]);
    const blacklist = query([]);
    const from = vi.fn((table: string) =>
      table === 'account_contacts' ? contacts : blacklist);
    mocked.createAdminClient.mockReturnValue({ from });
    await findExistingSenderEmails(ORG, ['person@example.test']);
    expect(contacts.eq).not.toHaveBeenCalledWith('accounts.organization_id', OTHER_ORG);
    expect(blacklist.eq).not.toHaveBeenCalledWith('organization_id', OTHER_ORG);
  });

  it('stops before blacklist lookup if scoped contacts query fails', async () => {
    const contacts = query(null, { message: 'database offline' });
    const from = vi.fn().mockReturnValue(contacts);
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(findExistingSenderEmails(ORG, ['test@example.test']))
      .rejects.toThrow('Tenant-scoped contact lookup unavailable');
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('rejects unavailable blacklist query instead of treating it as empty', async () => {
    const contacts = query([]);
    const blacklist = query(null, { message: 'database offline' });
    mocked.createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => table === 'account_contacts' ? contacts : blacklist),
    });
    await expect(findExistingSenderEmails(ORG, ['test@example.test']))
      .rejects.toThrow('Tenant-scoped blacklist lookup unavailable');
  });

  it('denies malformed tenant and malformed result with no fallback to global read', async () => {
    await expect(findExistingSenderEmails('', ['test@example.test']))
      .rejects.toThrow('Invalid tenant');
    await expect(findExistingSenderEmails('forged-tenant', ['test@example.test']))
      .rejects.toThrow('Invalid tenant');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();

    const contacts = query([{ email: null }]);
    const blacklist = query([]);
    mocked.createAdminClient.mockReturnValue({
      from: vi.fn((table: string) => table === 'account_contacts' ? contacts : blacklist),
    });
    await expect(findExistingSenderEmails(ORG, ['test@example.test']))
      .rejects.toThrow('Malformed tenant-scoped');
  });

  it('skips database entirely for an empty provider sender list', async () => {
    await expect(findExistingSenderEmails(ORG, [])).resolves.toEqual(new Set());
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });
});
