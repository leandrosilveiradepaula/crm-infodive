'use client';
import { ResponsiveContainer, FunnelChart, Funnel, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/analytics';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';
import { useTheme } from '../providers/ThemeProvider';

interface FunnelWidgetProps {
    data: DashboardMetrics['dealsByStage'];
}

export const FunnelWidget = ({ data }: FunnelWidgetProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="bg-card rounded-[var(--radius-panel)] p-4 border border-border flex flex-col h-full">
            <h2 className="text-body-ui font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <Activity className="h-4 w-4 text-primary" />
                Funil de Vendas
            </h2>
            <div className="flex-1" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                    <FunnelChart>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass-card p-4 shadow-card-ui rounded-[var(--radius-panel)] animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground mb-2">{payload[0].name}</p>
                                            <div className="flex justify-between gap-8 items-center">
                                                <span className="text-metadata-ui font-bold text-muted-foreground uppercase">Valor Total:</span>
                                                <span className="text-body-ui font-black text-foreground">{formatCurrency(payload[0].value as number)}</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Funnel
                            dataKey="value"
                            data={data
                                .sort((a, b) => {
                                    const order = ['qualification', 'proposal', 'negotiation'];
                                    return order.indexOf(a.stage) - order.indexOf(b.stage);
                                })
                                .map(s => ({
                                    ...s,
                                    name: s.stage === 'qualification' ? 'Qualificação' :
                                        s.stage === 'proposal' ? 'Proposta' :
                                            s.stage === 'negotiation' ? 'Negociação' : s.stage,
                                    fill: s.stage === 'qualification' ? 'var(--stage-qualification)' :
                                        s.stage === 'proposal' ? 'var(--stage-proposal)' :
                                            s.stage === 'negotiation' ? 'var(--stage-negotiation)' :
                                                'var(--stage-won)'
                                }))
                            }
                            isAnimationActive
                        />
                    </FunnelChart>
                </ResponsiveContainer>
            </div>
            {/* Labels are HTML outside the chart so text never overlays SVG paint. */}
            <div role="list" aria-label="Etapas do funil" className="mt-3 flex flex-wrap gap-2">
                {data.map((stage, index) => (
                    <span key={stage.stage + '-' + index} role="listitem" className="rounded-[var(--radius-control)] bg-surface-subtle px-2 py-1 text-metadata-ui font-semibold text-foreground">
                        {stage.stage === 'qualification' ? 'Qualificação' :
                         stage.stage === 'proposal' ? 'Proposta' :
                         stage.stage === 'negotiation' ? 'Negociação' : stage.stage}
                    </span>
                ))}
            </div>
        </div>
    );
};
