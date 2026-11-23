'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    color: string; // Semantic Tailwind text class, e.g. 'text-primary'
    gradient?: string; // Deprecated input; never rendered. New callers must use semantic panel tokens.
    border?: string; // Deprecated input; never rendered. Layout owns border.
    onClick?: () => void;
}

interface StatsGridProps {
    items: StatItem[];
}

export function StatsGrid({ items }: StatsGridProps) {
    return (
        <section aria-label="Resumo" data-qa-region="stats" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((stat, index) => {
                const Icon = stat.icon;
                const isClickable = !!stat.onClick;
                const tileClasses = `group relative min-h-28 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-ui focus-ring' : 'cursor-default'}`;
                const tileContent = (
                    <>
                        <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="ds-type-label font-medium text-foreground">{stat.label}</p>
                                <p className="mt-2 truncate ds-type-metric font-semibold tracking-tight text-foreground">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] bg-muted ${stat.color}`}>
                                <Icon className="size-4" />
                            </div>
                        </div>
                        <p className="relative mt-2 truncate ds-type-label text-foreground">{stat.description}</p>
                    </>
                );

                return isClickable ? (
                    <button key={index} type="button" onClick={stat.onClick} className={tileClasses}>
                        {tileContent}
                    </button>
                ) : (
                    <div key={index} className={tileClasses}>
                        {tileContent}
                    </div>
                );
            })}
        </section>
    );
}
