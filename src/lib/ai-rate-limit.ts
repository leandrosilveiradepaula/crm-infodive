import { recordOperationalEvent } from '@/lib/operational-events';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  scope: string;
  subject: string;
  limit: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: 0; resetAt: number; retryAfterSeconds: number };

/**
 * Best-effort per-instance guard for paid AI endpoints.
 *
 * This deliberately does not claim to be a distributed quota system: serverless
 * instances do not share memory. It still limits accidental loops/retries in one
 * instance while the durable usage/budget control is implemented separately.
 */
export function consumeRateLimit({ scope, subject, limit, windowMs }: RateLimitOptions): RateLimitResult {
  if (!scope || !subject || !Number.isInteger(limit) || limit <= 0 || !Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('Invalid rate limit configuration');
  }

  const now = Date.now();
  const key = `${scope}:${subject}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    recordOperationalEvent({ area: 'ai', operation: 'rate_limit', outcome: 'allowed', scope, remaining: limit - 1, limit });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    recordOperationalEvent({ area: 'ai', operation: 'rate_limit', outcome: 'rate_limited', scope, remaining: 0, limit });
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  recordOperationalEvent({ area: 'ai', operation: 'rate_limit', outcome: 'allowed', scope, remaining: limit - current.count, limit });
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function resetRateLimitsForTests() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Rate limit reset is test-only');
  }
  buckets.clear();
}
