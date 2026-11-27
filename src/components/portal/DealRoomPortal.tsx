
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { dealRoomDefaultThemeColor } from '@/design-system/domain-visual-defaults';
import {
    Package,
    Calendar,
    User,
    TrendingUp,
    ShieldCheck,
    ExternalLink,
    Mail,
    Phone,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PortalData {
    room: {
        id: string;
        theme_color: string;
        company_logo_url?: string;
    };
    deal: {
        title: string;
        value: number;
        company: string;
        expected_close_date: string;
        owner: {
            name: string;
            email: string;
            phone?: string;
            avatar?: string;
        };
        products: any[];
    };
}

export function DealRoomPortal({ data }: { data: PortalData }) {
    const { deal, room } = data;
    const products = Array.isArray(deal.products) ? deal.products : [];
    const owner = deal.owner || { name: 'Responsável não informado', email: '', phone: '', avatar: '' };
    const themeColor = room.theme_color || dealRoomDefaultThemeColor;
    // The legacy RPC returns initials in avatar; only use an image for an actual image URL.
    const avatarUrl = owner.avatar && (/^https?:\/\//i.test(owner.avatar) || /^\/(?!\/)/.test(owner.avatar)) ? owner.avatar : undefined;
    const initials = owner.name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');

    return (
        <div data-slot="customer-portal" className="min-h-screen bg-background text-foreground font-ui selection:bg-primary/20">
            {/* Header / Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
                <div className="container mx-auto px-3 sm:px-6 min-h-[var(--ds-header-height)] py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-[var(--radius-panel)] flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-section-title font-black tracking-tight uppercase">Portal <span className="text-primary">Infodive</span></h1>
                            <p className="text-metadata-ui text-muted-foreground font-bold uppercase tracking-widest leading-tight">Espaço do Cliente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Responsável</span>
                            <span className="text-body-ui font-black text-foreground">{owner.name}</span>
                        </div>
                        <div className="h-11 w-11 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-black shadow-card-ui shadow-primary/10">
                            {initials || "—"}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="min-w-0 lg:col-span-2 space-y-8">

                        {/* Hero Section / Summary Card */}
                        <section className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-surface-subtle rounded-[var(--radius-panel)] -z-10 transition-all duration-500 group-hover:scale-105" />
                            <div className="bg-card border border-border p-4 sm:p-6 xl:p-10 rounded-[var(--radius-panel)] shadow-control-ui">
                                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success-readable dark:text-success-readable rounded-full border border-success/20 text-metadata-ui font-black uppercase tracking-widest">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Portal ativo
                                        </div>
                                        <h2 className="text-metric-ui font-black tracking-tight text-foreground leading-[1.1]">
                                            {deal.title}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground font-medium">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                <span>{deal.company}</span>
                                            </div>
                                            <div className="w-1 h-1 bg-border rounded-full" />
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{deal.expected_close_date ? format(new Date(deal.expected_close_date), "dd 'de' MMMM", { locale: ptBR }) : 'A definir'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-primary text-primary-foreground p-4 sm:p-6 rounded-[var(--radius-panel)] shadow-card-ui flex flex-col items-start xl:items-end min-w-0">
                                        <span className="text-metadata-ui font-black uppercase tracking-[0.2em] mb-2">Investimento Estimado</span>
                                        <span className="text-metric-ui font-black tabular-nums tracking-tighter">
                                            {formatCurrency(deal.value)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Products Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-section-title font-black tracking-tight flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    Soluções Propostas
                                </h3>
                                <span className="text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                                    {products.length} Itens
                                </span>
                            </div>

                            <div className="bg-card border border-border/60 rounded-[var(--radius-panel)] overflow-hidden shadow-control-ui">
                                <div role="region" aria-label="Itens da oportunidade" tabIndex={0} className="overflow-x-auto focus-ring">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/30">
                                                <th className="px-8 py-5 text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.15em]">Produto / Serviço</th>
                                                <th className="px-6 py-5 text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.15em] text-center w-24">Qtd</th>
                                                <th className="px-8 py-5 text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.15em] text-right w-40">Investimento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {products.map((product, idx) => (
                                                <tr key={idx} className="group hover:bg-muted/20 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-foreground text-body-ui group-hover:text-primary transition-colors">{product.name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-metadata-ui font-mono tracking-tighter text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded italic">
                                                                    {product.category || 'Solução'}
                                                                </span>
                                                                {product.sku && product.show_sku_on_proposal !== false && (
                                                                    <span className="text-metadata-ui font-medium text-muted-foreground">{product.sku}</span>
                                                                )}
                                                                {product.duration && product.duration_unit && (
                                                                    <span className="text-metadata-ui font-bold text-success-readable bg-success/10 px-1.5 py-0.5 rounded italic border border-success/20 uppercase">
                                                                        {product.duration} {product.duration_unit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-center">
                                                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-[var(--radius-control)] bg-muted text-foreground text-metadata-ui font-black">
                                                            {product.quantity || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-body-ui font-black text-foreground tabular-nums tracking-tight">
                                                            {formatCurrency((product.unit_price || 0) * (product.quantity || 1))}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {products.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-16 text-center text-muted-foreground font-medium">
                                                        Os detalhes dos itens serão adicionados em breve.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Info Column */}
                    <div className="space-y-8">

                        {/* Status Card */}
                        <div className="bg-card border border-border/60 p-8 rounded-[var(--radius-panel)] space-y-6 shadow-control-ui">
                            <h4 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-4">Acompanhamento</h4>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <p className="text-body-ui font-medium leading-relaxed">
                                        Consulte o responsável para confirmar o escopo e os próximos passos.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                    <p className="text-body-ui font-medium leading-relaxed">
                                        Previsão de fechamento: {deal.expected_close_date ? format(new Date(deal.expected_close_date), "dd 'de' MMMM", { locale: ptBR }) : 'A definir'}.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-primary/5 border border-primary/10 p-8 rounded-[var(--radius-panel)] space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp className="w-20 h-20 -mr-6 -mt-6" />
                            </div>

                            <h4 className="text-metadata-ui font-black uppercase tracking-widest text-primary">Seu Consultor</h4>

                            <div className="flex items-center gap-4 py-2">
                                <Avatar className="h-16 w-16 rounded-[var(--radius-panel)] border border-border bg-card shadow-card-ui">
                                    {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                                    <AvatarFallback className="rounded-[var(--radius-panel)] text-foreground">{initials || "—"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-section-title font-black tracking-tight">{owner.name}</div>
                                    {deal.owner && <div className="text-metadata-ui font-bold text-muted-foreground">Responsável pela oportunidade</div>}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-primary/10">
                                {owner.email && <a href={`mailto:${owner.email}`} className="flex items-center gap-3 p-3 bg-card rounded-[var(--radius-panel)] border border-border hover:border-primary/30 hover:bg-surface-raised transition-all group">
                                    <div className="h-9 w-9 bg-primary/10 rounded-[var(--radius-panel)] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-metadata-ui font-bold truncate max-w-[180px]">{owner.email}</span>
                                </a>}
                                {owner.phone && /\d/.test(owner.phone) && (
                                    <a href={`tel:${owner.phone.replace(/\D/g, '')}`} className="flex items-center gap-3 p-3 bg-card rounded-[var(--radius-panel)] border border-border hover:border-primary/30 hover:bg-surface-raised transition-all group">
                                        <div className="h-9 w-9 bg-success/10 rounded-[var(--radius-panel)] flex items-center justify-center text-success-readable group-hover:scale-110 transition-transform">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-metadata-ui font-bold">{owner.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-border/40 py-12 bg-muted/20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="/assets/logo-infodive.png" alt="Infodive" className="h-8" />
                    </div>

                    {owner.email && <a href={`mailto:${owner.email}`} className="text-body-ui text-muted-foreground hover:text-primary focus-ring">Contatar responsável</a>}

                    <div className="text-metadata-ui text-muted-foreground font-medium">
                        © {new Date().getFullYear()} Infodive IT Solutions. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}

