'use client';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';

interface HealthWidgetProps {
    metrics: DashboardMetrics;
}

export const HealthWidget = ({ metrics }: HealthWidgetProps) => {
    const router = useRouter();

    return (
        <div className="glass-card rounded-2xl p-4 border border-border h-full flex flex-col">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <ShieldCheck className="h-4 w-4 text-success" />
                Pipeline Health
            </h2>

            <div className="space-y-6 flex-1">
                {/* Health Gauge */}
                <div className="relative pt-1">
                    <div className="flex items-end gap-3 mb-2">
                        <span className={`text-4xl font-black tracking-tighter ${metrics.healthScore > 7 ? 'text-success' : metrics.healthScore > 4 ? 'text-warning' : 'text-destructive'}`}>
                            {metrics.healthScore}
                        </span>
                        <div className="mb-1.5 text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Score / 10</div>
                    </div>
                    <div className="w-full bg-surface-subtle h-3 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 shadow-lg ${metrics.healthScore > 7 ? 'bg-success' : metrics.healthScore > 4 ? 'bg-warning' : 'bg-destructive'}`}
                            style={{ width: `${metrics.healthScore * 10}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-muted-foreground">Taxa de Conversão</span>
                        <span className="text-foreground">{metrics.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-surface-subtle h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(metrics.winRate, 100)}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium pt-2">
                        <span className="text-muted-foreground">Deals Estagnados</span>
                        <span className={metrics.stagnantDeals > 5 ? 'text-destructive' : 'text-foreground'}>{metrics.stagnantDeals}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 shrink-0">
                <button
                    onClick={() => router.push('/reports')}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Ver Relatório Detalhado
                </button>
            </div>
        </div>
    );
};
