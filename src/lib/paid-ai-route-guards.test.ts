import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('paid AI route guards', () => {
  it('requires deal edit permission before generating activity suggestions', () => {
    const source = readFileSync('src/app/api/gemini/suggest-activities/route.ts', 'utf8');
    expect(source).toContain("requirePermission('deals:edit')");
  });

  it('keeps sales alert reads session-scoped and protects paid deep analysis', () => {
    const source = readFileSync('src/app/api/sales/alerts/route.ts', 'utf8');
    const getStart = source.indexOf('export async function GET');
    const postStart = source.indexOf('export async function POST');
    expect(getStart).toBeGreaterThanOrEqual(0);
    expect(postStart).toBeGreaterThan(getStart);
    expect(source.slice(getStart, postStart)).toContain('requireSessionContext()');
    expect(source.slice(postStart)).toContain("requirePermission('deals:edit')");
  });

  it('protects reconciliation and caps statement prompt size', () => {
    const source = readFileSync('src/app/api/sales/reconcile/route.ts', 'utf8');
    expect(source).toContain("requirePermission('deals:edit')");
    expect(source).toContain('statementText.length > 100_000');
    expect(source).toContain('status: 413');
  });

  it('caps customer import prompt size before Gemini execution', () => {
    const source = readFileSync('src/app/api/customers/import/route.ts', 'utf8');
    expect(source).toContain('fileContent.length > 200_000');
    expect(source).toContain('status: 413');
  });
  it('protects deal-specific Gemini routes with existing deal edit permission', () => {
    for (const path of [
      'src/app/api/gemini/analyze-deal/route.ts',
      'src/app/api/gemini/follow-up/route.ts',
      'src/app/api/gemini/proposal/route.ts',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain("requirePermission('deals:edit')");
    }
  });

  it('caps high-cost Gemini payload surfaces without inventing new permissions', () => {
    const analyze = readFileSync('src/app/api/gemini/analyze-deal/route.ts', 'utf8');
    const enrich = readFileSync('src/app/api/gemini/enrich/route.ts', 'utf8');
    const extract = readFileSync('src/app/api/gemini/extract/route.ts', 'utf8');
    const signature = readFileSync('src/app/api/gemini/parse-signature/route.ts', 'utf8');
    const specs = readFileSync('src/app/api/gemini/specs/route.ts', 'utf8');

    expect(analyze).toContain("JSON.stringify({ deal, activities }).length > 100_000");
    expect(enrich).toContain("company.length > 500");
    expect(extract).toContain("imageData.length > 12_000_000");
    expect(signature).toContain("signature.length > 20_000");
    expect(signature).toContain("image.length > 8_000_000");
    expect(specs).toContain("products.length > 100");
    expect(specs).toContain("JSON.stringify(products).length > 100_000");
  });
});
