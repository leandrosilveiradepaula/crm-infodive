'use client';

import { useState, useEffect } from 'react';
import { Menu, Search, Moon, Sun, Bell, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { CommandBar } from './CommandBar';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onMenuClick: () => void;
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export function Header({ onMenuClick, isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
    const { toggleTheme } = useTheme();
    const { profile } = useAuth();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);

    useEffect(() => {
        const onGlobalKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandOpen(open => !open);
            }
        };
        window.addEventListener('keydown', onGlobalKeyDown);
        return () => window.removeEventListener('keydown', onGlobalKeyDown);
    }, []);
    
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

    return (
        <header className="sticky top-0 z-30 flex min-h-[var(--ds-header-height)] items-center justify-between border-b border-border bg-background px-[var(--ds-page-header-inline)] py-[var(--ds-header-padding-y)]">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                <button
                    type="button"
                    aria-label="Abrir menu"
                    onClick={onMenuClick}
                    className="focus-ring rounded-[var(--radius-control)] p-2 text-muted-foreground hover:bg-muted lg:hidden"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="focus-ring rounded-[var(--radius-control)] p-2 text-muted-foreground hover:bg-muted transition-colors"
                        title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                    >
                        <Menu className={cn("h-5 w-5 transition-transform duration-300", isSidebarCollapsed && "rotate-90")} />
                    </button>
                </div>
                <p className="truncate ds-type-body font-medium text-muted-foreground sm:text-base">Olá, <span className="font-semibold text-foreground">{firstName}</span></p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
                <button
                    type="button"
                    onClick={() => setIsCommandOpen(true)}
                    aria-label="Buscar no CRM"
                    title="Buscar no CRM (Ctrl+K)"
                    className="hidden md:flex w-48 items-center gap-2 rounded-[var(--radius-control)] border border-input bg-surface-raised px-3 py-2 text-body-ui text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-ring lg:w-64"
                >
                    <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-left">Buscar...</span>
                    <kbd className="text-metadata-ui text-muted-foreground">Ctrl K</kbd>
                </button>

                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buscar no CRM" onClick={() => setIsCommandOpen(true)}>
                    <Search className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAiOpen(true)}
                    className="text-primary hover:bg-accent"
                    title="Watson AI"
                >
                    <Bot className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    title="Alternar Tema"
                    aria-label="Alternar tema"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Alternar tema</span>
                </Button>

                <Button variant="ghost" size="icon" className="relative" aria-label="Notificações" title="Notificações">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>
            </div>

            <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
            <CommandBar open={isCommandOpen} onOpenChange={setIsCommandOpen} />
        </header>
    );
}
