'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-dvh overflow-hidden bg-surface-subtle transition-colors">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isCollapsed={isSidebarCollapsed}
            />

            {isMobileMenuOpen && (
                <button
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            <main className="flex-1 flex min-w-0 flex-col overflow-hidden w-full relative">
                <Header 
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
