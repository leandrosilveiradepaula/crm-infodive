'use client';

import React, { useState, useEffect } from 'react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';

export const GoalInput = ({ value, onSave, hasError, className = '', label = 'Valor da meta' }: { value: number; onSave: (val: number) => void; hasError?: boolean; className?: string; label?: string }) => {
    const [localValue, setLocalValue] = useState<string | number>(value);
    const [isFocused, setIsFocused] = useState(false);

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const baseClasses = "text-center font-[var(--ds-type-control-weight)] border transition-all duration-200 ds-type-body rounded-[var(--radius-panel)] py-1.5 px-2 focus:outline-none tabular-nums shadow-none";
    const normalClasses = "bg-transparent text-foreground border-transparent hover:border-border hover:bg-muted/30 focus:border-primary focus:bg-background focus:shadow-control-ui";
    const errorClasses = "bg-destructive-subtle text-destructive-readable border-destructive/20 hover:border-destructive focus:border-destructive focus:bg-destructive-subtle focus:ring-0";
    const focusClasses = "ring-0 scale-100";

    return (
        <ThemeCurrencyInput
            aria-label={label}
            className={`${baseClasses} ${hasError ? errorClasses : normalClasses} ${isFocused ? focusClasses : ''} ${className} pl-9 pr-2 h-8 text-right w-[130px]`}
            value={localValue || 0}
            onChange={(e) => setLocalValue(Number(e.target.value))}
            onFocus={(e) => {
                setIsFocused(true);
                e.target.select();
            }}
            onBlur={() => {
                setIsFocused(false);
                const val = localValue === '' ? 0 : Number(localValue);
                if (val !== value) onSave(val);
                setLocalValue(val);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
        />
    );
};
