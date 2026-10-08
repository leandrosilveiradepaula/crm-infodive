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
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('crm-dependency-audit-${{ github.sha }}');
  });

  it('keeps the vulnerable xlsx package out of runtime imports', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(packageJson.dependencies?.xlsx).toBeUndefined();

    for (const path of [
      'src/utils/excelParser.ts',
      'src/components/customers/ImportCustomersModal.tsx',
      'analyze_excel.js',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/(?:from\s+['"]xlsx['"]|require\(['"]xlsx['"]\)|import\(['"]xlsx['"]\))/);
    }

    expect(readFileSync('src/utils/excelParser.ts', 'utf8')).toContain("import('exceljs')");
  });

});
