import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('dependency audit evidence', () => {
  it('writes a sanitized critical/high artifact', () => {
    const script = readFileSync('scripts/audit-dependencies.mjs', 'utf8');
    expect(script).toContain('artifacts/dependency-audit.json');
    expect(script).toContain('critical_high: details');
    expect(script).toContain('DEPENDENCY_AUDIT_PACKAGE');
  });

  it('uploads the evidence even if a regression blocks the job', () => {
    const workflow = readFileSync('.github/workflows/crm-validation.yml', 'utf8');
    expect(workflow).toContain('Upload dependency audit evidence');
    expect(workflow).toContain("if: ${{ always() && steps.dependency_audit.outcome != 'skipped' }}");
    expect(workflow).toContain('crm-dependency-audit-${{ github.sha }}');
  });

  it('does not report missing browser evidence when browser smoke never ran', () => {
    const workflow = readFileSync('.github/workflows/crm-validation.yml', 'utf8');
    expect(workflow).toContain('id: browser_smoke');
    expect(workflow).toContain("if: ${{ always() && steps.browser_smoke.outcome != 'skipped' }}");
  });
});
