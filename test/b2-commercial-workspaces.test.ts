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
        expect(pipeline).toContain("accent: 'bg-stage-qualification'");
        expect(pipeline).toContain("surface: 'bg-stage-won/5 border-stage-won/20'");
        expect(pipeline).toContain('data-qa-stage={stage.id}');
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

    it('retains the clear-filters action when customer results are empty', () => {
        const customers = source('src/app/(dashboard)/customers/client-page.tsx');
        expect(customers).toContain('onReset={clearFilters} resetLabel="Limpar filtros de empresas"');
        expect(source('src/components/layout/DirectoryResults.tsx')).toContain('Limpar filtros');
    });

    it('renders read-only KPIs as information rather than disabled controls', () => {
        const stats = source('src/components/layout/StatsGrid.tsx');
        expect(stats).not.toContain('disabled={!isClickable}');
        expect(stats).toContain('return isClickable ? (');
        expect(stats).toContain('<div key={index} data-slot="stats-tile" className={tileClasses}>');
    });

});
