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
});
