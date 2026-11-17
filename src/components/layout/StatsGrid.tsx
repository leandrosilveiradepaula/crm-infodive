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
        <section aria-label="Resumo" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((stat, index) => {
                const Icon = stat.icon;
                const isClickable = !!stat.onClick;
                return (
                    <button
                        key={index} 
                        onClick={stat.onClick}
                        type="button"
                        disabled={!isClickable}
                        className={`group relative min-h-28 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-ring' : 'cursor-default'}`}
                    >
                        <div className="absolute -right-5 -top-5 text-primary/[0.06]" aria-hidden="true">
                            <Icon className="size-24" />
                        </div>
                        <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">
                                {stat.label}
                                </p>
                                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-muted ${stat.color}`}>
                                <Icon className="size-4" />
                            </div>
                        </div>
                        <p className="relative mt-2 truncate text-xs text-muted-foreground">{stat.description}</p>
                    </button>
                );
            })}
        </section>
    );
}
