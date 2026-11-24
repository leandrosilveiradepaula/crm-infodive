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
  'src/components/goals/FinancialSummaryCard.tsx',
  'src/components/goals/tabs/GoalsTab.tsx',
  'src/components/goals/tabs/CommissionsTab.tsx',
  'src/components/goals/DistributionModal.tsx',
  'src/components/goals/CommissionSimulator.tsx',
  'src/components/goals/EnhancedProgressBar.tsx',
  'src/components/goals/GoalInput.tsx',
  'src/components/goals/PerformanceBadge.tsx',
  'src/components/goals/ProfitabilityChart.tsx',
  'src/components/goals/SeasonalityChart.tsx',
  'src/components/goals/StatsCard.tsx',
  'src/components/goals/tabs/CampaignsTab.tsx',
  'src/components/goals/tabs/StatementTab.tsx',
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
    expect(theme).toContain("document.documentElement.classList.toggle('dark', preferredTheme.current === 'dark')");
    expect(theme).not.toContain('setThemeState(initialTheme);');
    expect(theme).toContain("const renderedTheme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';");
    expect(theme).toContain("document.documentElement.dataset.themeSaveState = 'saved';");
    expect(theme).toContain("document.documentElement.dataset.themeSaveState = 'failed';");
    expect(theme).toContain("toast.error('Não foi possível salvar o tema.");
    const org = read('src/components/settings/OrganizationThemeSettings.tsx');
    expect(org).not.toContain('updateOrgTheme(');
    expect(org).toContain('Nenhuma alteração global será simulada');
  });

  it('persists individual themes by confirmed profile update without root revalidation races', () => {
    const action = read('src/app/actions/theme-actions.ts');
    const write = action.split('export async function updateUserTheme(')[1]
      ?.split('export async function updateOrgTheme(')[0] || '';
    expect(write).toContain('requireSessionContext()');
    expect(write).toContain(".update({ theme_preference: theme })");
    expect(write).toContain(".eq('id', userId)");
    expect(write).toContain(".select('id,theme_preference')");
    expect(write).toContain('data.theme_preference !== theme');
    for (const code of ['AUTH', 'CLIENT', 'TRANSPORT']) {
      expect(write).toContain(`CRM_THEME_WRITE_DIAGNOSTIC=${code}`);
    }
    expect(write).not.toContain("revalidatePath('/')");
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    expect(runner).toContain('CRM_THEME_READ_AFTER_WRITE_FAILED');
    expect(runner).toContain('CRM_THEME_SAVE_NOT_CONFIRMED');
    expect(runner).toContain("route === '/leads' && viewport.name === 'desktop'");
  });

  it('keeps compiled Next.js runtime packages unchanged when installing browser QA tools', () => {
    const installer = read('scripts/install-isolated-browser-qa.mjs');
    const local = read('.github/workflows/crm-b4-local-authenticated.yml');
    const validation = read('.github/workflows/crm-validation.yml');
    for (const source of [local, validation]) {
      expect(source).toContain('node scripts/install-isolated-browser-qa.mjs');
      expect(source).not.toContain('run: npm install --no-save');
    }
    expect(installer).toContain("'install', '--prefix', scratch");
    expect(installer).toContain("join(modules, 'next/package.json')");
    expect(installer).toContain("join(modules, 'react/package.json')");
    expect(installer).toContain("join(modules, 'react-dom/package.json')");
    expect(installer).not.toContain('symlinkSync');
    expect(installer).toContain('PLAYWRIGHT_CORE_PATH=');
    expect(installer).toContain('CRM_QA_AXE_MIN_PATH=');
    expect(installer).toContain('CRM_B4_BROWSER_TOOLS=ISOLATED');
    expect(read('test/e2e/run-component-a11y.mjs')).toContain('process.env.PLAYWRIGHT_CORE_PATH');
    expect(read('test/e2e/run-component-a11y.mjs')).toContain('process.env.CRM_QA_AXE_MIN_PATH');
    expect(read('test/e2e/run-authenticated-smoke.mjs')).toContain('process.env.CRM_QA_AXE_MIN_PATH');
    expect(installer).not.toContain("execFileSync('npm', ['install', '--no-save'");
  });

  it('migrates Goals, DRE, Commissions and distribution to semantic roles', () => {
    const goals = read('src/components/goals/tabs/GoalsTab.tsx');
    for (const tone of ['primary', 'success', 'info', 'warning']) {
      expect(goals).toContain("tone: '" + tone + "'");
    }
    expect(goals).not.toMatch(/gradient:\s*"from-/);
    expect(goals).toContain("aria-pressed={isSelected}");
    const commissions = read('src/components/goals/tabs/CommissionsTab.tsx');
    expect(commissions).toContain('iconToneClasses[product.tone]');
    const financial = read('src/components/goals/FinancialSummaryCard.tsx');
    expect(financial).toContain('aria-pressed={!isAnnual}');
    expect(financial).toContain('aria-pressed={isAnnual}');
    const distribution = read('src/components/goals/DistributionModal.tsx');
    expect(distribution).toContain('text-primary-foreground');
  });

  it('goals family respects semantic chart colors, keyboard controls and compatibility', () => {
    const chart = read('src/components/goals/SeasonalityChart.tsx');
    expect(chart).not.toContain('hsl(var(');
    expect(chart).toContain('stroke="var(--border)"');
    expect(chart).toContain('fill="var(--primary)"');
    const simulator = read('src/components/goals/CommissionSimulator.tsx');
    expect(simulator).toContain('aria-pressed={selectedProductType === type.key}');
    expect(simulator).toContain('className="sr-only"');
    const progress = read('src/components/goals/EnhancedProgressBar.tsx');
    expect(progress).toContain('role="progressbar"');
    const stats = read('src/components/goals/StatsCard.tsx');
    expect(stats).not.toContain('bg-gradient-to-br');
    const campaigns = read('src/components/goals/tabs/CampaignsTab.tsx');
    expect(campaigns).toContain('aria-pressed={campaign.active}');
    const statement = read('src/components/goals/tabs/StatementTab.tsx');
    expect(statement).toContain('aria-label="Filtrar comissões por mês"');
  });

  it('records bounded real axe defects and keeps commissions navigable on mobile', () => {
    const qa = read('test/e2e/run-authenticated-smoke.mjs');
    expect(qa).toContain('CRM_B4_GOALS_A11Y_DIAGNOSTIC=');
    expect(qa).toContain('goalsA11yFailures.push(state)');
    const commissions = read('src/components/goals/tabs/CommissionsTab.tsx');
    expect(commissions).toContain('data-qa-region="goals-commissions"');
    expect(commissions).toContain('lg:flex-row');
    expect(commissions).toContain('aria-pressed={selectedUserId === (user.user_id || user.id)}');
  });

  it('proves Goals family tabs and actual theme-based chart fill in authenticated QA', () => {
    const e2e = read('test/e2e/run-authenticated-smoke.mjs');
    expect(e2e).toContain('async function assertGoalsFamilyStates(');
    for (const state of ['commissions', 'campaigns', 'planning', 'statement', 'seasonality']) {
      expect(e2e).toContain("'"+state+"'");
    }
    expect(e2e).toContain('GOALS_CHART_COLOR_NOT_PROPAGATED');
    expect(e2e).toContain("route === '/goals'");
    expect(e2e).toContain("profileIndex === 0");
    expect(e2e).toContain("getComputedStyle(bar).fill === expected");
  });

  it('keeps planning in a true full-row toolbar plus 5/7 split and labels inputs', () => {
    const planning = read('src/components/goals/tabs/PlanningTab.tsx');
    expect(planning).toContain('full grid row before the 5/7 split');
    expect(planning).toContain('className="col-span-12 min-w-0"');
    expect(planning).not.toContain('className="col-span-2 md:col-span-1">\\n                                <div');
    for (const label of [
      'Meta financeira mensal do cenário', 'Ticket médio da venda',
      'Conversão de oportunidades em porcentagem', 'Meta sazonal do trimestre',
      'Encargos da folha em porcentagem', 'Nome do cenário financeiro',
    ]) expect(planning).toContain(label);
    const campaigns = read('src/components/goals/tabs/CampaignsTab.tsx');
    for (const label of ['Nome da nova campanha', 'Percentual da nova campanha', 'Valor fixo da nova campanha']) {
      expect(campaigns).toContain(label);
    }
    const profit = read('src/components/goals/ProfitabilityChart.tsx');
    const season = read('src/components/goals/SeasonalityChart.tsx');
    for (const code of [profit, season]) {
      expect(code).toContain('AccessibleChart');
      expect(code).toContain('tick={false}');
    }
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    expect(runner).toContain('Wait for the real Radix tab');
  });

  it('prevents clipped financial mode choices and contrast-ambiguous decorative overlays', () => {
    const planning = read('src/components/goals/tabs/PlanningTab.tsx');
    expect(planning).not.toContain('col-span-2 md:col-span-1 min-w-0');
    expect(planning).toContain('bg-surface-subtle p-5 sm:p-6');
    expect(planning).not.toContain('absolute top-0 right-0 p-4 opacity-10');
    const e2e = read('test/e2e/run-authenticated-smoke.mjs');
    expect(e2e).toContain('Quantized bounding box only');
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
