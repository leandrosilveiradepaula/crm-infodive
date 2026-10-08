import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseDealDiagnosis } from './deal-diagnosis-validation';

const valid = {
  status: 'at_risk', healthScore: 42, trend: 'declining',
  riskFactors: ['Estagnado'], insights: ['Sem avanço'],
  recommendations: ['Revisar'], nextSteps: ['Contatar'],
};

describe('deal diagnosis validation', () => {
  it('accepts structured valid diagnoses without modifying values', () => {
    expect(parseDealDiagnosis(valid)).toEqual(valid);
  });

  it('rejects malformed and out-of-bounds model responses', () => {
    for (const candidate of [
      null, [], {}, { ...valid, healthScore: '90' },
      { ...valid, healthScore: 101 }, { ...valid, healthScore: 0 },
      { ...valid, healthScore: Number.NaN }, { ...valid, healthScore: 40.5 },
      { ...valid, status: 'guaranteed' }, { ...valid, trend: 'unknown' },
      { ...valid, riskFactors: 'no risk' },
      { ...valid, insights: ['a','b','c','d'] },
      { ...valid, recommendations: [''] },
    ]) expect(parseDealDiagnosis(candidate)).toBeNull();
  });

  it('keeps persistence downstream from validation and fails closed', () => {
    const source = readFileSync('src/app/api/gemini/analyze-deal/route.ts', 'utf8');
    expect(source.indexOf('parseDealDiagnosis(diagnosis)')).toBeLessThan(source.indexOf(".from('deals')"));
    expect(source).toContain("telemetry.record('invalid_provider_output', 502)");
    expect(source).toContain("telemetry.record('persistence_failure', 503)");
    expect(source).toContain('health_score: validated.healthScore');
    expect(source).toContain('health_trend: validated.trend');
    expect(source).toContain('risk_factors: validated.riskFactors');
    expect(source).toContain(".eq('organization_id', organizationId)");
    expect(source).toContain('.maybeSingle()');
    expect(source).toContain("telemetry.record('deal_not_found', 404)");
    expect(source.indexOf('typeof deal.id')).toBeLessThan(source.indexOf('await guardPaidAiRequest('));
    expect(source).toContain("telemetry.record('invalid_request', 400)");
  });
});
