'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
    color?: 'blue' | 'emerald' | 'amber' | 'violet';
}

export function StatsCard({ title, value, icon: Icon, trend, subtitle, color = 'blue' }: StatsCardProps) {
    // Retain the existing color prop for caller compatibility, but resolve its
    // meaning to shared semantic roles rather than screen-local palette values.
    const colorClasses = {
        blue: 'border-primary/20 bg-primary/5',
        emerald: 'border-success/20 bg-success-subtle',
        amber: 'border-warning/20 bg-warning-subtle',
        violet: 'border-info/20 bg-info-subtle',
    };

    const iconBgClasses = {
        blue: 'bg-primary/10 text-primary',
        emerald: 'bg-success-subtle text-success-readable',
        amber: 'bg-warning-subtle text-warning-readable',
        violet: 'bg-info-subtle text-foreground',
    };

    return (
        <div className={`relative overflow-hidden rounded-[var(--radius-panel)] border ${colorClasses[color]} p-4 transition-all duration-300 hover:shadow-card-ui hover:scale-[1.02]`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="ds-type-metadata font-[var(--ds-type-control-weight)] uppercase tracking-wider text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="ds-type-metric font-[var(--ds-type-metric-weight)] text-foreground">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="ds-type-metadata text-muted-foreground font-[var(--ds-type-label-weight)] mt-0.5">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={`ds-type-metadata font-[var(--ds-type-control-weight)] ${trend.isPositive ? 'text-success-readable' : 'text-destructive-readable'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="ds-type-metadata text-muted-foreground">vs último mês</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-[var(--radius-panel)] p-2 ${iconBgClasses[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
