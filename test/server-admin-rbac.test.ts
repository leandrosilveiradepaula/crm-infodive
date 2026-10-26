import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  requireSessionContext: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock('../src/lib/auth-server', () => ({
  requireSessionContext: mocked.requireSessionContext,
}));
vi.mock('../src/lib/supabase/admin', () => ({
  createAdminClient: mocked.createAdminClient,
}));

import { roleAllowsPermission } from '../src/lib/permission-matrix';
import { requirePermission } from '../src/lib/server-authorization';
import { requireAuditedAdminAction } from '../src/lib/admin-audit';

const USER = '11111111-1111-4111-8111-111111111111';
const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ORG = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function clientFor(profile: unknown, profileError: unknown = null, auditError: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error: profileError });
  const eq = vi.fn().mockReturnValue({ maybeSingle, eq: undefined });
  const chain = { maybeSingle, eq };
  eq.mockReturnValue(chain);
  const select = vi.fn().mockReturnValue(chain);
  const insert = vi.fn().mockResolvedValue({ error: auditError });
  const from = vi.fn((table: string) => {
    if (table === 'profiles') return { select };
    if (table === 'audit_logs') return { insert };
    throw new Error('Unexpected table: ' + table);
  });
  mocked.createAdminClient.mockReturnValue({ from });
  return { from, select, eq, maybeSingle, insert };
}

describe('shared role matrix and server-owned permissions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.requireSessionContext.mockResolvedValue({
      userId: USER, organizationId: ORG, role: 'admin',
    });
  });

  it('uses the same explicit role policy in UI and server', () => {
    expect(roleAllowsPermission('admin','settings:manage_users')).toBe(true);
    expect(roleAllowsPermission('admin','integrations:manage')).toBe(true);
    expect(roleAllowsPermission('manager','settings:configure_pipeline')).toBe(true);
    expect(roleAllowsPermission('manager','settings:manage_users')).toBe(false);
    expect(roleAllowsPermission('manager','integrations:manage')).toBe(false);
    expect(roleAllowsPermission('vendedor','settings:manage_users')).toBe(false);
    expect(roleAllowsPermission('support','integrations:manage')).toBe(false);
    expect(roleAllowsPermission('__proto__','settings:manage_users')).toBe(false);
    expect(roleAllowsPermission(null,'integrations:manage')).toBe(false);
  });

  it('requires the actual active database role, never signed session role', async () => {
    const client=clientFor({ role: 'vendedor', status: 'active', organization_id: ORG });
    await expect(requirePermission('settings:manage_users')).rejects.toThrow('Forbidden');
    expect(client.select).toHaveBeenCalledWith('role,status,organization_id');
    expect(client.eq).toHaveBeenCalledWith('id',USER);
    expect(client.eq).toHaveBeenCalledWith('organization_id',ORG);
  });

  it('permits only active profiles with matching organization and reviewed role', async () => {
    clientFor({ role: 'admin', status: 'active', organization_id: ORG });
    await expect(requirePermission('settings:manage_users')).resolves.toEqual({
      userId:USER, organizationId:ORG, role:'admin',
    });
  });

  it.each([
    [null, null],
    [{ role: 'admin', status: 'inactive', organization_id: ORG }, null],
    [{ role: 'admin', status: 'active', organization_id: OTHER_ORG }, null],
    [{ role: 'administrator', status: 'active', organization_id: ORG }, null],
    [{ role: 'admin', status: 'active', organization_id: ORG }, {message:'db unreachable'}],
  ])('fails closed on absent, inactive, drifted, unknown and unavailable profile %#', async(profile,error) => {
    clientFor(profile,error);
    await expect(requirePermission('settings:manage_users')).rejects.toThrow('Forbidden');
  });

  it('denies when the signed session is unavailable before any admin client', async () => {
    mocked.requireSessionContext.mockRejectedValue(new Error('No active session'));
    await expect(requirePermission('settings:manage_users')).rejects.toThrow('No active session');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('records an actor and tenant from server, never mutable input', async () => {
    const client=clientFor({ role:'admin', status:'active',organization_id:ORG });
    await expect(requireAuditedAdminAction('users.archive')).resolves.toMatchObject({
      userId:USER,organizationId:ORG,
    });
    expect(client.insert).toHaveBeenCalledOnce();
    expect(client.insert.mock.calls[0][0]).toEqual({
      user_name:USER,organization_id:ORG,
      action:'admin.users.archive.authorized_attempt',
      details:'Administrative action authorized at server boundary; outcome not asserted',
      category:'security',
    });
  });

  it('does not execute an unaudited privileged mutation if audit storage is down', async () => {
    clientFor({role:'admin',status:'active',organization_id:ORG},null,{message:'audit table error'});
    await expect(requireAuditedAdminAction('integrations.apikey.create')).rejects.toThrow('audit is unavailable');
  });

  it('never writes admin audit for an insufficient role', async () => {
    const client=clientFor({role:'vendedor',status:'active',organization_id:ORG});
    await expect(requireAuditedAdminAction('users.invite')).rejects.toThrow('Forbidden');
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(client.insert).not.toHaveBeenCalled();
  });
});
