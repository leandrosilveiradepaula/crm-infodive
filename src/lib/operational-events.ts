export type OperationalLevel = 'info' | 'warn' | 'error';

export type OperationalEvent = {
  level?: OperationalLevel;
  area: 'ai' | 'email' | 'health' | 'automation' | 'integration';
  operation: string;
  outcome: string;
  requestId?: string;
  scope?: string;
  durationMs?: number;
  statusCode?: number;
  count?: number;
  remaining?: number;
  limit?: number;
};

const SAFE_TEXT = /^[a-zA-Z0-9_.:/-]{1,120}$/;

function safeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return SAFE_TEXT.test(value) ? value : 'invalid';
}

function safeNumber(value: number | undefined): number | undefined {
  return Number.isFinite(value) && value! >= 0 ? Math.round(value!) : undefined;
}

export function buildOperationalEvent(event: OperationalEvent) {
  return {
    event: 'crm_operational_event',
    area: safeText(event.area),
    operation: safeText(event.operation),
    outcome: safeText(event.outcome),
    requestId: safeText(event.requestId),
    scope: safeText(event.scope),
    durationMs: safeNumber(event.durationMs),
    statusCode: safeNumber(event.statusCode),
    count: safeNumber(event.count),
    remaining: safeNumber(event.remaining),
    limit: safeNumber(event.limit),
    timestamp: new Date().toISOString(),
  };
}

export function recordOperationalEvent(event: OperationalEvent) {
  const payload = buildOperationalEvent(event);
  const line = JSON.stringify(payload);
  const level = event.level || (event.outcome === 'failure' ? 'error' : event.outcome === 'rate_limited' ? 'warn' : 'info');

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
