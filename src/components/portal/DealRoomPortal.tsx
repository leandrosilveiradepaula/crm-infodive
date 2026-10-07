
import React from 'react';
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
    const themeColor = room.theme_color || '#0f62fe';

    return (
        <div className="min-h-screen bg-[oklch(0.985_0.002_247.839)] dark:bg-[oklch(0.145_0_0)] text-foreground font-sans selection:bg-primary/20">
            {/* Header / Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase">Portal <span className="text-primary">Infodive</span></h1>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-tight">Espaço do Cliente</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-4">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Responsável</span>
                            <span className="text-sm font-black text-foreground">{deal.owner.name}</span>
                        </div>
                        <div className="h-11 w-11 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-black shadow-lg shadow-primary/10">
                            {deal.owner.avatar || deal.owner.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero Section / Summary Card */}
                        <section className="relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-[32px] -z-10 transition-all duration-500 group-hover:scale-105" />
                            <div className="bg-card/40 backdrop-blur-md border border-border/50 p-10 rounded-[32px] shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20 text-xs font-black uppercase tracking-widest">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Oportunidade Ativa
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">
                                            {deal.title}
                                        </h2>
                                        <div className="flex items-center gap-4 text-muted-foreground font-medium">
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

                                    <div className="bg-primary text-primary-foreground p-8 rounded-3xl shadow-2xl shadow-primary/20 flex flex-col items-end min-w-[240px]">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Investimento Estimado</span>
                                        <span className="text-4xl font-black tabular-nums tracking-tighter">
                                            {formatCurrency(deal.value)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Products Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    Soluções Propostas
                                </h3>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                                    {deal.products.length} Itens
                                </span>
                            </div>

                            <div className="bg-card border border-border/60 rounded-[32px] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/30">
                                                <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Produto / Serviço</th>
                                                <th className="px-6 py-5 text-xs font-black text-muted-foreground uppercase tracking-[0.15em] text-center w-24">Qtd</th>
                                                <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-[0.15em] text-right w-40">Investimento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {deal.products.map((product, idx) => (
                                                <tr key={idx} className="group hover:bg-muted/20 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{product.name}</div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-mono tracking-tighter text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded italic">
                                                                    {product.category || 'Solução'}
                                                                </span>
                                                                {product.sku && product.show_sku_on_proposal !== false && (
                                                                    <span className="text-xs font-medium text-muted-foreground/60">{product.sku}</span>
                                                                )}
                                                                {product.duration && product.duration_unit && (
                                                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded italic border border-emerald-500/20 uppercase">
                                                                        {product.duration} {product.duration_unit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-center">
                                                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-muted text-foreground text-xs font-black">
                                                            {product.quantity || 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-foreground tabular-nums tracking-tight">
                                                            {formatCurrency((product.unit_price || 0) * (product.quantity || 1))}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {deal.products.length === 0 && (
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
                        <div className="bg-card border border-border/60 p-8 rounded-[32px] space-y-6 shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-4">Próximos Passos</h4>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        Aguardando revisão técnica dos requisitos para validação final do escopo.
                                    </p>
                                </div>
                                <div className="flex gap-4 opacity-50">
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed">
                                        Emissão da proposta formal para assinatura digital.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-primary/5 border border-primary/10 p-8 rounded-[32px] space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp className="w-20 h-20 -mr-6 -mt-6" />
                            </div>

                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Seu Consultor</h4>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-16 w-16 rounded-2xl bg-white border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10 overflow-hidden">
                                    {deal.owner.avatar ? (
                                        <img src={deal.owner.avatar} alt={deal.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-lg font-black tracking-tight">{deal.owner.name}</div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Solutions Architect</div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-primary/10">
                                <a href={`mailto:${deal.owner.email}`} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-black/20 rounded-2xl border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-black transition-all group">
                                    <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold truncate max-w-[180px]">{deal.owner.email}</span>
                                </a>
                                {deal.owner.phone && (
                                    <a href={`tel:${deal.owner.phone.replace(/\D/g, '')}`} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-black/20 rounded-2xl border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-black transition-all group">
                                        <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold">{deal.owner.phone}</span>
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

                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
                        <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-primary transition-colors">Suporte</a>
                    </div>

                    <div className="text-xs text-muted-foreground font-medium">
                        © {new Date().getFullYear()} Infodive IT Solutions. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}

