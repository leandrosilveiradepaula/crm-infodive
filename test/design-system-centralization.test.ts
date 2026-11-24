import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { statToneClasses } from '../src/design-system/stat-tones';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

const locked = [
  'src/components/pipeline/product-row/ProductFinancialDetails.tsx',
  'src/app/(dashboard)/sales/tabs/DashboardTab.tsx',
  'src/components/goals/tabs/PlanningTab.tsx',
  'src/components/pipeline/WonDealWizard.tsx',
  'src/app/(dashboard)/sales/tabs/OrdersTab.tsx',
  'src/app/(dashboard)/sales/tabs/InstallmentsTab.tsx',
  'src/app/(dashboard)/automations/client-page.tsx',
  'src/components/supply-chain/PurchaseOrderManager.tsx',
  'src/components/pipeline/ProductDetailsTable.tsx',
  'src/components/proposals/ViewProposalModal.tsx',
  'src/components/shared/DocumentsTab.tsx',
  'src/components/proposals/ProposalGeneratorWizard.tsx',
];

describe('Central design system — source propagation and strict migrated families', () => {
  it('maps legacy font, shadow and radius scales to the same editable primitives', () => {
    const css = read('src/design-system/tokens.css');
    for (const mapping of [
      '--text-xs: var(--ds-type-metadata-size);',
      '--text-sm: var(--ds-type-body-size);',
      '--text-lg: var(--ds-type-section-title-size);',
      '--text-2xl: var(--ds-type-page-title-size);',
      '--radius-md: var(--ds-base-radius-control);',
      '--radius-lg: var(--ds-base-radius-panel);',
      '--shadow-sm: var(--ds-shadow-control);',
      '--shadow-md: var(--ds-shadow-card);',
      '--shadow-lg: var(--ds-shadow-overlay);',
    ]) expect(css).toContain(mapping);
    for (const variable of [
      '--ds-stat-gap:', '--ds-stat-padding:', '--ds-stat-icon-size:',
      '--ds-stat-min-height:', '--ds-font-family-body:',
      '--ds-base-primary:', '--ds-highlight-start:',
    ]) expect(css).toContain(variable);
  });

  it('uses typed semantic tones instead of per-page color and gradient strings', () => {
    expect(Object.keys(statToneClasses).sort()).toEqual([
      'destructive', 'info', 'neutral', 'primary', 'success', 'warning',
    ]);
    const shared = read('src/components/layout/StatsGrid.tsx');
    expect(shared).toContain('statToneClasses[tone]');
    expect(shared).toContain('data-slot="stats-tile"');
    expect(shared).toContain('data-slot="stat-icon"');
    expect(shared).not.toContain('${stat.color}');

    for (const file of [
      'src/app/(dashboard)/leads/client-page.tsx',
      'src/app/(dashboard)/contacts/client-page.tsx',
      'src/app/(dashboard)/reports/client-page.tsx',
      'src/app/(dashboard)/sales/tabs/DashboardTab.tsx',
    ]) {
      const src = read(file);
      expect(src).toContain("tone: '");
      expect(src).not.toMatch(/gradient:\s*["']from-/);
      expect(src).not.toMatch(/border:\s*["']border-/);
    }
  });

  it('keeps all locked migrated components free of measured visual hardcodes', () => {
    for (const file of locked) {
      const src = read(file);
      expect(src, file).not.toMatch(/\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/);
      expect(src, file).not.toMatch(/\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/);
      expect(src, file).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/);
      expect(src, file).not.toMatch(/\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/);
      expect(src, file).not.toMatch(/\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/);
      expect(src, file).not.toMatch(/#[a-fA-F0-9]{6}(?:[a-fA-F0-9]{2})?\b/);
    }
    expect(read('scripts/check-design-token-policy.mjs')).toContain('fullyMigratedModules');
    expect(read('scripts/check-design-token-policy.mjs')).toContain('DESIGN_SYSTEM_STRICT:');
  });

  it('does not lock input and select components into empty controlled state', () => {
    const form = read('src/components/ui/theme/ThemeComponents.tsx');
    expect(form).not.toContain("value={props.value ?? ''}");
    expect(form).toContain('h-[var(--ds-control-height-default)]');
    const theme = read('src/components/providers/ThemeProvider.tsx');
    expect(theme).toContain('setThemeState(previous)');
    expect(theme).toContain("toast.error('Não foi possível salvar o tema.");
    const org = read('src/components/settings/OrganizationThemeSettings.tsx');
    expect(org).not.toContain('updateOrgTheme(');
    expect(org).toContain('Nenhuma alteração global será simulada');
  });

  it('requires computed-style propagation, not just source tokens or screenshots', () => {
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    expect(runner).toContain('async function assertDesignTokenPropagation(page)');
    for (const role of [
      'primary', 'title-size', 'panel-radius', 'card-shadow', 'body-font',
      'highlight-gradient', 'legacy-text-size', 'legacy-radius', 'legacy-shadow',
    ]) expect(runner).toContain(role);
    expect(runner).toContain("['/leads', '/contacts', '/activities']");
    expect(runner).toContain("state: 'design-token-propagation'");
    expect(runner).toContain('root.style.removeProperty(token)');
  });
});
