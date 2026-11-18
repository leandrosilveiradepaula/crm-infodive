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

});
