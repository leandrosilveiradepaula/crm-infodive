
'use client';

import React from 'react';
import { Input } from './input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number | string;
    onValueChange: (value: number | undefined) => void;
    prefix?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onValueChange, prefix = 'R$', className, ...props }, ref) => {

        // --- Format Helper ---
        // Converts raw number to "R$ 1.234,56" string for display
        const formatDisplay = (val: number | string | undefined): string => {
            if (val === undefined || val === '') return '';

            // If string, assume it's already formatted or partially typed?
            // Actually, let's treat 'value' prop as the raw numeric value mostly.
            const num = Number(val);
            if (isNaN(num)) return '';

            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        };

        // --- Parse Helper ---
        // Converts "R$ 1.234,56" string input back to 1234.56 number
        const parseValue = (val: string): number => {
            // Remove non-numeric chars except comma (decimal)
            const digits = val.replace(/\D/g, '');
            return Number(digits) / 100;
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const numberVal = parseValue(raw);
            onValueChange(numberVal);
        };

        return (
            <Input
                ref={ref}
                type="text"
                className={className}
                // Simple approach: Controlled input that formats on blur or just handles raw text?
                // "Currency Masking" is complex. 
                // For now, let's use a simpler approach: 
                // - Display is formatted.
                // - User edits raw text or we use a library?
                // - Given constraints, I'll use a simple wrapper that formats ON BLUR, 
                //   but while editing shows raw value? Or just relies on the user typing numbers?

                // BETTER APPROACH for quick implementation without new libs:
                // Just use type="number" step="0.01" for now effectively, but the user asked for "CurrencyInput".
                // Let's implement the "Integers / 100" logic.

                value={value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)) : ''}
                onChange={(e) => {
                    // Classic money mask
                    // 1. Get only digits
                    const digits = e.target.value.replace(/\D/g, "");
                    // 2. Divide by 100
                    const realValue = Number(digits) / 100;
                    // 3. Propagate up
                    onValueChange(realValue);
                }}
                {...props}
            />
        );
    }
);
CurrencyInput.displayName = 'CurrencyInput';
