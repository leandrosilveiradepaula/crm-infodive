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
        <header className="bg-card dark:bg-gray-950/50 dark:backdrop-blur-md border-b border-border dark:border-border px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-muted-foreground dark:text-muted-foreground hover:bg-muted/50 dark:hover:bg-gray-800 rounded-lg"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="hidden lg:flex items-center gap-2">
                    <button
                        onClick={onToggleSidebar}
                        className="p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-all"
                        title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
                    >
                        <Menu className={cn("h-5 w-5 transition-transform duration-300", isSidebarCollapsed && "rotate-90")} />
                    </button>
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground dark:text-white truncate">Bem-vindo, {firstName} 👋</h2>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        className="pl-10 w-48 lg:w-64 bg-muted/50 dark:bg-background border-border dark:border-border"
                    />
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAiOpen(true)}
                    className="text-primary hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
                </Button>
            </div>

            <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        </header>
    );
}
