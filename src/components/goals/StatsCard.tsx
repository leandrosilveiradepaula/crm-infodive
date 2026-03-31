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
        violet: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-600',
    };

    const iconBgClasses = {
        blue: 'bg-blue-500/10 text-primary',
        emerald: 'bg-emerald-500/10 text-emerald-600',
        amber: 'bg-amber-500/10 text-amber-600',
        violet: 'bg-cyan-500/10 text-cyan-600',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-black text-foreground">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span className={`text-[10px] font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">vs último mês</span>
                        </div>
                    )}
                </div>
                <div className={`rounded-xl p-2 ${iconBgClasses[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}
