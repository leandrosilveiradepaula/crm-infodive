'use client';
import { useRouter } from 'next/navigation';
import { DollarSign, Target, TrendingUp, Activity } from 'lucide-react';
import { formatCompact } from '../../utils/analytics';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    colorClass: string;
    trend?: 'up' | 'down';
    change?: string;
    onClick?: () => void;
}

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend, change, onClick }: StatCardProps) => (
    <div
        onClick={onClick}
        className="glass-card p-4 rounded-2xl relative overflow-hidden group interactive-item cursor-pointer border border-white/20 h-full"
    >
        <div className="absolute -right-3 -top-3 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
            <Icon className="h-24 w-24" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-inner group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4.5 w-4.5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                {change && (
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} uppercase tracking-widest`}>
                        {change}
                    </span>
                )}
            </div>

            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60 leading-none">{title}</p>
            <h3 className="text-2xl font-black text-foreground mt-1 group-hover:text-primary transition-colors">{value}</h3>

            {subtitle && (
                <p className="text-xs text-muted-foreground mt-1.5 font-bold flex items-center gap-1.5 uppercase tracking-tight opacity-70">
                    <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                    {subtitle}
                </p>
            )}
        </div>
    </div>
);

interface StatsWidgetProps {
    metrics: DashboardMetrics;
}

export const StatsWidget = ({ metrics }: StatsWidgetProps) => {
    const router = useRouter();

    const stats = [
        {
            title: "Pipeline Total",
            value: formatCompact(metrics.totalPipeline),
            subtitle: `${metrics.totalDeals - metrics.wonDeals - metrics.lostDeals} deals ativos`,
            icon: DollarSign,
            colorClass: "bg-primary",
            onClick: () => router.push('/pipeline')
        },
        {
            title: "Previsão Ponderada",
            value: formatCompact(metrics.weightedForecast),
            subtitle: "Baseada em probabilidade",
            icon: Target,
            colorClass: "bg-info",
            onClick: () => router.push('/pipeline')
        },
        {
            title: "Ganho no Mês",
            value: formatCompact(metrics.wonThisMonth),
            change: "+12.5%",
            trend: "up" as const,
            icon: TrendingUp,
            colorClass: "bg-success",
            onClick: () => router.push('/pipeline')
        },
        {
            title: "Win Rate",
            value: `${metrics.winRate.toFixed(1)}%`,
            subtitle: `${metrics.wonDeals} ganhos / ${metrics.wonDeals + metrics.lostDeals} fechados`,
            icon: Activity,
            colorClass: "bg-primary",
            onClick: () => router.push('/reports')
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            {stats.map((stat, i) => (
                <StatCard key={i} {...stat} />
            ))}
        </div>
    );
};
