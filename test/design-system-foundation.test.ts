import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Infodive design-system foundation', () => {
    it('defines semantic surfaces in both color modes', () => {
        const css = source('src/app/globals.css');
        for (const token of ['--surface:', '--surface-raised:', '--surface-subtle:', '--success-subtle:', '--shadow-panel:', '--radius-control:']) {
            expect(css.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))?.length).toBeGreaterThanOrEqual(2);
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
});
