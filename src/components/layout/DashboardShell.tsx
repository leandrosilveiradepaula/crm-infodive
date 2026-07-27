'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageHeader } from './PageHeader';
import { getLayoutConfig, LAYOUT_CONFIG } from '@/config/layout.config';
import { useLayoutStore } from '@/store/layout';
import { useEffect } from 'react';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname() || '/';
    const config = getLayoutConfig(pathname);
    const { headerActions } = useLayoutStore();

    // Console warning if route is not registered
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            const segments = pathname.split('/').filter(Boolean);
            const basePath = segments.length > 0 ? `/${segments[0]}` : '/dashboard';
            
            // Allow root or some specific paths to bypass if needed, but standard is all mapped.
            if (!LAYOUT_CONFIG[basePath] && basePath !== '/' && basePath !== '/login') {
                console.warn(
                    `%c ⚠️ ROTA NÃO CADASTRADA NO LAYOUT CONFIG`, 
                    'background: red; color: white; padding: 4px; font-weight: bold;',
                    `\nA rota '${basePath}' não foi encontrada em src/config/layout.config.ts.\nPor favor, adicione-a para garantir os paddings corretos do design system.`
                );
            }
        }
    }, [pathname]);

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
                />
                <div className={`flex-1 overflow-auto w-full ${config.padding || 'p-4'} flex justify-center`}>
                    <div className={`w-full ${config.maxWidth || 'max-w-7xl'} flex flex-col`}>
                        {!config.hideHeader && (
                            <PageHeader title={config.title} description={config.description}>
                                {headerActions}
                            </PageHeader>
                        )}
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
