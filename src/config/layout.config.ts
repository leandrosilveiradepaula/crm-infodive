import { LayoutDashboard, Users, Building2, Kanban, Calendar, Scroll, Truck, Inbox, Zap, PieChart, Package, FileSpreadsheet, Target, Settings, Palette } from 'lucide-react';
import { ElementType } from 'react';

export interface RouteLayoutConfig {
  title: string;
  description?: string;
  icon?: ElementType;
  padding?: string;
  maxWidth?: string;
  hideHeader?: boolean;
}

export const LAYOUT_CONFIG: Record<string, RouteLayoutConfig> = {
  // Principais
  '/dashboard': {
    title: 'Dashboard',
    description: 'Visão geral do seu negócio e métricas chave.',
    icon: LayoutDashboard,
    padding: 'p-4 lg:p-6',
    maxWidth: 'max-w-7xl',
  },
  '/pipeline': {
    title: 'Funil de Vendas',
    description: 'Gestão de Pipeline estratégico e acompanhamento de metas.',
    icon: Kanban,
    padding: 'p-4 lg:p-6',
    maxWidth: 'max-w-[1600px]', // Pipeline needs width
  },
  '/leads': {
    title: 'Base de Leads',
    description: 'Gestão de prospects e contatos iniciais.',
    icon: Users,
    padding: 'p-4 lg:p-8',
    maxWidth: 'max-w-7xl',
  },
  '/customers': {
    title: 'Empresas',
    description: 'Gestão da sua carteira de clientes corporativos.',
    icon: Building2,
    padding: 'p-4 lg:p-8',
    maxWidth: 'max-w-7xl',
  },
  '/contacts': {
    title: 'Contatos',
    description: 'Catálogo de pessoas e pontos de contato.',
    icon: Users,
    padding: 'p-4 lg:p-8',
    maxWidth: 'max-w-7xl',
  },
  
  // Secundárias
  '/activities': { title: 'Atividades', icon: Calendar, padding: 'p-4 lg:p-6' },
  '/contracts': { title: 'Contratos', icon: Scroll, padding: 'p-4 lg:p-6' },
  '/sales': { title: 'Vendas', icon: Truck, padding: 'p-4 lg:p-6' },
  '/inbox': { title: 'Inbox', icon: Inbox, padding: 'p-4' },
  '/automations': { title: 'Automações', icon: Zap, padding: 'p-4 lg:p-8', maxWidth: 'max-w-5xl' },
  '/reports': { title: 'Relatórios', icon: PieChart, padding: 'p-4 lg:p-8' },
  
  // Settings/Other
  '/integrations': { title: 'Integrações', icon: Zap, padding: 'p-4 lg:p-8', maxWidth: 'max-w-5xl' },
  '/products': { title: 'Produtos', icon: Package, padding: 'p-4 lg:p-6' },
  '/price-lists': { title: 'Tabelas', icon: FileSpreadsheet, padding: 'p-4 lg:p-6' },
  '/goals-commissions': { title: 'Metas e Comissões', icon: Target, padding: 'p-4 lg:p-8' },
  '/settings': { title: 'Configurações', icon: Settings, padding: 'p-4 lg:p-6', maxWidth: 'max-w-4xl' },
  '/design-preview': { title: 'Design System', icon: Palette, padding: 'p-4 lg:p-8' },
};

export const DEFAULT_LAYOUT: RouteLayoutConfig = {
  title: 'Nexus CRM',
  padding: 'p-4 lg:p-6',
  maxWidth: 'max-w-7xl',
};

export function getLayoutConfig(pathname: string): RouteLayoutConfig {
  const segments = pathname.split('/').filter(Boolean);
  const basePath = segments.length > 0 ? `/${segments[0]}` : '/dashboard';
  
  return LAYOUT_CONFIG[basePath] || DEFAULT_LAYOUT;
}
