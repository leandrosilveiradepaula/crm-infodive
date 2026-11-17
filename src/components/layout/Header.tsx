'use client';

import { useState } from 'react';
import { Menu, Search, Moon, Sun, Bell, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { cn } from '@/lib/utils';

interface HeaderProps {
    onMenuClick: () => void;
    isSidebarCollapsed?: boolean;
    onToggleSidebar?: () => void;
}

export function Header({ onMenuClick, isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { profile } = useAuth();
    const [isAiOpen, setIsAiOpen] = useState(false);
    
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

    return (
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-background/90 px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="focus-ring rounded-[var(--radius-control)] p-2 text-muted-foreground hover:bg-muted"
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
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">Bem-vindo, {firstName} 👋</h2>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        className="w-48 bg-surface-raised pl-10 lg:w-64"
                    />
                </div>

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
                >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>

                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                </Button>
            </div>

            <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        </header>
    );
}
