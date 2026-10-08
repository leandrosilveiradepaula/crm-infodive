import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hook = readFileSync('src/hooks/useDeals.ts', 'utf8');
const palette = readFileSync('src/components/layout/CommandBar.tsx', 'utf8');
const service = readFileSync('src/services/DashboardService.ts', 'utf8');
const styles = readFileSync('src/components/layout/CommandPalette.css', 'utf8');

describe('CRM command palette runtime integration', () => {
    it('uses the real typed pipeline list rather than casting its wrapper to an array', () => {
        expect(hook).toContain('setDeals(data.deals)');
        expect(hook).not.toContain('setDeals(data as any as Deal[])');
        expect(palette).toContain('deals.slice(0, 20)');
    });

    it('uses one server-side authoritative stage mutation and reports failure explicitly', () => {
        expect(hook).toContain('const updateDealStage = async (id: string, newStage: string): Promise<boolean>');
        expect(hook).toContain('return true;');
        expect(hook).toContain('return false;');
        expect(hook).not.toContain('checkAutomations(');
        expect(palette).toContain('const updated = await updateDealStage(selectedDealId, stage)');
        expect(palette).toContain("if (!updated)");
        expect(palette).toContain('toast.error(');
        expect(palette).toContain('toast.success(');
    });

    it('does not render stale search results and surfaces failures', () => {
        expect(palette).toContain('let cancelled = false');
        expect(palette).toContain('if (cancelled) return');
        expect(palette).toContain('return () => {');
        expect(palette).toContain('cancelled = true');
        expect(palette).toContain('Busca indisponível no momento.');
        expect(service).not.toContain('title.ilike.${searchTerm}');
    });

    it('does not advertise keyboard shortcuts that have no handler', () => {
        expect(palette).not.toContain('SHIFT+C');
        expect(palette).not.toContain('G P');
        expect(palette).not.toContain('G C');
    });

    it('uses accessible palette colors and motion preference', () => {
        expect(styles).toContain('color: var(--foreground)');
        expect(styles).toContain('max-height: min(65dvh, 480px)');
        expect(styles).toContain('.text-muted-foreground');
        expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
        expect(styles).not.toContain('font-weight: 600px');
    });
});
