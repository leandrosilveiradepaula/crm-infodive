import { createAdminClient } from '@/lib/supabase/admin';
import { recordOperationalEvent } from '@/lib/operational-events';

export type DurableAiQuotaResult =
  | { allowed: true; remaining: number; retryAfterSeconds: number }
  | { allowed: false; reason: 'quota_exhausted'; retryAfterSeconds: number }
  | { allowed: false; reason: 'quota_unavailable'; retryAfterSeconds: number };

type DurableAiQuotaOptions = {
  organizationId: string;
  scope: string;
  limit: number;
  windowSeconds: number;
};

type QuotaRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

export async function consumeDurableAiQuota({
  organizationId,
  scope,
  limit,
  windowSeconds,
}: DurableAiQuotaOptions): Promise<DurableAiQuotaResult> {
  if (
    !organizationId ||
    !scope ||
    !Number.isInteger(limit) ||
    limit <= 0 ||
    !Number.isInteger(windowSeconds) ||
    windowSeconds <= 0
  ) {
    throw new Error('Invalid durable AI quota configuration');
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('consume_ai_quota', {
      p_organization_id: organizationId,
      p_scope: scope,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      recordOperationalEvent({
        area: 'ai',
        operation: 'durable_quota',
        outcome: 'quota_unavailable',
        scope,
        limit,
      });
      return { allowed: false, reason: 'quota_unavailable', retryAfterSeconds: 30 };
    }

    const raw = Array.isArray(data) ? data[0] : data;
    const row = raw as QuotaRow | null;
    if (!row || typeof row.allowed !== 'boolean') {
      recordOperationalEvent({
        area: 'ai',
        operation: 'durable_quota',
        outcome: 'quota_unavailable',
        scope,
        limit,
      });
      return { allowed: false, reason: 'quota_unavailable', retryAfterSeconds: 30 };
    }

    const remaining = Math.max(0, Number(row.remaining || 0));
    const retryAfterSeconds = Math.max(1, Number(row.retry_after_seconds || 1));

    if (!row.allowed) {
      recordOperationalEvent({
        area: 'ai',
        operation: 'durable_quota',
        outcome: 'quota_exhausted',
        scope,
        remaining: 0,
        limit,
      });
      return { allowed: false, reason: 'quota_exhausted', retryAfterSeconds };
    }

    recordOperationalEvent({
      area: 'ai',
      operation: 'durable_quota',
      outcome: 'allowed',
      scope,
      remaining,
      limit,
    });
    return { allowed: true, remaining, retryAfterSeconds };
  } catch {
    recordOperationalEvent({
      area: 'ai',
      operation: 'durable_quota',
      outcome: 'quota_unavailable',
      scope,
      limit,
    });
    return { allowed: false, reason: 'quota_unavailable', retryAfterSeconds: 30 };
  }
}
