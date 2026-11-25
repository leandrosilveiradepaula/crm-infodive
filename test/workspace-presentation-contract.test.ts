import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(path, 'utf8');

describe('Cross-workspace presentation contract', () => {
    it('uses one responsive summary across standard and directory workspaces', () => {
        const stats = read('src/components/layout/StatsGrid.tsx');
        expect(stats).toContain("items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'");
        expect(stats).toContain('var(--ds-stat-compact-padding)');
        expect(stats).toContain('[overflow-wrap:anywhere]');
        expect(stats).not.toContain('truncate');
        const dashboard = read('src/components/dashboard/StatsWidget.tsx');
        expect(dashboard).toContain('<StatsGrid items={stats}');
        expect(dashboard).toContain("router.push('/pipeline')");
        expect(dashboard).toContain("router.push('/reports')");
        expect(dashboard).not.toContain('+12.5%');
    });
    it.each(['goals/client-page.tsx','settings/client-page.tsx','integrations/client-page.tsx','sales/SalesList.tsx'])('%s uses the shared responsive workspace navigation', route => {
        expect(read('src/app/(dashboard)/' + route)).toContain('<TabsList layout="workspace"');
        expect(read('src/components/ui/tabs.tsx')).toContain('data-layout={layout}');
    });
    it('keeps the pipeline list discoverable without changing its filtered data or stage actions', () => {
        const pipeline = read('src/app/(dashboard)/pipeline/client-page.tsx');
        expect(pipeline).toContain('shown={filteredDeals.length}');
        expect(pipeline).toContain('data-qa-region="pipeline-table"');
        expect(pipeline).toContain('aria-label="Oportunidades"');
        expect(pipeline).toContain('Abrir oportunidade');
        expect(pipeline).toContain('onDragEnd={onDragEnd}');
        expect(pipeline).toContain('aria-pressed={isSelected}');
    });
    it('keeps proposal status controls and open action keyboard accessible', () => {
        const list = read('src/components/proposals/ProposalsTab.tsx');
        const row = read('src/components/proposals/ProposalRow.tsx');
        expect(list).toContain('aria-pressed={statusFilter === status.id}');
        expect(list).toContain('onClick={onGenerate}');
        expect(list).toContain('fetchProposals(dealId)');
        expect(row).toContain('Abrir proposta');
        expect(row).toContain('onClick={() => onView(proposal)}');
        expect(row).toContain('formatCurrency(proposal.total)');
    });
    it('exposes unavailable service desk states and does not invent connectivity', () => {
        expect(read('src/app/(dashboard)/service-desk/page.tsx')).toContain('Nenhum banco alternativo será utilizado.');
        expect(read('src/app/(dashboard)/service-desk/knowledge/page.tsx')).toContain('Não autorizado ou conhecimento indisponível.');
        expect(read('src/components/email/EmailClient.tsx')).toContain('<ConnectEmailButton />');
    });
});
