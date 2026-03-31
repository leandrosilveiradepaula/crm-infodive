'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Trello, // Pipeline uses Kanban or Trello icon usually. Legacy used Trello/Kanban? Let's check.
    FileText,
    Settings,
    LogOut,
    Menu,
    Building2,
    Users,
    User, // Added User icon
    Calendar,
    Kanban,
    Scroll,
    Truck,
    Inbox,
    Zap,
    PieChart,
    Package,
    FileSpreadsheet,
    Target,
    Sparkles,
    BarChart3,
    X,
    Palette
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { useAuth } from '@/hooks/useAuth'; // We will implement this later

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    // const { profile } = useAuth(); // TODO: Implement Auth Hook
    const profile = { full_name: 'Leandro Silveira', role: 'Admin', avatar_url: '' }; // Mock for now

    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            // Hard redirect to clear all React state and client cache
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout falhou:', err);
            window.location.href = '/login';
        }
    };

    return (
        <aside className={cn(
            "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
            "lg:static border-r border-sidebar-border",
            isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
            isCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
            {/* Header */}
            <div className={cn("p-4 flex items-center border-b border-sidebar-border h-20", isCollapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary p-2 rounded-lg flex-shrink-0">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    {!isCollapsed && <span className="font-bold text-xl tracking-tight whitespace-nowrap">Nexus CRM</span>}
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={pathname === '/dashboard'} collapsed={isCollapsed} />
                <NavItem href="/pipeline" icon={Kanban} label="Pipeline" isActive={pathname === '/pipeline'} collapsed={isCollapsed} />
                <NavItem href="/leads" icon={Users} label="Leads" isActive={pathname === '/leads'} collapsed={isCollapsed} />
                <NavItem href="/customers" icon={Building2} label="Empresas" isActive={pathname === '/customers'} collapsed={isCollapsed} />
                <NavItem href="/contacts" icon={Users} label="Contatos" isActive={pathname === '/contacts'} collapsed={isCollapsed} />
                <NavItem href="/activities" icon={Calendar} label="Atividades" isActive={pathname === '/activities'} collapsed={isCollapsed} />
                <NavItem href="/proposals" icon={FileText} label="Propostas" isActive={pathname === '/proposals'} collapsed={isCollapsed} />
                <NavItem href="/contracts" icon={Scroll} label="Contratos" isActive={pathname === '/contracts'} collapsed={isCollapsed} />
                <NavItem href="/sales" icon={Truck} label="Vendas" isActive={pathname === '/sales'} collapsed={isCollapsed} />
                <NavItem href="/inbox" icon={Inbox} label="Inbox" isActive={pathname === '/inbox'} collapsed={isCollapsed} />
                <NavItem href="/automations" icon={Zap} label="Automações" isActive={pathname === '/automations'} collapsed={isCollapsed} />
                <NavItem href="/reports" icon={PieChart} label="Relatórios" isActive={pathname === '/reports'} collapsed={isCollapsed} />

                <div className="pt-4 mt-4 border-t border-sidebar-border">
                    <NavItem href="/integrations" icon={Zap} label="Integrações" isActive={pathname === '/integrations'} collapsed={isCollapsed} />
                    <NavItem href="/products" icon={Package} label="Produtos" isActive={pathname === '/products'} collapsed={isCollapsed} />
                    <NavItem href="/price-lists" icon={FileSpreadsheet} label="Tabelas" isActive={pathname === '/price-lists'} collapsed={isCollapsed} />
                    <NavItem href="/goals-commissions" icon={Target} label="Metas" isActive={pathname === '/goals-commissions'} collapsed={isCollapsed} />
                    <NavItem href="/settings" icon={Settings} label="Configurações" isActive={pathname === '/settings'} collapsed={isCollapsed} />
                    <NavItem href="/design-preview" icon={Palette} label="Design System" isActive={pathname === '/design-preview'} collapsed={isCollapsed} />
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-sidebar-border space-y-4">
                <Button
                    className={cn("w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white border-0", isCollapsed && "px-0")}
                    onClick={() => { }} // Open AI
                >
                    <Sparkles className="h-5 w-5 mr-0" />
                    {!isCollapsed && <span className="ml-2">Watson AI</span>}
                </Button>

                <div className={cn("flex items-center justify-between transition-all w-full", isCollapsed ? "justify-center" : "")}>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>LS</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-sidebar-foreground leading-none truncate">{profile.full_name}</p>
                                <p className="text-xs text-sidebar-foreground/70 mt-1 truncate capitalize">{profile.role}</p>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button onClick={handleLogout} className="p-2 text-sidebar-foreground/50 hover:text-rose-500 transition-colors" title="Sair do sistema">
                            <LogOut className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

function NavItem({ href, icon: Icon, label, isActive, collapsed }: { href: string, icon: any, label: string, isActive: boolean, collapsed: boolean }) {
    return (
        <Link
            href={href}
            title={collapsed ? label : ''}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-900/20" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed ? "justify-center" : ""
            )}
        >
            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground")} />
            {!collapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all">{label}</span>}
        </Link>
    )
}

