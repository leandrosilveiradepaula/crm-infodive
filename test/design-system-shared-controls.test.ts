import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { countViolations, fullyMigratedModules } from '../scripts/check-design-token-policy.mjs';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const protectedComponents = [
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/select.tsx",
  "src/components/proposals/ConfigToggle.tsx",
  "src/components/proposals/ProposalProductsTable.tsx",
  "src/components/proposals/signature/SignatureModal.tsx",
  "src/components/proposals/signature/SignaturePad.tsx",
  "src/app/(dashboard)/error.tsx"
];

describe('DS11 shared controls, signatures and error state', () => {
  it('locks fully migrated shared surfaces against visual hardcode regressions', () => {
    for (const path of protectedComponents) {
      expect(fullyMigratedModules).toContain(path);
      const violations = countViolations(read(path));
      expect(violations).toEqual(Object.fromEntries(Object.keys(violations).map(key => [key, 0])));
    }
  });
  it('keeps keyboard access to proposal options and signature uploads', () => {
    const toggle = read('src/components/proposals/ConfigToggle.tsx');
    const pad = read('src/components/proposals/signature/SignaturePad.tsx');
    expect(toggle).toContain('type="checkbox"');
    expect(toggle).toContain('className="sr-only"');
    expect(toggle).toContain('focus-within:ring-2');
    expect(pad).toContain('type="file"');
    expect(pad).toContain('aria-label="Selecionar imagem da assinatura"');
    expect(pad).toContain('className="sr-only"');
    expect(pad).toContain('onSave(data, mode)');
  });
  it('preserves signing API and investment calculations', () => {
    const modal = read('src/components/proposals/signature/SignatureModal.tsx');
    const products = read('src/components/proposals/ProposalProductsTable.tsx');
    expect(modal).toContain("fetch('/api/proposals/sign'");
    expect(modal).toContain('disabled={loading || !agreedToTerms}');
    expect(products).toContain('formatCurrency(');
    expect(products).toContain('product.unit_price');
  });
  it('uses a readable command keyboard hint instead of an isolated arrow glyph', () => {
    const command = read('src/components/layout/CommandBar.tsx');
    expect(command).toContain('Setas:</span> Navegar');
    expect(command).not.toContain('<kbd className="command-kbd-small">↑↓</kbd>');
  });
});
