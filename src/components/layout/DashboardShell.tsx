'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandBar } from './CommandBar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandOpen(true);
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-muted/50 dark:bg-background transition-colors">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            <main className="flex-1 flex flex-col overflow-hidden w-full relative">
                <Header 
                    onMenuClick={() => setIsMobileMenuOpen(true)} 
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    onSearchClick={() => setIsCommandOpen(true)}
                />
                <div className="flex-1 overflow-auto px-2 lg:px-4 pb-2 lg:pb-4 w-full">
                    {children}
                </div>
                <CommandBar open={isCommandOpen} onOpenChange={setIsCommandOpen} />
            </main>
        </div>
    );
}
