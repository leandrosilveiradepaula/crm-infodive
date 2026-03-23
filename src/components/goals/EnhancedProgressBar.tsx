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
        if (percentage >= 100) return 'bg-emerald-500';
        if (percentage >= 70) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getGlowColor = () => {
        if (percentage >= 100) return 'shadow-emerald-500/50';
        if (percentage >= 70) return 'shadow-blue-500/50';
        if (percentage >= 40) return 'shadow-amber-500/50';
        return 'shadow-red-500/50';
    };

    const getTextColor = () => {
        if (percentage >= 100) return 'text-emerald-600';
        if (percentage >= 70) return 'text-primary';
        if (percentage >= 40) return 'text-amber-600';
        return 'text-red-600';
    };

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className="flex items-center gap-3">
            <div className={`flex-1 bg-muted/50 rounded-full overflow-hidden ${sizeClasses[size]}`}>
                <div
                    className={`h-full ${getColor()} ${getGlowColor()} shadow-lg rounded-full transition-all duration-500 ease-out ${animated ? 'animate-in slide-in-from-left' : ''
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <span className={`text-sm font-bold ${getTextColor()} min-w-[45px] text-right tabular-nums`}>
                    {percentage.toFixed(0)}%
                </span>
            )}
        </div>
    );
}
