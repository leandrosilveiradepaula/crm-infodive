'use client';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from 'recharts';
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
        <div className="bg-card rounded-2xl p-6 border border-border flex flex-col h-full">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 shrink-0">
                <Activity className="h-5 w-5 text-primary" />
                Funil de Vendas
            </h2>
            <div className="flex-1" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                    <FunnelChart>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass-card p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{payload[0].name}</p>
                                            <div className="flex justify-between gap-8 items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor Total:</span>
                                                <span className="text-sm font-black text-foreground">{formatCurrency(payload[0].value as number)}</span>
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
                        >
                            <LabelList position="right" fill="var(--muted-foreground)" stroke="none" dataKey="name" style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
