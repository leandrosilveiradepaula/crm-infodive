import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';
import { Label } from '@/components/ui/label';

// --- Layout Primitives ---

export const ThemePanel = ({ children, className }: { children: ReactNode, className?: string }) => (
    <div className={cn("bg-card border border-border rounded-2xl p-4", className)}>
        {children}
    </div>
);

export const ThemeSectionHeader = ({ title, iconColor = "bg-primary", children }: { title: string, iconColor?: string, children?: ReactNode }) => (
    <div className="flex items-center justify-between h-6 mb-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className={cn("w-1 h-1 rounded-full", iconColor)}></span>
            {title}
        </p>
        {children}
    </div>
);

// --- Typography & Labels ---

export const ThemeLabel = ({ children, className, ...props }: { children: ReactNode, className?: string } & React.ComponentProps<typeof Label>) => (
    <Label className={cn("text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5", className)} {...props}>
        {children}
    </Label>
);

// --- Inputs & Interactive ---

interface ThemeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fullWidth?: boolean;
}

export const ThemeInput = React.forwardRef<HTMLInputElement, ThemeInputProps>(
    ({ className, fullWidth = true, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-[34px] placeholder:text-muted-foreground transition-all",
                    fullWidth && "w-full",
                    className
                )}
                {...props}
                value={props.value ?? ''}
            />
        );
    }
);
ThemeInput.displayName = "ThemeInput";

interface ThemeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    fullWidth?: boolean;
}

export const ThemeSelect = React.forwardRef<HTMLSelectElement, ThemeSelectProps>(
    ({ className, children, fullWidth = true, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={cn(
                    "bg-card border border-border rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-[34px]",
                    fullWidth && "w-full",
                    className
                )}
                {...props}
                value={props.value ?? ''}
            >
                {children}
            </select>
        );
    }
);
ThemeSelect.displayName = "ThemeSelect";

// --- Read-Only Displays ---

export const ThemeReadOnlyField = ({ children, className }: { children: ReactNode, className?: string }) => (
    <div className={cn("bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground h-[34px] flex items-center truncate", className)}>
        {children || '---'}
    </div>
);


// --- Specific Widgets ---

import { formatCurrency, parseCurrencyValue } from '@/utils/format';

export const ThemeCurrencyInput = React.forwardRef<HTMLInputElement, Omit<ThemeInputProps, 'value' | 'onChange'> & {
    value?: number | string,
    onChange?: (e: { target: { value: string } }) => void,
    currency?: string
}>(
    ({ className, currency = 'R$', value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState(
            value !== undefined ? formatCurrency(value, { showSymbol: false }) : ''
        );

        const isFocused = React.useRef(false);

        React.useEffect(() => {
            if (value !== undefined && !isFocused.current) {
                setDisplayValue(formatCurrency(value, { showSymbol: false }));
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            
            // Masking logic: only digits
            const numericString = inputValue.replace(/\D/g, '');

            if (!numericString) {
                setDisplayValue('');
                if (onChange) onChange({ target: { value: '0' } });
                return;
            }

            // The numericString is treated as cents (e.g. "123" -> 1.23)
            const numericValue = Number(numericString) / 100;
            
            // Format for display (without R$ symbol because it's in the prefix span)
            const formatted = formatCurrency(numericValue, { showSymbol: false });
            setDisplayValue(formatted);

            if (onChange) {
                onChange({ target: { value: numericValue.toString() } });
            }
        };

        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">{currency}</span>
                <ThemeInput
                    ref={ref}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onFocus={(e) => {
                        isFocused.current = true;
                        // Select all text on focus for easy replacement
                        e.target.select();
                        if (props.onFocus) (props as any).onFocus(e);
                    }}
                    onBlur={(e) => {
                        isFocused.current = false;
                        if (props.onBlur) (props as any).onBlur(e);
                    }}
                    className={cn("pl-8 text-right", className)}
                    {...props}
                />
            </div>
        );
    }
);
ThemeCurrencyInput.displayName = "ThemeCurrencyInput";
