'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Building2,
    Users,
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
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isCollapsed: boolean;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('Logout falhou:', err);
            window.location.href = '/login';
        }
    };

    const userProfile = profile || { full_name: 'Carregando...', role: '...', avatar_url: '' };

    return (
        <aside className={cn(
            "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-[width,transform] duration-200 z-50",
            "lg:static border-r border-sidebar-border",
            isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
            isCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
            {/* Header */}
            <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", isCollapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-primary shadow-sm">
                        <BarChart3 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    {!isCollapsed && <span className="whitespace-nowrap text-base font-semibold tracking-tight">Infodive CRM</span>}
                </div>
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="focus-ring rounded-[var(--radius-control)] p-1 text-sidebar-foreground/70 hover:text-sidebar-foreground lg:hidden"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav
                aria-label="Navegação principal"
                className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-4"
                onClick={(event) => {
                    if ((event.target as HTMLElement).closest('a')) {
                        setIsMobileMenuOpen(false);
                    }
                }}
            >
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={pathname === '/dashboard'} collapsed={isCollapsed} />
                <NavItem href="/pipeline" icon={Kanban} label="Pipeline" isActive={pathname === '/pipeline'} collapsed={isCollapsed} />
                <NavItem href="/leads" icon={Users} label="Leads" isActive={pathname === '/leads'} collapsed={isCollapsed} />
                <NavItem href="/customers" icon={Building2} label="Empresas" isActive={pathname === '/customers'} collapsed={isCollapsed} />
                <NavItem href="/contacts" icon={Users} label="Contatos" isActive={pathname === '/contacts'} collapsed={isCollapsed} />
                <NavItem href="/activities" icon={Calendar} label="Atividades" isActive={pathname === '/activities'} collapsed={isCollapsed} />
                <NavItem href="/contracts" icon={Scroll} label="Contratos" isActive={pathname === '/contracts'} collapsed={isCollapsed} />
                <NavItem href="/service-desk" icon={Inbox} label="Service Desk" isActive={pathname.startsWith('/service-desk')} collapsed={isCollapsed} />
                <NavItem href="/sales" icon={Truck} label="Vendas" isActive={pathname === '/sales'} collapsed={isCollapsed} />
                <NavItem href="/inbox" icon={Inbox} label="Inbox" isActive={pathname === '/inbox'} collapsed={isCollapsed} />
                <NavItem href="/automations" icon={Zap} label="Automações" isActive={pathname === '/automations'} collapsed={isCollapsed} />
                <NavItem href="/reports" icon={PieChart} label="Relatórios" isActive={pathname === '/reports'} collapsed={isCollapsed} />

                <div className="mt-4 border-t border-sidebar-border pt-4">
                    <NavItem href="/integrations" icon={Zap} label="Integrações" isActive={pathname === '/integrations'} collapsed={isCollapsed} />
                    <NavItem href="/products" icon={Package} label="Produtos" isActive={pathname === '/products'} collapsed={isCollapsed} />
                    <NavItem href="/price-lists" icon={FileSpreadsheet} label="Tabelas" isActive={pathname === '/price-lists'} collapsed={isCollapsed} />
                    <NavItem href="/goals-commissions" icon={Target} label="Metas" isActive={pathname === '/goals-commissions'} collapsed={isCollapsed} />
                    <NavItem href="/settings" icon={Settings} label="Configurações" isActive={pathname === '/settings'} collapsed={isCollapsed} />
                    <NavItem href="/design-preview" icon={Palette} label="Design System" isActive={pathname === '/design-preview'} collapsed={isCollapsed} />
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className="space-y-3 border-t border-sidebar-border p-4">
                <Button
                    className={cn("w-full", isCollapsed && "px-0")}
                    onClick={() => { }} // Open AI
                >
                    <Sparkles className="h-5 w-5 mr-0" />
                    {!isCollapsed && <span className="ml-2">Watson AI</span>}
                </Button>

                <div className={cn("flex items-center justify-between transition-all w-full", isCollapsed ? "justify-center" : "")}>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={userProfile.avatar_url || ''} />
                            <AvatarFallback>{userProfile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-sidebar-foreground leading-none truncate">{userProfile.full_name}</p>
                                <p className="text-xs text-sidebar-foreground/70 mt-1 truncate capitalize">{userProfile.role}</p>
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

function NavItem({ href, icon: Icon, label, isActive, collapsed }: { href: string, icon: LucideIcon, label: string, isActive: boolean, collapsed: boolean }) {
    return (
        <Link
            href={href}
            title={collapsed ? label : ''}
            className={cn(
                "focus-ring group flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] px-3 py-1.5 text-sm transition-colors",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed ? "justify-center" : ""
            )}
        >
            <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground")} />
            {!collapsed && <span className="overflow-hidden whitespace-nowrap font-medium">{label}</span>}
        </Link>
    )
}

