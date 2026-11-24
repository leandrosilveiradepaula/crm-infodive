
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

interface OverviewTabProps {
    deal: Deal;
    onViewStakeholders: () => void;
    onViewProducts: () => void;
    onViewCommunications: () => void;
}

export function OverviewTab({ deal, onViewStakeholders, onViewProducts, onViewCommunications }: OverviewTabProps) {
    // Helper for health trend icon
    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case 'improving': return <ArrowUpRight className="h-4 w-4 text-success-readable" />;
            case 'declining': return <ArrowDownRight className="h-4 w-4 text-destructive-readable" />;
            default: return <Minus className="h-4 w-4 text-foreground" />;
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
                color: "text-warning-readable",
                bg: "bg-warning-subtle"
            };
        }
        if (deal.stage === 'qualification' || deal.stage === 'discovery') {
            return {
                title: "Mapeamento de Stakeholders",
                description: "Identifique o tomador de decisão e o influenciador técnico.",
                action: "Gerenciar Clientes",
                onClick: onViewStakeholders,
                icon: Users,
                color: "text-foreground",
                bg: "bg-info-subtle"
            };
        }
        return {
            title: "Follow-up Sugerido",
            description: "Consulte o histórico de comunicações antes de planejar o próximo contato.",
            action: "Ver Comunicações",
            onClick: onViewCommunications,
            icon: MessageSquare,
            color: "text-foreground",
            bg: "bg-info-subtle"
        };
    };

    const nextAction = getNextAction();
    const healthScore = typeof deal.health_score === 'number' && Number.isFinite(deal.health_score)
        ? Math.max(0, Math.min(100, deal.health_score)) : null;
    const stakeholderCount = Array.isArray(deal.custom_fields?.stakeholders)
        ? deal.custom_fields.stakeholders.length : null;

    return (
        <div className="space-y-[var(--ds-deal-section-gap)]">

            {/* 1. Metrics Row */}
            <div className="grid grid-cols-1 gap-[var(--ds-deal-section-gap)] sm:grid-cols-2 xl:grid-cols-4">
                {/* Metric: Value & Forecast */}
                <div className="bg-card border border-border p-3 rounded-[var(--radius-panel)] flex flex-col justify-between group hover:border-info/30 transition-all shadow-control-ui min-h-[90px]">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1 bg-info-subtle rounded-[var(--radius-control)]">
                            <Target className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <Badge variant="outline" className="ds-type-metadata uppercase font-semibold text-foreground border-info/20 px-1.5 py-0">Estimativa</Badge>
                    </div>
                    <div>
                        <p className="ds-type-metadata font-bold text-muted-foreground uppercase tracking-[0.1em] mb-0.5">Valor Estimado</p>
                        <h4 className="ds-type-section-title font-semibold text-foreground tracking-tight leading-tight">{formatCurrency(deal.value)}</h4>
                        <p className="ds-type-metadata text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('pt-BR') : 'Não definido'}
                        </p>
                    </div>
                </div>

                {/* Metric: Health Score */}
                <div className="bg-card border border-border p-3 rounded-[var(--radius-panel)] flex flex-col justify-between group hover:border-success/30 transition-all shadow-control-ui min-h-[90px]">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1 bg-success-subtle rounded-[var(--radius-control)]">
                            <Zap className="h-3.5 w-3.5 text-success-readable" />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className={`ds-type-metadata font-semibold ${healthScore === null ? 'text-muted-foreground' : 'text-success-readable'}`}>{healthScore === null ? 'Sem avaliação' : `${healthScore}%`}</span>
                            {getTrendIcon(deal.health_trend)}
                        </div>
                    </div>
                    <div>
                        <p className="ds-type-metadata font-bold text-muted-foreground uppercase tracking-[0.1em] mb-1">Saúde do Negócio</p>
                        {healthScore === null ? (
                            <p className="ds-type-metadata text-muted-foreground">Pontuação não registrada</p>
                        ) : (
                            <Progress value={healthScore} className="h-1 bg-muted" />
                        )}
                    </div>
                </div>

                {/* Metric: Momentum */}
                <div className="bg-card border border-border p-3 rounded-[var(--radius-panel)] flex flex-col justify-between group hover:border-info/30 transition-all shadow-control-ui min-h-[90px]">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1 bg-info-subtle rounded-[var(--radius-control)]">
                            <Clock className="h-3.5 w-3.5 text-foreground" />
                        </div>
                    </div>
                    <div>
                        <p className="ds-type-metadata font-bold text-muted-foreground uppercase tracking-[0.1em] mb-0.5">Momentum</p>
                        <h4 className="ds-type-section-title font-semibold text-foreground tracking-tight leading-tight">{typeof deal.days_in_stage === 'number' ? `${deal.days_in_stage} dias` : 'Não disponível'}</h4>
                        <p className="ds-type-metadata text-muted-foreground mt-0.5 truncate">no estágio de {deal.stage}</p>
                    </div>
                </div>

                {/* Metric: Stakeholders */}
                <div className="bg-card border border-border p-3 rounded-[var(--radius-panel)] flex flex-col justify-between group hover:border-warning/30 transition-all shadow-control-ui min-h-[90px]">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-1 bg-warning-subtle rounded-[var(--radius-control)]">
                            <Users className="h-3.5 w-3.5 text-warning-readable" />
                        </div>
                        <span className="ds-type-metadata rounded-[var(--radius-control)] border border-warning/20 bg-warning-subtle px-2 py-0.5 font-semibold text-warning-readable">
                            {stakeholderCount === null ? 'Sem contagem' : `${stakeholderCount} total`}
                        </span>
                    </div>
                    <div>
                        <p className="ds-type-metadata font-bold text-muted-foreground uppercase tracking-[0.1em] mb-0.5">Contato Principal</p>
                        <h4 className="ds-type-body font-bold text-foreground truncate leading-tight">{deal.contact_name || 'Não definido'}</h4>
                        <p className="ds-type-metadata text-muted-foreground mt-0.5 truncate">{deal.contact_email || 'Sem email'}</p>
                    </div>
                </div>
            </div>

            {/* 2. AI Next Best Action spotlight */}
            <div className="ds-panel-highlight border p-[var(--ds-deal-content-padding)]">
                <div className="flex flex-wrap items-center justify-between gap-[var(--ds-deal-section-gap)]">
                    <div className="flex gap-4 items-center max-w-2xl">
                        <div className="h-10 w-10 rounded-[var(--radius-control)] bg-primary flex items-center justify-center shadow-control-ui shrink-0">
                            <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Sparkles className="h-3 w-3 text-foreground" />
                                <span className="ds-type-metadata font-semibold text-foreground uppercase tracking-widest">Próxima Ação Sugerida</span>
                            </div>
                            <h3 className="ds-type-body font-semibold text-foreground mb-0.5">{nextAction.title}</h3>
                            <p className="ds-type-label text-muted-foreground leading-relaxed">{nextAction.description}</p>
                        </div>
                    </div>
                    <Button
                        onClick={nextAction.onClick}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-5 ds-type-body rounded-[var(--radius-control)] shadow-card-ui shadow-primary/20 gap-2 shrink-0 transition-all hover:scale-105"
                    >
                        <nextAction.icon className="h-3.5 w-3.5" />
                        {nextAction.action}
                    </Button>
                </div>
            </div>

            {/* 3. Bottom Grid: Activity & Quick Details */}
            <div className="grid grid-cols-1 gap-[var(--ds-deal-section-gap)]">

                {/* Right: Quick Details */}
                <div className="grid grid-cols-1 gap-[var(--ds-deal-section-gap)] sm:grid-cols-2">
                    {/* Mix de Produtos Summary */}
                    <div className="space-y-4">
                        <h3 className="ds-type-body font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Package className="h-4 w-4 text-foreground" />
                            Mix de Produtos
                        </h3>
                        <div className="bg-card border border-border rounded-[var(--radius-panel)] p-5 space-y-4 shadow-control-ui">
                            {(deal.deal_products || []).length > 0 ? (
                                <>
                                    <div className="space-y-3">
                                        {(deal.deal_products || []).slice(0, 3).map((p, i) => (
                                            <div key={i} className="flex justify-between items-center ds-type-label">
                                                <span className="text-foreground font-medium truncate max-w-[120px]">{p.name}</span>
                                                <span className="text-muted-foreground font-bold">x{p.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between items-center">
                                        <span className="ds-type-metadata font-semibold text-muted-foreground uppercase tracking-widest">Total Itens</span>
                                        <span className="ds-type-body font-semibold text-primary">{(deal.deal_products || []).length}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="ds-type-label text-muted-foreground italic text-center py-4">Nenhum produto adicionado</p>
                            )}
                            <Button variant="outline" size="sm" className="w-full ds-type-metadata font-semibold uppercase rounded-[var(--radius-control)] tracking-widest h-9" onClick={onViewProducts}>
                                Gerenciar Mix
                            </Button>
                        </div>
                    </div>

                    {/* Stakeholders Summary */}
                    <div className="space-y-4">
                        <h3 className="ds-type-body font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-4 w-4 text-foreground" />
                            Stakeholders
                        </h3>
                        <div className="bg-card border border-border rounded-[var(--radius-panel)] p-5 space-y-5 shadow-control-ui">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-[var(--radius-control)] bg-info-subtle flex items-center justify-center border border-info/20">
                                        <User className="h-4 w-4 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="ds-type-label font-bold text-foreground leading-tight">{deal.contact_name || 'Decisor não definido'}</p>
                                        <p className="ds-type-metadata text-foreground font-semibold uppercase tracking-widest mt-0.5">Tomador de Decisão</p>
                                    </div>
                                </div>
                                {deal.custom_fields?.technical_influencer && (
                                    <div className="flex items-center gap-3 ">
                                        <div className="h-8 w-8 rounded-[var(--radius-control)] bg-info-subtle flex items-center justify-center border border-info/20">
                                            <User className="h-4 w-4 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="ds-type-label font-bold text-foreground leading-tight">{deal.custom_fields.technical_influencer}</p>
                                            <p className="ds-type-metadata text-foreground font-semibold uppercase tracking-widest mt-0.5">Influenciador Técnico</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" size="sm" className="w-full ds-type-metadata font-semibold uppercase rounded-[var(--radius-control)] tracking-widest h-9" onClick={onViewStakeholders}>
                                Ver Todos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
