/**
 * Utility for normalizing and formatting strings (names, addresses)
 * and numerical data (CNPJ, CPF, CEP, Phone) specifically for the Brazilian context.
 */

const LOWERCASE_PARTICLES = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com']);

/**
 * Converts a string to Title Case while keeping Brazilian Portuguese particles in lowercase.
 * Example: "JOSE DA SILVA" -> "Jose da Silva"
 */
export function normalizeCasing(text: string | null | undefined, type: 'name' | 'address' | 'title' | 'generic' = 'generic'): string {
    if (!text) return '';

    const trimmed = text.trim();
    if (!trimmed) return '';

    // Handle state (UF) specifically: always uppercase 2 chars
    if (type === 'address' && trimmed.length === 2) {
        return trimmed.toUpperCase();
    }

    const words = trimmed.toLowerCase().split(/\s+/);
    const normalizedWords = words.map((word, index) => {
        // Always capitalize the first and last word
        if (index === 0 || index === words.length - 1) {
            return capitalize(word);
        }

        // Keep particles lowercase
        if (LOWERCASE_PARTICLES.has(word)) {
            return word;
        }

        return capitalize(word);
    });

    return normalizedWords.join(' ');
}

function capitalize(word: string): string {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Removes all non-digit characters from a string.
 */
export function onlyDigits(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
}

/**
 * Formats a Tax ID (CNPJ or CPF) based on the number of digits.
 * CNPJ: 00.000.000/0000-00 (14 digits)
 * CPF: 000.000.000-00 (11 digits)
 */
export function normalizeTaxId(value: string | null | undefined): string {
    const digits = onlyDigits(value);
    
    if (digits.length === 14) {
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    
    if (digits.length === 11) {
        return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    
    return digits || value || '';
}

/**
 * Formats a Brazilian Phone number.
 * Mobile: (00) 90000-0000 (11 digits)
 * Landline: (00) 0000-0000 (10 digits)
 */
export function normalizePhone(value: string | null | undefined): string {
    const digits = onlyDigits(value);
    
    if (digits.length === 11) {
        return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    
    if (digits.length === 10) {
        return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    
    return digits || value || '';
}

/**
 * Formats a Brazilian Zip Code (CEP).
 * Format: 00000-000 (8 digits)
 */
export function normalizeZip(value: string | null | undefined): string {
    const digits = onlyDigits(value);
    
    if (digits.length === 8) {
        return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }
    
    return digits || value || '';
}
