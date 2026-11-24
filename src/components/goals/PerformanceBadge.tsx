'use client';

interface PerformanceBadgeProps {
    percentage: number;
    showPercentage?: boolean;
}

export function PerformanceBadge({ percentage, showPercentage = false }: PerformanceBadgeProps) {
    const getStatus = () => {
        if (percentage >= 100) return { label: 'Superando', tone: 'success', emoji: '🚀' };
        if (percentage >= 70) return { label: 'No Caminho', tone: 'info', emoji: '✨' };
        if (percentage >= 40) return { label: 'Atrasado', tone: 'warning', emoji: '⚠️' };
        return { label: 'Crítico', tone: 'destructive', emoji: '🔴' };
    };

    const status = getStatus();

    const toneClasses = {
        success: 'bg-success-subtle text-success-readable border-success/20',
        info: 'bg-info-subtle text-foreground border-info/20',
        warning: 'bg-warning-subtle text-warning-readable border-warning/20',
        destructive: 'bg-destructive-subtle text-destructive-readable border-destructive/20',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ds-type-metadata font-[var(--ds-type-control-weight)] border ${toneClasses[status.tone as keyof typeof toneClasses]}`}>
            <span aria-hidden="true">{status.emoji}</span>
            <span>{status.label}</span>
            {showPercentage && <span className="opacity-70">({percentage.toFixed(0)}%)</span>}
        </span>
    );
}
