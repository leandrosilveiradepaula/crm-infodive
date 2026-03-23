'use client';

interface PerformanceBadgeProps {
    percentage: number;
    showPercentage?: boolean;
}

export function PerformanceBadge({ percentage, showPercentage = false }: PerformanceBadgeProps) {
    const getStatus = () => {
        if (percentage >= 100) return { label: 'Superando', color: 'emerald', emoji: '🚀' };
        if (percentage >= 70) return { label: 'No Caminho', color: 'blue', emoji: '✨' };
        if (percentage >= 40) return { label: 'Atrasado', color: 'amber', emoji: '⚠️' };
        return { label: 'Crítico', color: 'red', emoji: '🔴' };
    };

    const status = getStatus();

    const colorClasses = {
        emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        amber: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        red: 'bg-red-500/10 text-red-700 border-red-500/20',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorClasses[status.color as keyof typeof colorClasses]}`}>
            <span>{status.emoji}</span>
            <span>{status.label}</span>
            {showPercentage && <span className="opacity-70">({percentage.toFixed(0)}%)</span>}
        </span>
    );
}
