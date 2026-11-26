import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('CRM #214 B3 module presentation', () => {
    it('keeps remaining workspace routes on shared B1/B2 layout primitives', () => {
        for (const path of [
            'src/app/(dashboard)/activities/client-page.tsx',
            'src/app/(dashboard)/contracts/client-page.tsx',
            'src/app/(dashboard)/products/client-page.tsx',
            'src/app/(dashboard)/reports/client-page.tsx',
            'src/app/(dashboard)/goals/client-page.tsx',
            'src/app/(dashboard)/goals-commissions/client-page.tsx',
            'src/app/(dashboard)/integrations/client-page.tsx',
        ]) expect(source(path)).toContain("@/components/layout/PageHeader");
    });

    it('does not hide contract actions solely behind hover and labels activity view controls', () => {
        const contracts = source('src/app/(dashboard)/contracts/client-page.tsx');
        const activities = source('src/app/(dashboard)/activities/client-page.tsx');
        expect(contracts).toContain('opacity-100 transition-all md:translate-x-2');
        expect(activities).toContain('aria-label="Visualização em lista"');
        expect(activities).toContain('aria-pressed={viewMode === \'calendar\'}');
    });

    it('migrates the reviewed operational modules to shared controls instead of shell-only styling', () => {
        const serviceDesk = source('src/app/(dashboard)/service-desk/service-desk-client.tsx');
        const knowledge = source('src/app/(dashboard)/service-desk/knowledge/knowledge-client.tsx');
        const automations = source('src/app/(dashboard)/automations/client-page.tsx');
        const settings = source('src/app/(dashboard)/settings/client-page.tsx');

        for (const content of [serviceDesk, knowledge]) {
            expect(content).toContain("@/components/ui/button");
            expect(content).toContain("@/components/ui/input");
            expect(content).toContain("@/components/ui/textarea");
            expect(content).toContain("@/components/layout/PageHeader");
        }
        expect(automations).toContain('<Button');
        expect(automations).not.toContain('text-white px-8 py-3.5 rounded-2xl');
        expect(settings).toContain('shadow-[var(--shadow-card)]');
    });
    it('keeps icon-based empty states inside a Client Component boundary', () => {
        // Passing Lucide React components as function-valued props from a Server
        // Component to a Client Component breaks Next.js prerendering.
        for (const path of [
            'src/app/(dashboard)/price-lists/page.tsx',
        ]) {
            const page = source(path);
            expect(page.trimStart().startsWith("'use client';")).toBe(true);
            expect(page).toContain('<PremiumEmptyState icon={');
        }
    });

    it('uses the existing live sales workspace rather than an unconditional orders empty state', () => {
        const orders = source('src/app/(dashboard)/sales-orders/page.tsx');
        expect(orders).toContain('<SalesList initialTab="orders"');
        expect(orders).not.toContain('Nenhum pedido recente');
    });

    it('labels analytics empty states and does not present fixed trend copy as data', () => {
        const reports = source('src/app/(dashboard)/reports/client-page.tsx');
        const charts = source('src/components/charts/ReportsCharts.tsx');

        expect(reports).not.toContain('description: "+12.5%"');
        expect(reports).not.toContain('description: "+2.1%"');
        expect(reports).not.toContain('description: "+3 dias"');
        expect(charts).toContain('function EmptyChartState');
        expect(charts).toContain('Sem dados para os filtros selecionados.');
    });

    it('keeps report search usable beside filters and automation recipes reachable without a hidden carousel', () => {
        const reports = source('src/app/(dashboard)/reports/client-page.tsx');
        const automations = source('src/app/(dashboard)/automations/client-page.tsx');

        expect(reports).toContain('md:min-w-[18rem]');
        expect(reports).toContain('md:flex-[1_1_34rem]');
        expect(automations).toContain('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4');
        expect(automations).not.toContain('overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar');
    });

});
