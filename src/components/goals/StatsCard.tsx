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
    const colorClasses = {
        blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-primary',
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-600',
        amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-600',
        violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-600',
    };

    const iconBgClasses = {
        blue: 'bg-blue-500/10 text-primary',
        emerald: 'bg-emerald-500/10 text-emerald-600',
        amber: 'bg-amber-500/10 text-amber-600',
        violet: 'bg-violet-500/10 text-violet-600',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        {title}
                    </p>
                    <p className="text-3xl font-black text-foreground mb-1">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground font-medium">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="mt-3 flex items-center gap-1">
                            <span className={`text-xs font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs último período</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-xl p-3 ${iconBgClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
