import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('AI product hardening', () => {
  it('does not expose mocked Watson chat or fabricated insights', () => {
    const assistant = readFileSync('src/components/ai/AiAssistant.tsx', 'utf8');
    const gemini = readFileSync('src/lib/gemini.ts', 'utf8');

    expect(assistant).not.toContain('mockInsights');
    expect(assistant).not.toContain('IBM Watson AI');
    expect(assistant).not.toContain('Online e pronto para ajudar');
    expect(gemini).not.toContain('Mock chat response');
    expect(gemini).not.toContain('Mock implementation');
  });

  it('keeps chat and follow-up tenant scoped on the server', () => {
    for (const path of [
      'src/app/api/gemini/chat/route.ts',
      'src/app/api/gemini/follow-up/route.ts'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toMatch(/require(?:SessionContext|Permission)/);
      expect(source).toContain(".eq('organization_id', organizationId)");
      expect(source).toContain('GEMINI_API_KEY');
    }
  });

  it('requires durable quota coverage for every paid AI route', () => {
    const audit = readFileSync('scripts/audit-ai-endpoints.mjs', 'utf8');
    expect(audit).toContain("rule: 'durable-quota'");
    expect(audit).toContain('consumeDurableAiQuota|guardPaidAiRequest');

    for (const path of [
      'src/app/api/gemini/chat/route.ts',
      'src/app/api/gemini/analyze-deal/route.ts',
      'src/app/api/gemini/enrich/route.ts',
      'src/app/api/gemini/extract/route.ts',
      'src/app/api/gemini/follow-up/route.ts',
      'src/app/api/gemini/parse-company/route.ts',
      'src/app/api/gemini/parse-signature/route.ts',
      'src/app/api/gemini/proposal/route.ts',
      'src/app/api/gemini/specs/route.ts',
    ]) {
      expect(readFileSync(path, 'utf8')).toContain('guardPaidAiRequest');
    }

    expect(readFileSync('src/app/api/email/sync/route.ts', 'utf8')).toContain('consumeDurableAiQuota');
  });

});
