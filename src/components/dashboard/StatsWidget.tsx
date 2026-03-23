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
        className="glass-card p-6 rounded-2xl relative overflow-hidden group interactive-item cursor-pointer border border-white/20 h-full"
    >
        <div className="absolute -right-4 -top-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
            <Icon className="h-32 w-32" />
        </div>

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10 shadow-inner`}>
                    <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                {change && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'} uppercase tracking-widest`}>
                        {change}
                    </span>
                )}
            </div>

            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{value}</h3>

            {subtitle && (
                <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
            {stats.map((stat, i) => (
                <StatCard key={i} {...stat} />
            ))}
        </div>
    );
};
