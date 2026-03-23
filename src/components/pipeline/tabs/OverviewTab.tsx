
'use client';

import React from 'react';
import {
    TrendingUp, Calendar, Activity as ActivityIcon, Users,
    ArrowRight, MessageSquare, Package, AlertCircle,
    CheckCircle2, Clock, Zap, Target, Bot, Sparkles,
    User, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type Deal } from '@/types/deal';
import { formatCurrency } from '@/utils/format';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OverviewTabProps {
    deal: Deal;
    onViewStakeholders: () => void;
    onViewProducts: () => void;
}

export function OverviewTab({ deal, onViewStakeholders, onViewProducts }: OverviewTabProps) {
    // Helper for health trend icon
    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'improving': return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
            case 'declining': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
            default: return <Minus className="h-4 w-4 text-blue-500" />;
        }
    };

    // Mock Next Best Action based on deal state
    const getNextAction = () => {
        if (!deal.deal_products || deal.deal_products.length === 0) {
            return {
                title: "Oportunidade sem Itens",
                description: "Adicione produtos ou serviços para gerar o forecast de venda.",
                action: "Adicionar Produtos",
                onClick: onViewProducts,
                icon: Package,
                color: "text-amber-500",
                bg: "bg-amber-500/10"
            };
        }
        if (deal.stage === 'qualification' || deal.stage === 'discovery') {
            return {
                title: "Mapeamento de Stakeholders",
                description: "Identifique o tomador de decisão e o influenciador técnico.",
                action: "Gerenciar Clientes",
                onClick: onViewStakeholders,
                icon: Users,
                color: "text-blue-500",
                bg: "bg-blue-500/10"
            };
        }
        return {
            title: "Follow-up Sugerido",
            description: "A última comunicação foi há 3 dias. Verifique se o cliente tem dúvidas.",
            action: "Enviar Mensagem",
            onClick: () => { }, // Would open omnichannel
            icon: MessageSquare,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        };
    };

    const nextAction = getNextAction();

    return (
        <div className="space-y-8">

            {/* 1. Metrics Row */}
            <div className="grid grid-cols-4 gap-4">
                {/* Metric: Value & Forecast */}
                <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Target className="h-4 w-4 text-blue-500" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-black text-blue-500 border-blue-500/20">Forecast</Badge>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Valor Estimado</p>
                        <h4 className="text-xl font-black text-foreground tracking-tight">{formatCurrency(deal.value)}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('pt-BR') : 'Não definido'}
                        </p>
                    </div>
                </div>

                {/* Metric: Health Score */}
                <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Zap className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{deal.health_score || 0}%</span>
                            {getTrendIcon(deal.health_trend)}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Saúde do Negócio</p>
                        <Progress value={deal.health_score || 0} className="h-1.5 bg-muted" />
                        <p className="text-[10px] text-muted-foreground mt-2">Score baseado em atividade e estágio</p>
                    </div>
                </div>

                {/* Metric: Momentum */}
                <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between group hover:border-purple-500/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Momentum</p>
                        <h4 className="text-xl font-black text-foreground tracking-tight">{deal.days_in_stage || 0} Dias</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">no estágio de {deal.stage}</p>
                    </div>
                </div>

                {/* Metric: Stakeholders */}
                <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between group hover:border-amber-500/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Users className="h-4 w-4 text-amber-500" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-black text-amber-500 border-amber-500/20">
                            {deal.custom_fields?.stakeholders?.length || 1} Total
                        </Badge>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Contato Principal</p>
                        <h4 className="text-sm font-bold text-foreground truncate">{deal.contact_name || 'Não definido'}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{deal.contact_email || 'Sem email'}</p>
                    </div>
                </div>
            </div>

            {/* 2. AI Next Best Action spotlight */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/5 to-purple-600/5 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-sm group">
                <div className="absolute top-0 right-0 p-20 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between gap-8">
                    <div className="flex gap-6 items-start max-w-2xl">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
                            <Bot className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">IA : Próxima Melhor Ação</span>
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2">{nextAction.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{nextAction.description}</p>
                        </div>
                    </div>
                    <Button
                        onClick={nextAction.onClick}
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2 shrink-0 transition-all hover:scale-105"
                    >
                        <nextAction.icon className="h-4 w-4" />
                        {nextAction.action}
                    </Button>
                </div>
            </div>

            {/* 3. Bottom Grid: Activity & Quick Details */}
            <div className="grid grid-cols-3 gap-8">

                {/* Left: Activity Timeline */}
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <ActivityIcon className="h-4 w-4 text-blue-500" />
                            Timeline de Atividade
                        </h3>
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase text-muted-foreground hover:text-blue-500">
                            Ver Histórico Completo
                        </Button>
                    </div>

                    <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                        {[
                            { title: 'Proposta enviada para o cliente', user: 'Leandro', date: new Date(), type: 'proposal' },
                            { title: 'Mix de produtos atualizado', user: 'Sistema', date: new Date(Date.now() - 86400000), type: 'products' },
                            { title: 'Negócio criado no pipeline', user: 'Leandro', date: new Date(Date.now() - 172800000), type: 'creation' }
                        ].map((item, i) => (
                            <div key={i} className="relative pl-10 group">
                                <div className={`
                                    absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center transition-all group-hover:scale-110 shadow-sm
                                    ${item.type === 'proposal' ? 'bg-purple-500' : item.type === 'products' ? 'bg-blue-500' : 'bg-emerald-500'}
                                `}>
                                    {item.type === 'proposal' ? <FileText className="h-2.5 w-2.5 text-white" /> : <ActivityIcon className="h-2.5 w-2.5 text-white" />}
                                </div>
                                <div className="bg-card border border-border p-4 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase">
                                            {formatDistanceToNow(item.date, { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-2.5 w-2.5 text-muted-foreground" />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-bold">{item.user}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Quick Details */}
                <div className="space-y-8">
                    {/* Mix de Produtos Summary */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            Mix de Produtos
                        </h3>
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                            {(deal.deal_products || []).length > 0 ? (
                                <>
                                    <div className="space-y-3">
                                        {(deal.deal_products || []).slice(0, 3).map((p, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs">
                                                <span className="text-foreground font-medium truncate max-w-[120px]">{p.name}</span>
                                                <span className="text-muted-foreground font-bold">x{p.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between items-center">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Itens</span>
                                        <span className="text-sm font-black text-primary">{(deal.deal_products || []).length}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum produto adicionado</p>
                            )}
                            <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase rounded-lg tracking-widest h-9" onClick={onViewProducts}>
                                Gerenciar Mix
                            </Button>
                        </div>
                    </div>

                    {/* Stakeholders Summary */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Stakeholders
                        </h3>
                        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <User className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-foreground leading-tight">{deal.contact_name || 'Decisor não definido'}</p>
                                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Tomador de Decisão</p>
                                    </div>
                                </div>
                                {deal.custom_fields?.technical_influencer && (
                                    <div className="flex items-center gap-3 opacity-60">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                            <User className="h-4 w-4 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-foreground leading-tight">{deal.custom_fields.technical_influencer}</p>
                                            <p className="text-[9px] text-purple-500 font-black uppercase tracking-widest mt-0.5">Influenciador Técnico</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase rounded-lg tracking-widest h-9" onClick={onViewStakeholders}>
                                Ver Todos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for repeated Icon + Text pattern in activity
const FileText = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
