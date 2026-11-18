import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('CRM #214 B4 authenticated accessibility remediation regressions', () => {
    it('names the real filter controls rather than inferring from an option value', () => {
        const cases: Record<string, string[]> = {
            'src/app/(dashboard)/leads/client-page.tsx': ['Filtrar leads por status', 'Filtrar leads por interesse'],
            'src/app/(dashboard)/contacts/client-page.tsx': ['Filtrar contatos por empresa', 'Filtrar contatos por cargo'],
            'src/app/(dashboard)/activities/client-page.tsx': ['Filtrar atividades por status', 'Filtrar atividades por tipo'],
            'src/app/(dashboard)/contracts/client-page.tsx': ['Filtrar contratos por status'],
            'src/app/(dashboard)/products/client-page.tsx': ['Filtrar produtos por marca', 'Filtrar produtos por categoria'],
            'src/app/(dashboard)/reports/client-page.tsx': [
                'Filtrar relatórios por status', 'Filtrar relatórios por faturamento',
                'Filtrar relatórios por vendedor', 'Selecionar ano do relatório',
            ],
        };
        for (const [path, names] of Object.entries(cases)) {
            const file = source(path);
            for (const name of names) expect(file).toContain('aria-label="' + name + '"');
        }
    });

    it('provides accessible names for actual icon controls and color inputs', () => {
        const cases: Record<string, string[]> = {
            'src/components/leads/LeadCard.tsx': ['Opções do lead'],
            'src/components/customers/CustomerCard.tsx': ['Opções da empresa'],
            'src/app/(dashboard)/customers/client-page.tsx': ['Limpar filtros de empresas'],
            'src/app/(dashboard)/dashboard/client-page.tsx': [
                'Selecionar ano do Dashboard', 'Configurar layout do Dashboard', 'Fechar configuração de layout',
            ],
            'src/app/(dashboard)/settings/client-page.tsx': [
                'Selecionar cor primária da marca', 'Selecionar cor secundária da marca',
                'Alternar modo escuro',
            ],
            'src/app/(dashboard)/activities/client-page.tsx': ['Editar atividade', 'Excluir atividade'],
            'src/app/(dashboard)/automations/client-page.tsx': [
                'Descrever automação por IA', 'Limpar filtro de tipo', 'Opções da automação',
                'Fechar biblioteca de receitas', 'Habilitar automação',
            ],
        };
        for (const [path, names] of Object.entries(cases)) {
            const file = source(path);
            for (const name of names) expect(file).toContain('aria-label="' + name + '"');
        }
    });

    it('makes the AI suggestions panel keyboard operable with an opaque surface', () => {
        const file = source('src/components/activities/AiSuggestionsPanel.tsx');
        expect(file).not.toContain('bg-gradient-to-br from-primary/5 via-card');
        expect(file).toContain('bg-card border border-border');
        expect(file).toContain('Expandir sugestões de IA');
        expect(file).toContain('aria-expanded={!collapsed}');
        expect(file).toContain('onClick={() => setCollapsed(!collapsed)}');
        expect(file).toContain('aria-label="Aceitar e criar atividade"');
        expect(file).toContain('aria-label="Dispensar sugestão"');
    });

    it('separates drag-and-drop keyboard access from buttons inside a deal card', () => {
        const file = source('src/components/pipeline/DealCard.tsx');
        expect(file).toContain('{...provided.dragHandleProps}');
        expect(file).toContain('Arrastar oportunidade');
        expect(file).toContain('Abrir detalhes');
        expect(file).toContain('event.stopPropagation()');
        expect(file).not.toContain('provided.dragHandleProps as React.HTMLAttributes<HTMLDivElement>');
    });

    it('uses opaque text-bearing surfaces in the shared goals and reports workspaces', () => {
        const commissions = source('src/components/goals/tabs/CommissionsTab.tsx');
        const reports = source('src/app/(dashboard)/reports/client-page.tsx');
        const activities = source('src/app/(dashboard)/activities/client-page.tsx');
        expect(commissions).toContain('comissão de cliente base em porcentagem');
        expect(commissions).toContain('comissão de cliente novo em porcentagem');
        expect(commissions).not.toContain('bg-gradient-to-br from-muted to-muted/50');
        expect(reports).toContain('bg-success-subtle hover:bg-muted text-foreground');
        expect(activities).toContain('bg-destructive-subtle');
        expect(activities).toContain('aria-label={activity.status');
    });

    it('keeps all genuine WCAG failures fail-closed while reporting bounded diagnostics', () => {
        const runner = source('test/e2e/run-authenticated-smoke.mjs');
        expect(runner).toContain('axeReport.incompleteCount + axeReport.violationsCount');
        expect(runner).toContain('inspectViolation');
        expect(runner).toContain('hasAriaLabelledBy:');
        expect(runner).toContain('hasExplicitLabel:');
        expect(runner).toContain('CRM_B4_A11Y_DIAGNOSTIC=');
        expect(runner).toContain('WCAG remains unresolved');
        expect(runner).not.toContain("runOnly: { type: 'rule', values: ['color-contrast'] }");
        expect(runner).not.toContain('disableRules:');
    });
    it('labels genuine company filters, monetary goals and organization inputs', () => {
        const customers = source('src/app/(dashboard)/customers/client-page.tsx');
        for (const name of ['Filtrar empresas por status', 'Filtrar empresas por segmento', 'Filtrar empresas por relacionamento'])
            expect(customers).toContain('aria-label="' + name + '"');
        const table = source('src/components/customers/CustomersTable.tsx');
        expect(table).toContain('aria-label={`Editar empresa ${account.name}`}');
        expect(table).toContain('aria-label={`Excluir empresa ${account.name}`}');
        expect(source('src/components/goals/GoalInput.tsx')).toContain('aria-label={label}');
        const goals = source('src/components/goals/tabs/GoalsTab.tsx');
        for (const name of ['Meta anual de', 'Meta Q1 de', 'Meta Q2 de', 'Meta Q3 de', 'Meta Q4 de'])
            expect(goals).toContain(name);
        const settings = source('src/app/(dashboard)/settings/client-page.tsx');
        for (const name of ['Razão social ou nome fantasia', 'Email institucional', 'CNPJ da empresa', 'Inscrição estadual', 'CEP', 'Logradouro', 'Número do endereço', 'Bairro', 'Cidade', 'Estado (UF)'])
            expect(settings).toContain('aria-label="' + name + '"');
        expect(source('src/app/(dashboard)/automations/client-page.tsx')).not.toContain('opacity-60 grayscale-[0.8]');
    });

    it('provides semantic datasets with keyboard equivalents for chart drill-downs', () => {
        const chart = source('src/components/charts/AccessibleChart.tsx');
        expect(chart).not.toContain('aria-hidden="true"');
        expect(chart).toContain('<details');
        expect(chart).toContain('Ver dados: {label}');
        expect(chart).toContain('<summary');
        expect(chart).toContain('onClick={() => onSelect(index)}');
        for (const path of [
            'src/components/dashboard/SalesChartWidget.tsx',
            'src/app/(dashboard)/sales/tabs/DashboardTab.tsx',
            'src/components/charts/ReportsCharts.tsx',
            'src/components/goals/tabs/GoalsTab.tsx',
        ]) expect(source(path)).toContain('<AccessibleChart');
        const sales = source('src/app/(dashboard)/sales/tabs/DashboardTab.tsx');
        const goals = source('src/components/goals/tabs/GoalsTab.tsx');
        const dashboard = source('src/components/dashboard/SalesChartWidget.tsx');
        for (const sourceText of [sales, goals, dashboard]) {
            expect(sourceText).toContain('tick={false}');
            expect(sourceText).not.toContain('tick={{ fill:');
        }
        expect(sales).not.toContain('<Legend');
                const reports = source('src/components/charts/ReportsCharts.tsx');
        expect(reports).toContain('tick={false}');
        expect(reports).not.toContain('stroke="var(--muted-foreground)"');
        expect(reports).toContain('onSelect={onBarClick ?');
        expect(reports).toContain('onSelect={onPieClick ?');
    });

    it('keeps the dashboard AI actions readable throughout its lifecycle and in dark theme', () => {
        const panel = source('src/components/activities/AiSuggestionsPanel.tsx');
        expect(panel).not.toContain('animate-in fade-in duration-500');
        expect(panel).not.toContain('opacity-50 pointer-events-none');
        expect(panel).not.toContain('disabled:opacity-50');
        expect(panel).toContain('bg-card border border-border shadow-sm');

        const performers = source('src/components/dashboard/TopPerformersWidget.tsx');
        expect(performers).toContain('text-success-readable');
        expect(performers).not.toContain('text-success font-black');

        const tokens = source('src/app/globals.css');
        expect(tokens).toContain('--color-success-readable: var(--success-readable);');
        expect(tokens).toContain('--success-readable: oklch(0.37 0.13 149.214);');
        expect(tokens).toContain('--success-readable: oklch(0.82 0.115 149.214);');
    });


    it('keeps opaque text surfaces and responsive mobile layouts across all B4 failure areas', () => {
        const goals = source('src/components/goals/tabs/GoalsTab.tsx');
        expect(goals).not.toContain('fade-in slide-in-from-bottom-4 duration-700');
        expect(goals).toContain('<thead className="bg-surface-raised');
        const goalsPage = source('src/app/(dashboard)/goals/client-page.tsx');
        expect(goalsPage).not.toContain('pb-10 animate-in fade-in');
        expect(goalsPage).toContain('grid-cols-1 gap-1 sm:grid-cols-2');
        const automation = source('src/app/(dashboard)/automations/client-page.tsx');
        expect(automation).not.toContain('pb-10 animate-in fade-in');
        expect(automation).not.toContain('border-border backdrop-blur-sm');
        expect(automation).toContain('bg-surface-subtle p-4 rounded-xl');
        const settings = source('src/app/(dashboard)/settings/client-page.tsx');
        expect(settings).not.toContain('bg-muted/20 border-border');
        expect(settings).toContain('bg-surface-raised border-border');
        const input = source('src/components/ui/input.tsx');
        const select = source('src/components/ui/select.tsx');
        expect(input).not.toContain('dark:bg-input/30');
        expect(select).not.toContain('dark:bg-input/30');
        expect(select).toContain('bg-surface-raised');
        const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
        expect(pipeline).toContain('flex-col gap-4 sm:flex-row');
        expect(pipeline).toContain('w-full shrink-0 flex-col sm:w-80');
        const customers = source('src/app/(dashboard)/customers/client-page.tsx');
        expect(customers).toContain('grid-cols-1 gap-3 px-2 sm:grid-cols-2');
        expect(customers).not.toContain('md:w-auto overflow-x-auto no-scrollbar');
        const sales = source('src/app/(dashboard)/sales/SalesList.tsx');
        expect(sales).toContain('grid-cols-2 gap-1 p-1 sm:inline-flex');
        const design = source('src/app/(dashboard)/design-preview/page.tsx');
        expect(design).toContain('<Table className="table-fixed">');
        expect(design).toContain('whitespace-normal break-words');
        const fixture = source('test/e2e/component-qa/main.tsx');
        expect(fixture).toContain('<DesignPreviewPage />');
        expect(fixture).toContain('<GoalsTab users={syntheticGoals} deals={[]} />');
        expect(fixture).toContain('<AutomationsClientPage initialAutomations={syntheticAutomations as any} />');
        expect(fixture).toContain('<Tabs defaultValue="dashboard">');
    });


    it('uses theme-specific readable semantic text for progress and automation counters', () => {
        const tokens = source('src/app/globals.css');
        for (const name of ['destructive-readable', 'warning-readable', 'success-readable']) {
            expect(tokens).toContain('--color-' + name + ': var(--' + name + ');');
        }
        const bar = source('src/components/goals/EnhancedProgressBar.tsx');
        expect(bar).toContain('text-destructive-readable');
        expect(bar).toContain('text-warning-readable');
        expect(bar).toContain('text-success-readable');
        expect(bar).not.toContain("return 'text-red-600'");
        const automations = source('src/app/(dashboard)/automations/client-page.tsx');
        expect(automations).toContain("'text-success-readable' : 'text-muted-foreground'");
        expect(source('test/e2e/component-qa/main.tsx')).toContain('<EnhancedProgressBar value={50} />');
    });


    it('keeps shared stats, leads, contacts and empty-state text fully readable', () => {
        const stats = source('src/components/layout/StatsGrid.tsx');
        expect(stats).toContain('data-qa-region="stats"');
        expect(stats).not.toContain('text-primary/[0.06]');
        expect(stats).toContain('text-xs font-medium text-foreground');
        expect(stats).toContain('truncate text-xs text-foreground');
        expect(source('src/components/layout/PageHeader.tsx')).toContain('text-sm leading-5 text-foreground');
        expect(source('src/components/ui/PremiumEmptyState.tsx')).toContain('text-foreground max-w-xs');
        expect(source('src/components/leads/LeadCard.tsx')).toContain('text-foreground text-[8px]');
        expect(source('src/components/contacts/ContactCard.tsx')).toContain('text-foreground text-[9px]');
        const fixture = source('test/e2e/component-qa/main.tsx');
        expect(fixture).toContain('<StatsGrid items={[');
        expect(fixture).toContain('<LeadCard lead={{');
        expect(fixture).toContain('<ContactCard contact={{');
    });

    it('reflows all five goals-and-commissions tabs without narrow-screen overlap', () => {
        const tabs = source('src/app/(dashboard)/goals-commissions/client-page.tsx');
        expect(tabs).not.toContain('overflow-x-auto no-scrollbar');
        expect(tabs).toContain('flex-col items-stretch gap-1 p-2 sm:grid sm:grid-cols-2');
        for (const value of ['goals', 'commissions', 'campaigns', 'planning', 'statement']) {
            expect(tabs).toContain('<TabsTrigger value="' + value + '" className="min-h-10');
        }
        expect(source('test/e2e/component-qa/main.tsx')).toContain('Abas de metas e comissões mobile');
    });


    it('regresses the two live Automações WCAG contrast nodes in both themes', () => {
        const src = source('src/app/(dashboard)/automations/client-page.tsx');
        // Axe authenticated #84 and local run #44331065048 identified one count
        // span and one history button on desktop in both themes.
        expect(src).toContain('<span className="bg-surface-raised text-xs px-3 py-1 rounded-full text-foreground">');
        expect(src).not.toContain('bg-muted text-xs px-3 py-1 rounded-full text-muted-foreground');
        expect(src).toContain('gap-2 text-foreground font-black text-xs underline underline-offset-4');
        expect(src).not.toContain('gap-2 text-primary font-black text-xs hover:text-foreground');
    });


    it('keeps real product SKU readable and removes the translucent card glow', () => {
        const src = source('src/components/products/ProductCard.tsx');
        expect(src).toContain('<p className="text-[9px] text-foreground font-mono');
        expect(src).not.toContain('<p className="text-[9px] text-primary font-mono');
        expect(src).not.toContain('bg-primary/5 blur-[40px]');
        expect(src).toContain('bg-surface-subtle text-foreground border-border');
        const runner = source('test/e2e/run-authenticated-smoke.mjs');
        expect(runner).toContain("LOCAL_QA_FIXTURE_NOT_RENDERED: products");
        expect(runner).toContain("LOCAL_QA_FIXTURE_NOT_RENDERED: automations");
        expect(runner).toContain("profileIndex === 3 ? 'QA-ISOLATED-003' : 'QA-SRV-001'");
    });

});
