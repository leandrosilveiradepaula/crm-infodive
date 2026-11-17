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
        expect(source('src/components/pipeline/DealCard.tsx')).toContain("event.key === 'Enter'");
        expect(source('src/components/ui/ViewToggle.tsx')).toContain('aria-pressed');
    });
});
