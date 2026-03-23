'use client';

import React, { useState, useEffect } from 'react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';

export const GoalInput = ({ value, onSave, hasError, className = '' }: { value: number; onSave: (val: number) => void; hasError?: boolean; className?: string }) => {
    const [localValue, setLocalValue] = useState<string | number>(value);
    const [isFocused, setIsFocused] = useState(false);

    // Update local value when prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const baseClasses = "w-24 text-center font-bold border transition-all duration-200 text-sm rounded-lg py-1.5 px-2 focus:outline-none tabular-nums shadow-none";
    const normalClasses = "bg-transparent text-foreground border-transparent hover:border-border hover:bg-muted/30 focus:border-primary focus:bg-background focus:shadow-sm";
    const errorClasses = "bg-red-500/5 text-red-600 border-red-500/20 hover:border-red-500 focus:border-red-500 focus:bg-red-500/10 focus:ring-0";
    const focusClasses = "ring-0 scale-100";

    return (
        <ThemeCurrencyInput
            className={`${baseClasses} ${hasError ? errorClasses : normalClasses} ${isFocused ? focusClasses : ''} ${className} pl-6 pr-2 h-8 text-right w-[110px]`}
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
