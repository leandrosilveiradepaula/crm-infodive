'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isSidebarNavActive } from '@/lib/sidebar-navigation';
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
    BarChart3,
    X,
    type LucideIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
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

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const userProfile = profile || { full_name: 'Carregando...', role: '...', avatar_url: '' };

    return (
        <aside className={cn(
            "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
            "lg:static border-r border-sidebar-border",
            isMobileMenuOpen ? "translate-x-0 w-64 visible" : "-translate-x-full invisible lg:visible lg:translate-x-0",
            isCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
            {/* Header */}
            <div className={cn("p-4 flex items-center border-b border-sidebar-border h-20", isCollapsed ? "lg:justify-center" : "justify-between")}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary p-2 rounded-lg flex-shrink-0">
                        <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className={cn("font-bold text-xl tracking-tight whitespace-nowrap", isCollapsed && "lg:sr-only")}>CRM Infodive</span>
                </div>
                <button
                    type="button"
                    onClick={closeMobileMenu}
                    className="lg:hidden p-2 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
                    aria-label="Fechar menu principal"
                    title="Fechar menu principal"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav id="crm-primary-navigation" aria-label="Navegação principal" className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isSidebarNavActive(pathname, '/dashboard')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/pipeline" icon={Kanban} label="Pipeline" isActive={isSidebarNavActive(pathname, '/pipeline')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/leads" icon={Users} label="Leads" isActive={isSidebarNavActive(pathname, '/leads')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/customers" icon={Building2} label="Empresas" isActive={isSidebarNavActive(pathname, '/customers')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/contacts" icon={Users} label="Contatos" isActive={isSidebarNavActive(pathname, '/contacts')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/activities" icon={Calendar} label="Atividades" isActive={isSidebarNavActive(pathname, '/activities')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/contracts" icon={Scroll} label="Contratos" isActive={isSidebarNavActive(pathname, '/contracts')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/sales" icon={Truck} label="Vendas" isActive={isSidebarNavActive(pathname, '/sales')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/inbox" icon={Inbox} label="Inbox" isActive={isSidebarNavActive(pathname, '/inbox')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/automations" icon={Zap} label="Automações" isActive={isSidebarNavActive(pathname, '/automations')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                <NavItem href="/reports" icon={PieChart} label="Relatórios" isActive={isSidebarNavActive(pathname, '/reports')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />

                <div className="pt-4 mt-4 border-t border-sidebar-border">
                    <NavItem href="/integrations" icon={Zap} label="Integrações" isActive={isSidebarNavActive(pathname, '/integrations')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                    <NavItem href="/products" icon={Package} label="Produtos" isActive={isSidebarNavActive(pathname, '/products')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                    <NavItem href="/price-lists" icon={FileSpreadsheet} label="Tabelas" isActive={isSidebarNavActive(pathname, '/price-lists')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                    <NavItem href="/goals-commissions" icon={Target} label="Metas" isActive={isSidebarNavActive(pathname, '/goals-commissions')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                    <NavItem href="/settings" icon={Settings} label="Configurações" isActive={isSidebarNavActive(pathname, '/settings')} collapsed={isCollapsed} onNavigate={closeMobileMenu} />
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-sidebar-border space-y-4">

                <div className={cn("flex items-center justify-between transition-all w-full", isCollapsed ? "lg:flex-col lg:gap-3 lg:justify-center" : "")}>
                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="shrink-0">
                            <AvatarImage src={userProfile.avatar_url || ''} />
                            <AvatarFallback>{userProfile.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className={cn("overflow-hidden", isCollapsed && "lg:sr-only")}>
                                <p className="text-sm font-bold text-sidebar-foreground leading-none truncate">{userProfile.full_name}</p>
                                <p className="text-xs text-sidebar-foreground/70 mt-1 truncate capitalize">{userProfile.role}</p>
                            </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-sidebar-foreground/70 hover:text-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring"
                        title="Sair do sistema"
                        aria-label="Sair do sistema"
                    >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

function NavItem({ href, icon: Icon, label, isActive, collapsed, onNavigate }: { href: string, icon: LucideIcon, label: string, isActive: boolean, collapsed: boolean, onNavigate: () => void }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : ''}
            aria-label={collapsed ? label : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-200 group",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
                isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed ? "lg:justify-center" : ""
            )}
        >
            <Icon aria-hidden="true" className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground")} />
            <span className={cn("font-medium whitespace-nowrap overflow-hidden", collapsed && "lg:sr-only")}>{label}</span>
        </Link>
    );
}
