'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // The desktop rail is persistent. The mobile drawer is a modal navigation
    // surface: keyboard users must not reach the obscured workspace.
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const drawer = document.getElementById('crm-sidebar');
        const opener = document.querySelector<HTMLElement>('[data-slot="crm-mobile-menu-trigger"]');
        if (!drawer) return;
        const desktop = window.matchMedia('(min-width: 1024px)');
        if (desktop.matches) {
            setIsMobileMenuOpen(false);
            return;
        }
        const controls = () => Array.from(drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(node => node.tabIndex >= 0 && node.getClientRects().length > 0 &&
            getComputedStyle(node).visibility === 'visible');
        const close = drawer.querySelector<HTMLElement>('[data-slot="crm-mobile-menu-close"]');
        close?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setIsMobileMenuOpen(false);
            } else if (event.key === 'Tab') {
                const items = controls();
                if (!items.length) return;
                const active = document.activeElement;
                const first = items[0], last = items[items.length - 1];
                if (!drawer.contains(active) || (event.shiftKey && active === first) ||
                    (!event.shiftKey && active === last)) {
                    event.preventDefault();
                    (event.shiftKey ? last : first).focus();
                }
            }
        };
        const onResize = (event: MediaQueryListEvent) => {
            if (event.matches) setIsMobileMenuOpen(false);
        };
        document.addEventListener('keydown', onKeyDown, true);
        desktop.addEventListener('change', onResize);
        return () => {
            document.removeEventListener('keydown', onKeyDown, true);
            desktop.removeEventListener('change', onResize);
            if (!desktop.matches) requestAnimationFrame(() => opener?.focus());
        };
    }, [isMobileMenuOpen]);

    return (
        <div data-slot="crm-dashboard-shell" className="flex h-dvh overflow-hidden bg-surface-subtle transition-colors">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isCollapsed={isSidebarCollapsed}
            />

            {isMobileMenuOpen && (
                <button
                    aria-label="Fechar menu"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            {/* Inert prevents interaction, not painting. While the mobile drawer
                is open, confine all workspace z-index layers below it. */}
            <main inert={isMobileMenuOpen} className={`flex-1 flex min-w-0 flex-col overflow-hidden w-full relative ${isMobileMenuOpen ? 'isolate' : ''}`}>
                <Header 
                    isMobileMenuOpen={isMobileMenuOpen}
                    onMenuClick={() => setIsMobileMenuOpen(true)} 
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <div className="flex-1 overflow-auto px-3 pb-3 sm:px-4 lg:px-6 lg:pb-6 w-full">
                    <div className="app-content">{children}</div>
                </div>
            </main>
        </div>
    );
}
