'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { statToneClasses, type StatTone } from '@/design-system/stat-tones';

export interface StatItem {
    label: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    tone?: StatTone;
    /** @deprecated Legacy compatibility only. Styling comes from tone. */
    color?: string;
    /** @deprecated Legacy compatibility only. Styling comes from tone. */
    gradient?: string;
    /** @deprecated Legacy compatibility only. Styling comes from tone. */
    border?: string;
    onClick?: () => void;
}

interface StatsGridProps {
    items: StatItem[];
}

export function StatsGrid({ items }: StatsGridProps) {
    return (
        <section aria-label="Resumo" data-qa-region="stats" className="grid grid-cols-1 gap-[var(--ds-stat-gap)] sm:grid-cols-2 xl:grid-cols-4">
            {items.map((stat, index) => {
                const Icon = stat.icon;
                const isClickable = !!stat.onClick;
                const tone = stat.tone ?? 'neutral';
                const tileClasses = `group relative min-h-[var(--ds-stat-min-height)] overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card p-[var(--ds-stat-padding)] text-left shadow-card-ui transition-[border-color,box-shadow,transform] ${isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-ui focus-ring' : 'cursor-default'}`;
                const tileContent = (
                    <>
                        <div className="relative flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="ds-type-label font-medium text-foreground">{stat.label}</p>
                                <p className="mt-2 truncate ds-type-metric font-semibold tracking-tight text-foreground">
                                    {stat.value}
                                </p>
                            </div>
                            <div data-slot="stat-icon" data-tone={tone} className={`grid size-[var(--ds-stat-icon-size)] shrink-0 place-items-center rounded-[var(--radius-control)] ${statToneClasses[tone]}`}>
                                <Icon className="size-4" aria-hidden="true" />
                            </div>
                        </div>
                        <p className="relative mt-2 truncate ds-type-label text-muted-foreground">{stat.description}</p>
                    </>
                );

                return isClickable ? (
                    <button key={index} data-slot="stats-tile" type="button" onClick={stat.onClick} className={tileClasses}>
                        {tileContent}
                    </button>
                ) : (
                    <div key={index} data-slot="stats-tile" className={tileClasses}>
                        {tileContent}
                    </div>
                );
            })}
        </section>
    );
}
