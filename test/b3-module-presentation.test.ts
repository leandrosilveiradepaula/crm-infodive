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
});
