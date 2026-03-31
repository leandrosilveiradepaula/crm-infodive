'use client';
import { Users } from 'lucide-react';
import { formatCompact } from '../../utils/analytics';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';

interface TopPerformersWidgetProps {
    data: DashboardMetrics['dealsByOwner'];
}

export const TopPerformersWidget = ({ data }: TopPerformersWidgetProps) => {
    return (
        <div className="glass-card rounded-2xl p-4 border border-white/5 h-full">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2 shrink-0">
                <Users className="h-4 w-4 text-primary" />
                Líderes de Desempenho
            </h2>
            <div className="space-y-2">
                {data.slice(0, 5).map((performer, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-xl border border-border/50 hover:border-primary/20 transition-all group cursor-pointer active:scale-[0.98]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-[10px] font-black shadow-lg shadow-primary/20">
                                {performer.owner.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-[13px] font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{performer.owner}</p>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60 leading-none">{performer.count} deals</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[13px] font-black text-foreground tracking-tighter leading-none mb-1">
                                {formatCompact(performer.value)}
                            </p>
                            <p className="text-[9px] text-success font-black uppercase tracking-widest opacity-80 leading-none">{performer.won} ganhos</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
