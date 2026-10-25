import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('lead enrichment truthfulness', () => {
  it('does not pretend AI insights are persisted into lead fields', () => {
    const page = readFileSync('src/app/(dashboard)/leads/client-page.tsx', 'utf8');
    const modal = readFileSync('src/components/leads/LeadEnrichmentModal.tsx', 'utf8');

    expect(page).not.toContain('Enriched Data:');
    expect(page).not.toContain('onEnrichSubmit');
    expect(modal).not.toContain('Aplicar Dados');
    expect(modal).toContain('Copiar Insights');
    expect(modal).toContain('navigator.clipboard.writeText');
  });

  it('does not claim an incorrect provider version in the UI', () => {
    const modal = readFileSync('src/components/leads/LeadEnrichmentModal.tsx', 'utf8');
    expect(modal).not.toContain('Gemini 2.1');
    expect(modal).toContain('Análise assistida por IA');
    expect(modal).not.toMatch(/text-\[(?:9|10|11)px\]/);
  });
});
