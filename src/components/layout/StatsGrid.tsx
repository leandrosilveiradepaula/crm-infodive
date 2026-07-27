'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    color: string; // Tailwind color class like 'text-primary' or 'text-emerald-600'
    gradient: string; // Tailwind gradient classes like 'from-primary/5 to-white'
    border: string; // Tailwind border class like 'border-primary/10'
    onClick?: () => void;
}

interface StatsGridProps {
    items: StatItem[];
}

export function StatsGrid({ items }: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            {items.map((stat, index) => {
                const Icon = stat.icon;
                const isClickable = !!stat.onClick;
                return (
                    <div 
                        key={index} 
                        onClick={stat.onClick}
                        className={`bg-gradient-to-br ${stat.gradient} dark:bg-card p-3 lg:p-4 rounded-md border ${stat.border} shadow-sm group hover:shadow-md transition-all relative overflow-hidden ${isClickable ? 'cursor-pointer active:scale-95' : ''}`}
                    >
                        {/* Background Floating Icon */}
                        <div className="absolute right-0 top-0 p-12 opacity-[0.03] transform translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                            <Icon className={`w-24 h-24 ${stat.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex items-center justify-between mb-3 relative z-10">
                            <h3 className={`text-[9px] font-black ${stat.color} opacity-70 uppercase tracking-[0.2em]`}>
                                {stat.label}
                            </h3>
                            <div className={`p-1.5 rounded-md bg-background/50 border border-border group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-xl font-black text-foreground tracking-tighter truncate">
                                {stat.value}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                {stat.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
