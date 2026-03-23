'use client';
import { Users } from 'lucide-react';
import { formatCompact } from '../../utils/analytics';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';

interface TopPerformersWidgetProps {
    data: DashboardMetrics['dealsByOwner'];
}

export const TopPerformersWidget = ({ data }: TopPerformersWidgetProps) => {
    return (
        <div className="glass-card rounded-2xl p-6 border border-white/5 h-full">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 shrink-0">
                <Users className="h-5 w-5 text-primary" />
                Líderes de Desempenho
            </h2>
            <div className="space-y-4">
                {data.slice(0, 5).map((performer, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-muted/20 rounded-2xl border border-border/50 hover:border-primary/20 transition-all group cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20">
                                {performer.owner.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground tracking-tight">{performer.owner}</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{performer.count} deals</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-foreground tracking-tight">
                                {formatCompact(performer.value)}
                            </p>
                            <p className="text-[10px] text-success font-black uppercase tracking-widest mt-0.5">{performer.won} ganhos</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
