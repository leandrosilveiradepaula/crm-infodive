'use client';
import { useRouter } from 'next/navigation';
import { DollarSign, Target, TrendingUp, Activity } from 'lucide-react';
import { formatCompact } from '../../utils/analytics';
import type { DashboardMetrics } from '../../hooks/useDashboardMetrics';

import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';

interface StatsWidgetProps {
    metrics: DashboardMetrics;
}

export const StatsWidget = ({ metrics }: StatsWidgetProps) => {
    const router = useRouter();

    const stats: StatItem[] = [
        {
            label: "Pipeline Total",
            value: formatCompact(metrics.totalPipeline),
            sublabel: `${metrics.totalDeals - metrics.wonDeals - metrics.lostDeals} oportunidades ativas`,
            icon: DollarSign,
            tone: "primary",
            onClick: () => router.push('/pipeline')
        },
        {
            label: "Previsão Ponderada",
            value: formatCompact(metrics.weightedForecast),
            sublabel: "Baseada em probabilidade",
            icon: Target,
            tone: "info",
            onClick: () => router.push('/pipeline')
        },
        {
            label: "Ganho no Mês",
            value: formatCompact(metrics.wonThisMonth),
            description: "Valor das oportunidades ganhas",
            icon: TrendingUp,
            tone: "success",
            onClick: () => router.push('/pipeline')
        },
        {
            label: "Taxa de conversão",
            value: `${metrics.winRate.toFixed(1)}%`,
            sublabel: `${metrics.wonDeals} ganhos / ${metrics.wonDeals + metrics.lostDeals} fechados`,
            icon: Activity,
            tone: "primary",
            onClick: () => router.push('/reports')
        },
    ];

    return <StatsGrid items={stats} />;
};
