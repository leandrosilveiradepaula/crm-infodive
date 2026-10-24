import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const reportsPage = readFileSync('src/app/(dashboard)/reports/client-page.tsx', 'utf8');

describe('Reports filter accessibility', () => {
    it('provides programmatic names for the authorized filters', () => {
        expect(reportsPage).toContain('htmlFor="reports-search"');
        expect(reportsPage).toContain('id="reports-search"');
        expect(reportsPage).toContain('htmlFor="reports-year"');
        expect(reportsPage).toContain('htmlFor="reports-status"');
        expect(reportsPage).toContain('htmlFor="reports-billing"');
        expect(reportsPage).toContain('htmlFor="reports-seller"');
    });

    it('exposes selected semantic states for all-time and quarter controls', () => {
        expect(reportsPage).toContain('aria-pressed={selectedQuarters.length === 0}');
        expect(reportsPage).toContain('aria-pressed={isSelected}');
        expect(reportsPage).toContain('onClick={() => setSelectedQuarters([])}');
        expect(reportsPage).toContain('previous.includes(value) ? previous.filter(item => item !== value)');
    });

    it('announces loading and empty result states without announcing the loader icon', () => {
        expect(reportsPage).toContain('role="status" aria-live="polite"');
        expect(reportsPage).toContain('<Loader2 aria-hidden="true"');
        expect(reportsPage).toContain('Carregando relatórios');
        expect(reportsPage).toContain('Nenhuma oportunidade encontrada para estes filtros.');
    });

    it('gives report table controls accessible names without using an explicit any', () => {
        expect(reportsPage).toContain('type ReportDeal = {');
        expect(reportsPage).toContain('mappedDeals.map((deal: ReportDeal)');
        expect(reportsPage).toContain('aria-label={`Oportunidade ${deal.title}`}');
        expect(reportsPage).toContain('aria-label={`Vendedor ${deal.owner || \'Desconhecido\'}`}');
        expect(reportsPage).toContain('aria-label="Nenhuma oportunidade encontrada"');
    });
});
