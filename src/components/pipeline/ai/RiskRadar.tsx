'use client';

import React from 'react';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Deal } from '@/types/deal';

interface RiskRadarProps { deal: Deal }

export const RiskRadar: React.FC<RiskRadarProps> = ({ deal }) => {
    const score = typeof deal.health_score === 'number' && Number.isFinite(deal.health_score)
        ? Math.max(0, Math.min(100, deal.health_score))
        : null;
    const trend = deal.health_trend ?? null;
    const factors = Array.isArray(deal.risk_factors) ? deal.risk_factors : [];

    if (score === null) {
        return (
            <section data-qa-region="deal-risk-unassessed" className="rounded-[var(--radius-panel)] border border-border bg-card p-5 shadow-card-ui">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <h3 className="ds-type-body font-semibold text-foreground">Risk Radar</h3>
                </div>
                <p className="ds-type-label mt-2 text-muted-foreground">
                    Sem avaliação de risco registrada para esta oportunidade.
                </p>
                {factors.length > 0 && (
                    <p className="ds-type-label mt-2 text-muted-foreground">
                        Há fatores cadastrados, mas ainda não existe uma pontuação validada.
                    </p>
                )}
            </section>
        );
    }

    const scoreColor = score >= 80 ? 'text-success-readable'
        : score >= 50 ? 'text-warning-readable'
        : 'text-destructive-readable';

    return (
        <section data-qa-region="deal-risk-evaluated" className="rounded-[var(--radius-panel)] border border-border bg-card p-5 shadow-card-ui">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
                    <div>
                        <h3 className="ds-type-body font-semibold text-foreground">Risk Radar</h3>
                        <p className="ds-type-metadata text-muted-foreground">Pontuação registrada</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 ds-type-metadata text-muted-foreground">
                    {trend === 'improving' ? <TrendingUp className="h-4 w-4" aria-hidden="true" /> :
                        trend === 'declining' ? <TrendingDown className="h-4 w-4" aria-hidden="true" /> :
                            <Minus className="h-4 w-4" aria-hidden="true" />}
                    <span>{trend === 'improving' ? 'Melhorando' :
                        trend === 'declining' ? 'Em queda' :
                            trend === 'stable' ? 'Estável' : 'Sem tendência registrada'}</span>
                </div>
            </div>

            <div className="flex items-start gap-4">
                <div className="min-w-20 rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3 text-center">
                    <div className={`ds-type-metric font-semibold ${scoreColor}`}>{score}</div>
                    <div className="ds-type-metadata text-muted-foreground">Score</div>
                </div>
                <div className="min-w-0 flex-1">
                    {factors.length ? (
                        <div>
                            <p className="ds-type-metadata mb-2 flex items-center gap-1 font-semibold text-foreground">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Fatores registrados
                            </p>
                            <ul className="space-y-2">
                                {factors.slice(0, 3).map((factor, i) => (
                                    <li key={i} className="ds-type-label text-muted-foreground">{factor}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="ds-type-label text-muted-foreground">
                            Nenhum fator de risco foi registrado nesta oportunidade.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
};
