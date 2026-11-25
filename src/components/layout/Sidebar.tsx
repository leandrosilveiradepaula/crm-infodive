'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Bell, Building2, Calendar, CircleDollarSign, FileSpreadsheet, Target, Inbox, Kanban, LayoutDashboard, LogOut, Package, PieChart, Plug, ScrollText, Settings, Users, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isCollapsed: boolean;
}

type NavEntry = { href: string; label: string; icon: LucideIcon; match?: (pathname: string) => boolean };
type NavArea = { label: string; href: string; icon: LucideIcon; items: NavEntry[] };

const navigationAreas: NavArea[] = [
    { label: 'Visão geral', href: '/dashboard', icon: LayoutDashboard, items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { label: 'Comercial', href: '/pipeline', icon: Kanban, items: [
        { href: '/pipeline', label: 'Pipeline', icon: Kanban, match: (path) => path.startsWith('/pipeline') },
        { href: '/leads', label: 'Leads', icon: Users },
        { href: '/customers', label: 'Empresas', icon: Building2 },
        { href: '/contacts', label: 'Contatos', icon: Users },
    ] },
    { label: 'Relacionamento', href: '/activities', icon: Calendar, items: [
        { href: '/activities', label: 'Atividades', icon: Calendar },
        { href: '/contracts', label: 'Contratos', icon: ScrollText },
    ] },
    { label: 'Receita', href: '/sales', icon: CircleDollarSign, items: [
        { href: '/sales', label: 'Vendas', icon: CircleDollarSign },
        { href: '/sales-orders', label: 'Pedidos', icon: FileSpreadsheet },
        { href: '/products', label: 'Produtos', icon: Package },
        { href: '/price-lists', label: 'Tabelas de preço', icon: FileSpreadsheet },
        { href: '/proposals', label: 'Propostas', icon: FileSpreadsheet },
    ] },
    { label: 'Operação', href: '/inbox', icon: Inbox, items: [
        { href: '/inbox', label: 'Inbox', icon: Inbox },
        { href: '/automations', label: 'Automações', icon: Zap },
        { href: '/service-desk', label: 'Service Desk', icon: Bell, match: (path) => path.startsWith('/service-desk') },
    ] },
    { label: 'Análises', href: '/reports', icon: PieChart, items: [
        { href: '/reports', label: 'Relatórios', icon: PieChart },
        { href: '/goals', label: 'Metas', icon: Target, match: (path) => path === '/goals' || path.startsWith('/goals-commissions') },
    ] },
    { label: 'Administração', href: '/settings', icon: Settings, items: [
        { href: '/settings', label: 'Configurações', icon: Settings },
        { href: '/integrations', label: 'Integrações', icon: Plug },
    ] },
];

function isEntryActive(entry: NavEntry, pathname: string) {
    return entry.match ? entry.match(pathname) : pathname === entry.href;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const { profile, signOut } = useAuth();
    const activeArea = navigationAreas.find((area) => area.items.some((item) => isEntryActive(item, pathname))) ?? navigationAreas[0];
    const userProfile = profile || { full_name: 'Carregando...', role: '...', avatar_url: '' };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('Logout falhou:', err);
            window.location.href = '/login';
        }
    };

    return (
        <aside id="crm-sidebar" role={isMobileMenuOpen ? "dialog" : undefined}
            aria-modal={isMobileMenuOpen ? true : undefined}
            aria-label={isMobileMenuOpen ? "Menu de navegação" : undefined}
            className={cn(
            'fixed inset-y-0 left-0 z-50 flex h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:static lg:translate-x-0',
            isMobileMenuOpen ? 'visible w-[var(--ds-nav-expanded-width)] max-w-full translate-x-0' : 'invisible -translate-x-full lg:visible lg:translate-x-0',
            isCollapsed ? 'lg:w-[var(--ds-nav-rail-width)]' : 'lg:w-[var(--ds-nav-expanded-width)]',
        )}>
            <div className="flex w-[var(--ds-nav-rail-width)] shrink-0 flex-col items-center border-r border-sidebar-border py-3">
                <Link href="/dashboard" aria-label="Infodive CRM — Início" className="focus-ring mb-5 flex size-[var(--ds-nav-target-size)] items-center justify-center rounded-[var(--radius-control)] bg-primary text-primary-foreground shadow-control-ui">
                    <BarChart3 className="size-[var(--ds-nav-icon-size)]" aria-hidden="true" />
                </Link>
                <nav aria-label="Áreas principais" className="flex w-full flex-1 flex-col items-center gap-1 px-2">
                    {navigationAreas.map((area) => {
                        const Icon = area.icon;
                        const isActive = area === activeArea;
                        return <Link key={area.label} href={area.href} aria-label={area.label} aria-current={isActive ? 'page' : undefined} title={area.label} onClick={() => setIsMobileMenuOpen(false)} className={cn('focus-ring flex size-[var(--ds-nav-target-size)] items-center justify-center rounded-[var(--radius-control)] transition-colors', isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-control-ui' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground')}><Icon className="size-[var(--ds-nav-icon-size)]" aria-hidden="true" /></Link>;
                    })}
                </nav>
                <div className="mt-3 flex flex-col items-center gap-2">
                    <Avatar className="size-8"><AvatarImage src={userProfile.avatar_url || ''} /><AvatarFallback>{userProfile.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
                </div>
            </div>

            <div className={cn('flex min-w-0 flex-1 flex-col overflow-hidden', isCollapsed && 'lg:hidden')}>
                <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
                    <div className="min-w-0"><p className="ds-type-label font-medium text-muted-foreground">Infodive CRM</p><h2 className="truncate ds-type-body font-semibold tracking-tight">{activeArea.label}</h2></div>
                    <button type="button" data-slot="crm-mobile-menu-close" aria-label="Fechar menu" onClick={() => setIsMobileMenuOpen(false)} className="focus-ring rounded-[var(--radius-control)] p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"><X className="size-5" /></button>
                </div>
                <nav aria-label={`Navegação de ${activeArea.label}`} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                    {activeArea.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isEntryActive(item, pathname);
                        return <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined} onClick={() => setIsMobileMenuOpen(false)} className={cn('focus-ring flex min-h-[var(--ds-nav-target-size)] items-center gap-3 rounded-[var(--radius-control)] px-3 ds-type-body transition-colors', isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-control-ui' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground')}><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="font-medium">{item.label}</span></Link>;
                    })}
                </nav>
                <div className="border-t border-sidebar-border p-3"><div className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2"><Avatar className="size-8"><AvatarImage src={userProfile.avatar_url || ''} /><AvatarFallback>{userProfile.full_name?.charAt(0) || 'U'}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate ds-type-body font-medium">{userProfile.full_name}</p><p className="truncate ds-type-label text-muted-foreground capitalize">{userProfile.role}</p></div><button type="button" onClick={handleLogout} className="focus-ring rounded-[var(--radius-control)] p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive" title="Sair do sistema" aria-label="Sair do sistema"><LogOut className="size-4" /></button></div></div>
            </div>
        </aside>
    );
}
