import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  record: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

vi.mock('@/lib/operational-events', () => ({
  recordOperationalEvent: mocks.record,
}));

import { consumeDurableAiQuota } from './ai-durable-quota';

describe('durable AI quota', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.record.mockReset();
  });

  it('allows a request when the database bucket has capacity', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, remaining: 4, retry_after_seconds: 42 }],
      error: null,
    });

    await expect(consumeDurableAiQuota({
      organizationId: '11111111-1111-4111-8111-111111111111',
      scope: 'test',
      limit: 5,
      windowSeconds: 60,
    })).resolves.toEqual({
      allowed: true,
      remaining: 4,
      retryAfterSeconds: 42,
    });
  });

  it('blocks when the durable bucket is exhausted', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: false, remaining: 0, retry_after_seconds: 31 }],
      error: null,
    });

    await expect(consumeDurableAiQuota({
      organizationId: '11111111-1111-4111-8111-111111111111',
      scope: 'test',
      limit: 5,
      windowSeconds: 60,
    })).resolves.toEqual({
      allowed: false,
      reason: 'quota_exhausted',
      retryAfterSeconds: 31,
    });
  });

  it('fails closed when the quota RPC is unavailable', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'unavailable' } });

    await expect(consumeDurableAiQuota({
      organizationId: '11111111-1111-4111-8111-111111111111',
      scope: 'test',
      limit: 5,
      windowSeconds: 60,
    })).resolves.toEqual({
      allowed: false,
      reason: 'quota_unavailable',
      retryAfterSeconds: 30,
    });
  });

  it('rejects invalid quota configuration before touching the database', async () => {
    await expect(consumeDurableAiQuota({
      organizationId: '',
      scope: 'test',
      limit: 5,
      windowSeconds: 60,
    })).rejects.toThrow('Invalid durable AI quota configuration');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
