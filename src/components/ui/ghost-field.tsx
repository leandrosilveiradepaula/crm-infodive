'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Shared ghost styling
const ghostBase = [
    'bg-transparent rounded-md transition-all duration-150',
    'border border-transparent',
    'hover:border-border/40 hover:bg-muted/20',
    'focus:border-primary/40 focus:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/20',
].join(' ');

// ---------------------------------------------------------------------------
// GhostField — text input that looks like text until hovered/focused
// ---------------------------------------------------------------------------
interface GhostFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    mono?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
}

export function GhostField({
    label,
    value,
    onChange,
    mono,
    type = 'text',
    placeholder = '—',
    className,
    icon,
}: GhostFieldProps) {
    return (
        <div className="flex items-center justify-between py-0.5 gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                {icon}
                {label}
            </span>
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    'text-sm font-bold text-foreground text-right',
                    'px-2 py-1 max-w-[260px] w-full',
                    ghostBase,
                    'placeholder:text-muted-foreground/30 placeholder:font-normal',
                    mono && 'font-mono',
                    className
                )}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// GhostSelect — native select that looks like text until hovered/focused
// ---------------------------------------------------------------------------
interface GhostSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
}

export function GhostSelect({
    label,
    value,
    onChange,
    options,
    className,
}: GhostSelectProps) {
    return (
        <div className="flex items-center justify-between py-0.5 gap-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                {label}
            </span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'text-sm font-bold text-foreground text-right cursor-pointer',
                    'px-2 py-1 max-w-[260px] w-full appearance-none',
                    ghostBase,
                    className
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ---------------------------------------------------------------------------
// GhostTextarea — textarea that looks like text until hovered/focused
// ---------------------------------------------------------------------------
interface GhostTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
}

export function GhostTextarea({
    value,
    onChange,
    placeholder = 'Adicione uma observação...',
    rows = 3,
    className,
}: GhostTextareaProps) {
    return (
        <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn(
                'w-full text-sm text-muted-foreground resize-none',
                'px-3 py-2',
                ghostBase,
                'placeholder:text-muted-foreground/30',
                className
            )}
        />
    );
}
