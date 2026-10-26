import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  getSession: vi.fn(),
  createAdminClient: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('../src/lib/session', () => ({ getSession: mocked.getSession }));
vi.mock('../src/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }));
vi.mock('next/headers', () => ({ headers: mocked.headers }));

import { requireSessionContext, requireUserId } from '../src/lib/auth-server';

const USER = '11111111-1111-4111-8111-111111111111';
const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function profileResult(profile: unknown, error: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: profile, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  mocked.createAdminClient.mockReturnValue({ from });
  return { from, select, eq, maybeSingle };
}

describe('server-side CRM tenant boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.getSession.mockResolvedValue({
      isLoggedIn: true, userId: USER,
      organizationId: OTHER, // stale or hostile session tenant
    });
    profileResult({ status: 'active', organization_id: ORG });
    mocked.headers.mockResolvedValue({ get: (name: string) => name === 'X-User-Id' ? USER : null });
  });

  it('always resolves from the server profile, not cached session organization', async () => {
    const actual = await requireSessionContext();
    expect(actual).toEqual({ userId: USER, organizationId: ORG });
    expect(mocked.createAdminClient).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ status: 'inactive', organization_id: ORG }, null],
    [{ status: 'active', organization_id: null }, null],
    [{ status: 'active', organization_id: OTHER + 'x' }, null],
    [null, null],
    [null, { message: 'db down' }],
  ])('denies revoked, missing, malformed and unavailable profile %#', async (profile, error) => {
    profileResult(profile, error);
    await expect(requireSessionContext()).rejects.toThrow('Unauthorized');
  });

  it('denies stale signed session if no authenticated user exists', async () => {
    mocked.getSession.mockResolvedValue({ isLoggedIn: false, userId: USER, organizationId: ORG });
    await expect(requireSessionContext()).rejects.toThrow('Unauthorized');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('denies a forged middleware identity even with a valid profile', async () => {
    mocked.headers.mockResolvedValue({ get: () => OTHER });
    await expect(requireUserId()).rejects.toThrow('Invalid user header');
  });

  it('denies missing middleware identity; does not accept client-supplied organization', async () => {
    mocked.headers.mockResolvedValue({ get: () => null });
    await expect(requireUserId()).rejects.toThrow('Invalid user header');
  });

  it('requires a matching middleware identity AND an active profile', async () => {
    expect(await requireUserId()).toBe(USER);
    profileResult({ status: 'inactive', organization_id: ORG });
    await expect(requireUserId()).rejects.toThrow('Unauthorized');
  });
});
