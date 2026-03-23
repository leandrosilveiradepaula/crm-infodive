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
        <div className={`flex flex-col items-center justify-center ${isCompact ? 'p-6' : 'p-12'} text-center animate-in fade-in zoom-in-95 duration-500`}>
            <div className={`relative ${isCompact ? 'mb-4' : 'mb-6'}`}>
                {/* Background Glow */}
                <div className={`absolute inset-0 bg-primary/10 blur-[40px] rounded-full scale-150 transform -translate-y-2 opacity-50`} />
                
                {/* Icon Container */}
                <div className={`relative bg-gradient-to-br from-primary/10 to-transparent ${isCompact ? 'p-4 rounded-2xl' : 'p-8 rounded-[2.5rem]'} border border-primary/10 shadow-inner group`}>
                    <Icon className={`${isCompact ? 'w-8 h-8' : 'w-16 h-16'} text-primary/40 group-hover:text-primary/60 transition-colors group-hover:scale-110 duration-500`} />
                </div>
            </div>

            <h3 className={`${isCompact ? 'text-xs' : 'text-xl'} font-black text-foreground tracking-tight mb-2 uppercase`}>{title}</h3>
            <p className={`${isCompact ? 'text-[10px]' : 'text-sm'} text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed ${!isCompact && actionLabel ? 'mb-8' : ''}`}>
                {description}
            </p>

            {!isCompact && actionLabel && onAction && (
                <Button 
                    onClick={onAction}
                    className="h-12 px-8 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 uppercase text-[11px] tracking-widest group"
                >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
