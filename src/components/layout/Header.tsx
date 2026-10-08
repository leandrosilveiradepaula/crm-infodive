'use client';

import { useCallback, useState } from 'react';
import { Menu, Search, Moon, Sun, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { cn } from '@/lib/utils';
import { NotificationCenter, useNotifications } from './NotificationCenter';

interface HeaderProps {
    onMenuClick: () => void;
    isSidebarCollapsed?: boolean;
    isMobileMenuOpen?: boolean;
    onToggleSidebar?: () => void;
    onSearchClick?: () => void;
}

export function Header({ onMenuClick, isSidebarCollapsed, isMobileMenuOpen, onToggleSidebar, onSearchClick }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { profile } = useAuth();
    const [isAiOpen, setIsAiOpen] = useState(false);
    const closeAssistant = useCallback(() => setIsAiOpen(false), []);
    const { notifications, markAsRead, clearAll, remove } = useNotifications();
    
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

    return (
        <header className="bg-card dark:bg-gray-950/50 dark:backdrop-blur-md border-b border-border dark:border-border px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 rounded-lg"
                    aria-label="Abrir menu principal"
                    aria-controls="crm-primary-navigation"
                    aria-expanded={Boolean(isMobileMenuOpen)}
                    title="Abrir menu principal"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-all"
                        title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                        aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                        aria-controls="crm-primary-navigation"
                        aria-expanded={!isSidebarCollapsed}
                    >
                        <Menu className={cn("h-5 w-5 transition-transform duration-300", isSidebarCollapsed && "rotate-90")} />
                    </button>
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground dark:text-white truncate">Bem-vindo, {firstName} 👋</h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                <button
                    type="button"
                    onClick={onSearchClick}
                    className="relative hidden md:flex items-center w-48 lg:w-64 h-10 pl-10 pr-3 rounded-md bg-muted/50 dark:bg-background border border-border dark:border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    aria-label="Abrir busca global"
                    title="Abrir busca global"
                >
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <span>Buscar...</span>
                    <kbd className="ml-auto text-xs font-semibold text-muted-foreground">Ctrl K</kbd>
                </button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSearchClick}
                    className="md:hidden"
                    aria-label="Abrir busca global"
                    title="Abrir busca global"
                >
                    <Search className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAiOpen(true)}
                    className="text-primary hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    title="Assistente do CRM"
                    aria-label="Abrir assistente do CRM"
                >
                    <Bot className="h-5 w-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    title="Alternar tema"
                    aria-label="Alternar tema"
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Alternar tema</span>
                </Button>

                <NotificationCenter
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onClearAll={clearAll}
                    onRemove={remove}
                />
            </div>

            <AiAssistant isOpen={isAiOpen} onClose={closeAssistant} />
        </header>
    );
}
