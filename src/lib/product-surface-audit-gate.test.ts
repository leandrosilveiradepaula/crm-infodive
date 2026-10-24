import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('product surface audit gate', () => {
  it('is wired into CRM validation', () => {
    const workflow = readFileSync('.github/workflows/crm-validation.yml', 'utf8');
    expect(workflow).toContain('Product surface audit');
    expect(workflow).toContain('node scripts/audit-product-surface.mjs');
  });

  it('guards known product prototype regressions', () => {
    const script = readFileSync('scripts/audit-product-surface.mjs', 'utf8');
    for (const marker of [
      'micro-typography',
      'legacy-brand-watson',
      'legacy-brand-nexus',
      'legacy-brand-crm-next',
      'legacy-brand-antigravity',
      'empty-onclick',
      'known-automation-noop'
    ]) {
      expect(script).toContain(marker);
    }
  });
});
