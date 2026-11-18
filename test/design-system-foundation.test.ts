import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Infodive design-system foundation', () => {
    it('defines semantic surfaces in both themes while inheriting shared geometry', () => {
        const css = source('src/app/globals.css');
        const light = css.match(/:root\s*\{([^}]+)\}/)?.[1];
        const dark = css.match(/\.dark\s*\{([^}]+)\}/)?.[1];

        expect(light).toBeDefined();
        expect(dark).toBeDefined();
        for (const theme of [light, dark]) {
            for (const token of ['--surface:', '--surface-raised:', '--surface-subtle:', '--success-subtle:', '--warning-subtle:', '--info-subtle:', '--destructive-subtle:']) {
                expect(theme).toContain(token);
            }
        }

        // Radius, shadows and layout width are shared values inherited by dark mode.
        // They must not be duplicated in .dark just to satisfy this test.
        for (const token of ['--shadow-panel:', '--shadow-float:', '--radius-control:', '--radius-panel:', '--content-max-width:']) {
            expect(light).toContain(token);
        }
    });

    it('keeps shared UI/layout free of literal color values', () => {
        for (const path of ['src/components/ui/button.tsx', 'src/components/ui/input.tsx', 'src/components/ui/card.tsx', 'src/components/layout/Header.tsx', 'src/components/layout/Sidebar.tsx']) {
            expect(source(path)).not.toMatch(/(?:#[0-9a-fA-F]{3,8}|\b(?:rgb|hsl|oklch)\()/);
        }
    });

    it('keeps the catalog inside the authenticated dashboard route group', () => {
        expect(() => source('src/app/(dashboard)/design-preview/page.tsx')).not.toThrow();
        expect(() => source('src/app/design-preview/page.tsx')).toThrow();
    });

    it('uses the Infodive identity and accessible mobile-menu dismissal', () => {
        expect(source('src/components/layout/Sidebar.tsx')).toContain('Infodive CRM');
        expect(source('src/components/layout/DashboardShell.tsx')).toContain('aria-label="Fechar menu"');
    });

    it('keeps shared layout and dashboard surfaces opaque for contrast in both themes', () => {
        const css = source('src/app/globals.css');
        const glass = css.match(/\.glass-card\s*\{([^}]+)\}/)?.[1] ?? '';
        expect(glass).toContain('bg-card');
        expect(glass).not.toMatch(/bg-card\/80|backdrop-blur|backdrop-filter/);
        for (const path of ['src/components/layout/Header.tsx', 'src/components/layout/PageHeader.tsx']) {
            const header = source(path);
            expect(header).toContain('bg-background');
            expect(header).not.toMatch(/bg-background\/90|backdrop-blur/);
        }
        const health = source('src/components/dashboard/HealthWidget.tsx');
        const stats = source('src/components/dashboard/StatsWidget.tsx');
        const performers = source('src/components/dashboard/TopPerformersWidget.tsx');
        expect(health).not.toContain('text-white');
        expect(health).toContain('text-primary-foreground');
        expect(stats).not.toContain('tracking-widest opacity-60');
        expect(performers).not.toContain('bg-gradient-to-br');
        expect(performers).not.toContain('tracking-widest opacity-60');
    });

    it('removes gradient-backed chart labels and translucent dashboard text overlays', () => {
        const chart = source('src/components/dashboard/SalesChartWidget.tsx');
        const funnel = source('src/components/dashboard/FunnelWidget.tsx');
        const stats = source('src/components/dashboard/StatsWidget.tsx');
        const deals = source('src/components/dashboard/RecentDealsWidget.tsx');
        const tasks = source('src/components/dashboard/TasksWidget.tsx');
        const dashboard = source('src/app/(dashboard)/dashboard/client-page.tsx');

        expect(chart).not.toContain('<linearGradient');
        expect(chart).not.toContain('url(#colorSales)');
        expect(chart).toContain('fill="var(--surface-subtle)"');
        expect(funnel).not.toContain('<LabelList');
        expect(funnel).toContain('role="list"');
        expect(stats).not.toContain('bg-opacity-10');
        expect(stats).not.toContain('bg-success/10 text-success');
        expect(deals).not.toContain('bg-primary/20 text-primary');
        expect(tasks).not.toContain('bg-destructive/20 text-destructive');
        expect(dashboard).toContain('data-qa-region={widget.id}');
    });

    it('makes horizontally scrollable tables reachable by keyboard', () => {
        const table = source('src/components/ui/table.tsx');
        expect(table).toContain('role="region"');
        expect(table).toContain('aria-label="Tabela com rolagem horizontal"');
        expect(table).toContain('tabIndex={0}');
    });
});
