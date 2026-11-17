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

    it('makes horizontally scrollable tables reachable by keyboard', () => {
        const table = source('src/components/ui/table.tsx');
        expect(table).toContain('role="region"');
        expect(table).toContain('aria-label="Tabela com rolagem horizontal"');
        expect(table).toContain('tabIndex={0}');
    });
});
