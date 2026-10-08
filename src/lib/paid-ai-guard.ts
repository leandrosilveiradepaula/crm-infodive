import { consumeDurableAiQuota } from '@/lib/ai-durable-quota';
import { consumeRateLimit } from '@/lib/ai-rate-limit';

export type PaidAiGuardResult =
  | { allowed: true }
  | { allowed: false; status: 429 | 503; retryAfterSeconds: number; reason: 'rate_limited' | 'quota_exhausted' | 'quota_unavailable' };

type PaidAiGuardOptions = {
  scope: string;
  organizationId: string;
  userId: string;
  limit: number;
  windowMs: number;
};

export async function guardPaidAiRequest({
  scope,
  organizationId,
  userId,
  limit,
  windowMs,
}: PaidAiGuardOptions): Promise<PaidAiGuardResult> {
  const local = consumeRateLimit({
    scope,
    subject: `${organizationId}:${userId}`,
    limit,
    windowMs,
  });

  if (!local.allowed) {
    return {
      allowed: false,
      status: 429,
      retryAfterSeconds: local.retryAfterSeconds,
      reason: 'rate_limited',
    };
  }

  const durable = await consumeDurableAiQuota({
    organizationId,
    scope,
    limit,
    windowSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
  });

  if (!durable.allowed) {
    return {
      allowed: false,
      status: durable.reason === 'quota_unavailable' ? 503 : 429,
      retryAfterSeconds: durable.retryAfterSeconds,
      reason: durable.reason,
    };
  }

  return { allowed: true };
}
