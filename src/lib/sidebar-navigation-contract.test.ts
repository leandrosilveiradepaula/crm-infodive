import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
const shell = readFileSync('src/components/layout/DashboardShell.tsx', 'utf8');
const header = readFileSync('src/components/layout/Header.tsx', 'utf8');

describe('sidebar / mobile navigation contract', () => {
    it('closes the mobile menu after every primary route selection', () => {
        expect((sidebar.match(/onNavigate=\{closeMobileMenu\}/g) ?? []).length).toBe(16);
        expect(sidebar).toContain('onClick={onNavigate}');
        expect(sidebar).toContain('onClick={closeMobileMenu}');
    });

    it('keeps the closed mobile navigation out of keyboard focus', () => {
        expect(sidebar).toContain('invisible lg:visible');
        expect(sidebar).toContain('visible" :');
        expect(sidebar).toContain('id="crm-primary-navigation"');
    });

    it('offers a backdrop and Escape dismissal without hiding desktop navigation', () => {
        expect(shell).toContain('if (event.key === \'Escape\') setIsMobileMenuOpen(false)');
        expect(shell).toContain('onClick={() => setIsMobileMenuOpen(false)}');
        expect(shell).toContain('bg-black/50 lg:hidden');
    });

    it('announces toggle state and active nested routes to assistive technology', () => {
        expect(header).toContain('aria-expanded={Boolean(isMobileMenuOpen)}');
        expect(header).toContain('aria-expanded={!isSidebarCollapsed}');
        expect(sidebar).toContain('aria-current={isActive ? \'page\' : undefined}');
        expect(sidebar).toContain('isSidebarNavActive(pathname,');
    });

    it('retains sign out and navigation labels in collapsed / mobile views', () => {
        expect(sidebar).not.toContain('{!isCollapsed && (');
        expect(sidebar).toContain('aria-label="Sair do sistema"');
        expect(sidebar).toContain('lg:sr-only');
        expect(sidebar).toContain('min-h-10');
        expect(sidebar).toContain('focus-visible:outline-2');
    });
});
