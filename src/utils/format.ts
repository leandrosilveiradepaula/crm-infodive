export interface FormatCurrencyOptions {
    compact?: boolean;
    significantDigits?: number;
    showSymbol?: boolean;
}

export function formatCurrency(value: number | string | undefined | null, options: FormatCurrencyOptions = {}): string {
    if (value === undefined || value === null || value === '') return 'R$ 0,00';
    
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';

    const { compact = false, significantDigits, showSymbol = true } = options;

    return new Intl.NumberFormat('pt-BR', {
        style: showSymbol ? 'currency' : 'decimal',
        currency: 'BRL',
        notation: compact ? 'compact' : 'standard',
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : 2,
    }).format(num);
}

/**
 * Converts a formatted currency string or raw numeric string to a number.
 * Useful for masks and inputs.
 */
export function parseCurrencyValue(value: string | number | undefined | null): number {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;

    // Remove R$, spaces, and dots (thousands separator)
    // Keep comma and minus sign
    const cleanValue = value
        .replace(/[R\$\s\.]/g, '')
        .replace(',', '.');
    
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
}

export function formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '-';
    // Handle simplified "YYYY-MM-DD" or full ISO
    return new Date(dateStr).toLocaleDateString('pt-BR');
}
