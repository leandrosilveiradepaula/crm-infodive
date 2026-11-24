import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const tokens = read('src/design-system/tokens.css');

describe('Legacy Tailwind typography inherits configurable Design System weight and tracking', () => {
  it('connects weight and spacing utilities to one core token file', () => {
    const css = read('src/design-system/tokens.css');
    for (const [utility, token] of [
      ['--font-weight-normal:', '--ds-type-body-weight'],
      ['--font-weight-medium:', '--ds-type-label-weight'],
      ['--font-weight-semibold:', '--ds-type-control-weight'],
      ['--font-weight-bold:', '--ds-type-metric-weight'],
      ['--font-weight-extrabold:', '--ds-type-strong-weight'],
      ['--font-weight-black:', '--ds-type-heavy-weight'],
      ['--tracking-widest:', '--ds-tracking-widest'],
      ['--tracking-wider:', '--ds-tracking-wider'],
      ['--tracking-tight:', '--ds-tracking-tight'],
    ]) {
      expect(css).toContain(`${utility} var(${token})`);
    }
  });
});

describe('Configurable single-source Infodive Design System', () => {
  it('centralizes primitive values, semantic aliases and Tailwind v4 mappings', () => {
    const css = read('src/app/globals.css');
    expect(css).toContain('@import "../design-system/tokens.css"');
    expect(css).not.toMatch(/--primary:\s*oklch\(/);
    expect(tokens).toContain('@theme inline');
    for (const role of ['background', 'primary', 'card', 'surface-subtle', 'success-readable', 'destructive-foreground']) {
      expect(tokens).toContain('--ds-base-' + role + ':');
      expect(tokens).toContain('--' + role + ': var(--ds-base-' + role + ');');
    }
    expect(tokens).toContain('--color-primary: var(--primary)');
    expect(tokens).toContain('--color-destructive-foreground: var(--destructive-foreground)');
  });

  it('defines centralized type roles, geometry, shadows and gradients', () => {
    for (const name of ['font-family-body', 'font-family-heading', 'type-page-title-size', 'type-label-size', 'type-table-size', 'type-control-weight', 'base-radius-control', 'gradient-highlight', 'gradient-financial', 'shadow-card', 'table-cell-padding', 'page-header-inline']) {
      expect(tokens).toContain('--ds-' + name);
    }
    for (const role of ['page-title', 'section-title', 'body', 'label', 'table', 'table-heading', 'metadata', 'control']) {
      expect(tokens).toContain('.ds-type-' + role);
    }
    expect(tokens).toContain('.ds-panel-financial');
    expect(tokens).toContain('.ds-panel-highlight');
    expect(tokens).toContain('.ds-overlay-backdrop');
  });

  it('uses one font loaded at root and a semantic typography component', () => {
    const layout = read('src/app/layout.tsx');
    const component = read('src/components/ui/typography.tsx');
    const header = read('src/components/layout/PageHeader.tsx');
    expect(layout).toContain('className={inter.variable}');
    expect(layout).not.toContain('inter.className');
    expect(tokens).toContain('--font-sans: var(--ds-font-family-body)');
    expect(component).toContain('ds-type-page-title');
    expect(header).toContain('variant="pageTitle"');
  });

  it('keeps shared primitives in the same token contract', () => {
    for (const path of ['src/components/ui/button.tsx', 'src/components/ui/card.tsx', 'src/components/ui/input.tsx', 'src/components/ui/table.tsx']) {
      const file = read(path);
      expect(file).toMatch(/ds-type-|ds-(?:card|table|control)-/);
    }
  });

  it('removes local gradient and color literals from the Pipeline detail drawer', () => {
    const detail = read('src/components/pipeline/ViewDealModal.tsx');
    expect(detail).toContain('ds-panel-financial');
    expect(detail).toContain('ds-panel-highlight');
    expect(detail).not.toMatch(/\bbg-gradient-to-|\bfrom-blue-\d+|\bto-teal-\d+/);
    expect(detail).not.toMatch(/\b(?:text|bg|border)-(?:blue|emerald|rose|red|teal)-\d{2,3}/);
  });
});
