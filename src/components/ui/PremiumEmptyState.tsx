'use client';

import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'compact';
}

export function PremiumEmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}: PremiumEmptyStateProps) {
    const isCompact = variant === 'compact';

    return (
        <div className={`flex flex-col items-center justify-center rounded-[var(--radius-panel)] border border-border bg-card ${isCompact ? 'p-4 sm:p-6' : 'p-6 sm:p-10'} text-center`}>
            <div className={`relative ${isCompact ? 'mb-3' : 'mb-4'}`}>
                <div className={`grid place-items-center bg-primary/10 ${isCompact ? 'size-10 rounded-[var(--radius-control)]' : 'size-12 rounded-[var(--radius-panel)]'}`}>
                    <Icon className={`${isCompact ? 'size-5' : 'size-6'} text-primary`} aria-hidden="true" />
                </div>
            </div>

            <h3 className={`${isCompact ? 'text-body-ui' : 'text-section-title'} font-semibold text-foreground tracking-tight mb-2`}>{title}</h3>
            <p className={`${isCompact ? 'text-metadata-ui' : 'text-body-ui'} text-foreground max-w-xs mx-auto leading-relaxed ${!isCompact && actionLabel ? 'mb-6' : ''}`}>
                {description}
            </p>

            {!isCompact && actionLabel && onAction && (
                <Button 
                    onClick={onAction}
                    className="h-10 px-5"
                >
                    <Plus className="h-4 w-4" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
