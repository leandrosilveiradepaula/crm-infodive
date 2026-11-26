import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(path, 'utf8');

describe('integrated UX audit contract', () => {
    it('keeps command palette geometry and font in the central configuration', () => {
        const css = read('src/components/layout/CommandPalette.css');
        const tokens = read('src/design-system/tokens.css');
        for (const match of css.matchAll(/var\((--ds-command-[\w-]+)\)/g)) {
            expect(tokens).toContain(match[1] + ':');
        }
        expect(css).not.toMatch(/(?:padding|gap|margin-bottom):\s*\d+(?:px|rem)/);
        expect(css).toContain('font-family: var(--ds-font-family-mono)');
        expect(tokens).toContain('--spacing: var(--ds-spacing-unit)');
    });

    it('keeps the real static dashboard page inventory and authenticated runner in sync', () => {
        const root = 'src/app/(dashboard)';
        const routes: string[] = [];
        const walk = (path: string) => {
            for (const entry of readdirSync(path, { withFileTypes: true })) {
                const file = join(path, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('[')) walk(file);
                else if (entry.isFile() && entry.name === 'page.tsx') {
                    routes.push('/' + path.slice(root.length + 1).replaceAll('\\\\', '/'));
                }
            }
        };
        walk(root);
        const runner = read('test/e2e/run-authenticated-smoke.mjs');
        const list = runner.match(/const defaultRoutes = \[([\s\S]*?)\];/)?.[1] ?? '';
        const audited = [...list.matchAll(/'([^']+)'/g)].map(match => match[1]);
        expect(audited.sort()).toEqual(routes.sort());
        expect(runner).toContain("state: 'final-tablet-route'");
        expect(runner).toContain("state: 'final-workspace-token-coverage'");
    });

    it('audits actual keyboard navigation and prevents clipped tablet Kanban headers', () => {
        const runner = read('test/e2e/run-authenticated-smoke.mjs');
        expect(runner).toContain("await page.keyboard.press('Shift+Tab')");
        expect(runner).toContain('CRM_FINAL_KEYBOARD_INDICATOR_MISSING');
        expect(runner).toContain('CRM_FINAL_TABLET_KANBAN_CLIPPED');
        expect(runner).toContain('CRM_FINAL_TABLET_AXE_DETAIL=');
        expect(read('src/app/(dashboard)/pipeline/client-page.tsx')).toContain('flex-col gap-[var(--ds-stat-gap)] xl:flex-row');
    });

    it('provides explicit mobile menu visibility, isolation, dismissal and honest notification state', () => {
        expect(read('src/components/layout/Sidebar.tsx')).toContain('invisible -translate-x-full lg:visible');
        const shell = read('src/components/layout/DashboardShell.tsx');
        expect(shell).toContain('inert={isMobileMenuOpen}');
        expect(shell).toContain("isMobileMenuOpen ? 'isolate' : ''");
        const runner = read('test/e2e/run-authenticated-smoke.mjs');
        expect(runner).toContain('CRM_FINAL_MENU_VISUAL_STACKING_LEAK');
        expect(runner).toContain('CRM_FINAL_MENU_STACKING_NOT_RESTORED');
        expect(shell).toContain("event.key === 'Escape'");
        expect(shell).toContain('opener?.focus()');
        const header = read('src/components/layout/Header.tsx');
        expect(header).toContain('aria-expanded={isMobileMenuOpen}');
        expect(header).toContain('disabled aria-label="Notificações indisponíveis"');
    });
});
