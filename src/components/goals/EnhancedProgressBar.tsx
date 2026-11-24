'use client';

interface EnhancedProgressBarProps {
    value: number; // 0-100
    max?: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
}

export function EnhancedProgressBar({
    value,
    max = 100,
    showLabel = true,
    size = 'md',
    animated = true
}: EnhancedProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    // Color based on performance
    const getColor = () => {
        if (percentage >= 100) return 'bg-success';
        if (percentage >= 70) return 'bg-primary';
        if (percentage >= 40) return 'bg-warning';
        return 'bg-destructive';
    };



    const getTextColor = () => {
        if (percentage >= 100) return 'text-success-readable';
        if (percentage >= 70) return 'text-primary';
        if (percentage >= 40) return 'text-warning-readable';
        return 'text-destructive-readable';
    };

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className="flex items-center gap-3">
            <div
                role="progressbar"
                aria-label="Progresso da meta"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={Math.min(Math.max(value, 0), max)}
                aria-valuetext={percentage.toFixed(0) + '%'}
                className={`flex-1 bg-muted/50 rounded-full overflow-hidden ${sizeClasses[size]}`}
            >
                <div
                    className={`h-full ${getColor()} shadow-card-ui rounded-full transition-all duration-500 ease-out ${animated ? 'animate-in slide-in-from-left' : ''
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className={`ds-type-body font-[var(--ds-type-control-weight)] ${getTextColor()} min-w-[45px] text-right tabular-nums`}>
                    {percentage.toFixed(0)}%
                </span>
            )}
        </div>
    );
}
