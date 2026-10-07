import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('risk radar fail-closed behavior', () => {
  it('does not fabricate a perfect health score when health data is missing', () => {
    const source = readFileSync('src/components/pipeline/ai/RiskRadar.tsx', 'utf8');

    expect(source).not.toContain('deal.health_score ?? 100');
    expect(source).not.toContain('We will use mock data');
    expect(source).toContain('Sem avaliação de risco calculada');
    expect(source).toContain('Nenhum status saudável ou crítico será presumido');
  });

  it('does not claim that absence of risk factors proves a healthy deal', () => {
    const source = readFileSync('src/components/pipeline/ai/RiskRadar.tsx', 'utf8');

    expect(source).not.toContain('Deal Saudável');
    expect(source).not.toContain('Nenhuma anomalia detectada');
    expect(source).not.toMatch(/text-\[(?:9|10|11)px\]/);
  });
});
