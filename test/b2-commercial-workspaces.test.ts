import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('CRM #214 B2 commercial workspaces', () => {
    it('keeps the five priority workspaces on the shared B1 composition', () => {
        for (const path of [
            'src/app/(dashboard)/dashboard/client-page.tsx',
            'src/app/(dashboard)/pipeline/client-page.tsx',
            'src/app/(dashboard)/leads/client-page.tsx',
            'src/app/(dashboard)/contacts/client-page.tsx',
            'src/app/(dashboard)/customers/client-page.tsx',
        ]) {
            expect(source(path)).toContain("@/components/layout/PageHeader");
        }

        for (const path of [
            'src/app/(dashboard)/pipeline/client-page.tsx',
            'src/app/(dashboard)/leads/client-page.tsx',
            'src/app/(dashboard)/contacts/client-page.tsx',
            'src/app/(dashboard)/customers/client-page.tsx',
        ]) {
            expect(source(path)).toContain("@/components/layout/FilterBar");
        }
    });

    it('uses static, semantic stage styles so Tailwind can render every Kanban state', () => {
        const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
        expect(pipeline).toContain("accent: 'bg-info'");
        expect(pipeline).toContain("surface: 'bg-success/5 border-success/20'");
        expect(pipeline).not.toContain('border-${stage.');
        expect(pipeline).not.toContain('bg-${stage.');
    });

    it('provides empty-state and keyboard affordances for commercial records', () => {
        for (const path of [
            'src/app/(dashboard)/leads/client-page.tsx',
            'src/app/(dashboard)/contacts/client-page.tsx',
            'src/app/(dashboard)/customers/client-page.tsx',
        ]) {
            expect(source(path)).toContain('PremiumEmptyState');
        }
        expect(source('src/components/pipeline/DealCard.tsx')).toContain('Abrir detalhes');
        expect(source('src/components/pipeline/ViewDealModal.tsx')).toContain('aria-label="Fechar detalhes da oportunidade"');
        expect(source('src/components/pipeline/ViewDealModal.tsx')).toContain('text-success-readable');
        expect(source('src/components/pipeline/ViewDealModal.tsx')).not.toContain('text-muted-foreground/50');
        expect(source('src/components/ui/ViewToggle.tsx')).toContain('aria-pressed');
    });
    it('keeps drag keyboard sensor on a separate, accessible button, never around quick actions', () => {
        const card = source('src/components/pipeline/DealCard.tsx');
        expect(card).toContain('{...provided.draggableProps}');
        expect(card).toContain('{...provided.dragHandleProps}');
        expect(card).toContain('type="button"');
        expect(card).toContain('Arrastar oportunidade');
        expect(card).toContain('Abrir detalhes');
        expect(card).toContain('event.stopPropagation()');
        expect(card).not.toContain('provided.dragHandleProps as React.HTMLAttributes<HTMLDivElement>');
    });

    it('keeps Pipeline controls and deal-card metadata legible at the shared compact density', () => {
        const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
        const card = source('src/components/pipeline/DealCard.tsx');
        expect(pipeline).not.toContain('text-[9px]');
        expect(card).not.toContain('text-[8px]');
        expect(card).toContain('text-[11px] font-medium text-muted-foreground');
    });

    it('keeps the pipeline summary compact so the board remains the primary workspace', () => {
        const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
        expect(pipeline).toContain('data-qa-region="pipeline-summary"');
        expect(pipeline).toContain('grid-cols-2');
        expect(pipeline).toContain('lg:grid-cols-4');
        expect(pipeline).not.toContain('<StatsGrid items={stats} />');
    });

    it('offers an accessible board/list switch without changing commercial data', () => {
        const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
        expect(pipeline).toContain("useState<ViewMode>('cards')");
        expect(pipeline).toContain('gridLabel="Visualização em quadro"');
        expect(pipeline).toContain('aria-label="Lista de oportunidades"');
        expect(pipeline).toContain('filteredDeals.map((deal)');
    });

    it('retains the clear-filters action when customer results are empty', () => {
        const customers = source('src/app/(dashboard)/customers/client-page.tsx');
        expect(customers).toContain("'Limpar filtros'");
        expect(customers).toContain('onAction={initialAccounts.length === 0 ? handleCreate : clearFilters}');
    });

    it('renders read-only KPIs as information rather than disabled controls', () => {
        const stats = source('src/components/layout/StatsGrid.tsx');
        expect(stats).not.toContain('disabled={!isClickable}');
        expect(stats).toContain('return isClickable ? (');
        expect(stats).toContain('<div key={index} className={tileClasses}>');
    });

});
