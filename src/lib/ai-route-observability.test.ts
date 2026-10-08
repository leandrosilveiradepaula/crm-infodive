import { describe, expect, it, vi } from 'vitest';
import { createAiRouteContext } from './ai-route-observability';
import { readFileSync } from 'node:fs';

describe('paid AI route observability', () => {
  it('preserves a valid request id in responses', async () => {
    const requestId = '11111111-1111-4111-8111-111111111111';
    const telemetry = createAiRouteContext(
      new Request('http://localhost/api/test', { headers: { 'X-Request-Id': requestId } }),
      'test_ai_route',
    );

    const response = telemetry.respond({ ok: true }, 202);

    expect(response.status).toBe(202);
    expect(response.headers.get('X-Request-Id')).toBe(requestId);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('records only structured operational outcome fields', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const telemetry = createAiRouteContext(
      new Request('http://localhost/api/test'),
      'test_ai_route',
    );

    telemetry.record('success', 200);

    expect(info).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(info.mock.calls[0]?.[0] || '{}'));
    expect(payload).toMatchObject({
      event: 'crm_operational_event',
      area: 'ai',
      operation: 'test_ai_route',
      outcome: 'success',
      statusCode: 200,
    });
    expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    vi.restoreAllMocks();
  });

  it('keeps critical paid AI routes correlated and sanitizes enrichment errors', () => {
    for (const path of [
      'src/app/api/gemini/chat/route.ts',
      'src/app/api/gemini/follow-up/route.ts',
      'src/app/api/gemini/analyze-deal/route.ts',
      'src/app/api/gemini/enrich/route.ts',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('createAiRouteContext');
      expect(source).toContain('telemetry.record');
      expect(source).toContain('telemetry.respond');
    }

    const enrich = readFileSync('src/app/api/gemini/enrich/route.ts', 'utf8');
    expect(enrich).not.toContain('enrichError.message');
    expect(enrich).not.toContain('conquistas recentes típicas');
    expect(enrich).toContain('Não invente fatos recentes');
  });
});
