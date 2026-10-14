import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildOperationalEvent, recordOperationalEvent } from './operational-events';

describe('operational events', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits only the explicit safe operational fields', () => {
    const event = buildOperationalEvent({
      area: 'integration',
      operation: 'microsoft_graph_sync',
      outcome: 'success',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      durationMs: 123.4,
      statusCode: 200,
      count: 20,
    });

    expect(event).toMatchObject({
      event: 'crm_operational_event',
      area: 'integration',
      operation: 'microsoft_graph_sync',
      outcome: 'success',
      requestId: '123e4567-e89b-12d3-a456-426614174000',
      durationMs: 123,
      statusCode: 200,
      count: 20,
    });
    expect(JSON.stringify(event)).not.toContain('token');
    expect(JSON.stringify(event)).not.toContain('email');
    expect(JSON.stringify(event)).not.toContain('payload');
  });

  it('neutralizes unexpected free-form text instead of logging it', () => {
    const event = buildOperationalEvent({
      area: 'email',
      operation: 'sync with customer@example.com',
      outcome: 'failure because secret=abc',
    });

    expect(event.operation).toBe('invalid');
    expect(event.outcome).toBe('invalid');
  });

  it('uses warn for rate limits and error for failures', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    recordOperationalEvent({ area: 'ai', operation: 'rate_limit', outcome: 'allowed', scope: 'chat', remaining: 1, limit: 2 });
    recordOperationalEvent({ area: 'ai', operation: 'rate_limit', outcome: 'rate_limited', scope: 'chat', remaining: 0, limit: 2 });
    recordOperationalEvent({ area: 'email', operation: 'sync', outcome: 'failure', statusCode: 500 });

    expect(info).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('keeps health and email telemetry free of payload/token logging', async () => {
    const { readFileSync } = await import('node:fs');
    const health = readFileSync('src/app/api/health/route.ts', 'utf8');
    const emailSync = readFileSync('src/app/api/email/sync/route.ts', 'utf8');

    expect(health).toContain("'Server-Timing'");
    expect(health).toContain("operation: 'readiness'");
    expect(emailSync).toContain("operation: 'microsoft_graph_sync'");
    expect(emailSync).toContain("operation: 'contact_suggestion_background'");
    expect(emailSync).not.toContain("recordOperationalEvent({ payload");
    expect(emailSync).not.toContain("recordOperationalEvent({ token");
  });
});
