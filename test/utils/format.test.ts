import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyValue, formatDate } from '../../src/utils/format';

// ─── formatCurrency ─────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  describe('nullish and empty inputs', () => {
    it('should return default when value is undefined', () => {
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
    });

    it('should return default when value is null', () => {
      expect(formatCurrency(null)).toBe('R$ 0,00');
    });

    it('should return default when value is empty string', () => {
      expect(formatCurrency('')).toBe('R$ 0,00');
    });

    it('should return default when value is NaN string', () => {
      expect(formatCurrency('abc')).toBe('R$ 0,00');
    });
  });

  describe('numeric inputs (default options)', () => {
    it('should format zero', () => {
      const result = formatCurrency(0);
      // Intl.NumberFormat uses non-breaking space (\u00A0) between symbol and number
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    it('should format integer', () => {
      const result = formatCurrency(1500);
      expect(result).toContain('1.500');
      expect(result).toContain('00');
    });

    it('should format decimal value', () => {
      const result = formatCurrency(49.9);
      expect(result).toContain('49');
      expect(result).toContain('90');
    });

    it('should format negative value', () => {
      const result = formatCurrency(-250);
      expect(result).toContain('250');
      expect(result).toContain('00');
    });

    it('should format large value with thousands separator', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toContain('1.234.567');
      expect(result).toContain('89');
    });
  });

  describe('string inputs', () => {
    it('should parse numeric string', () => {
      const result = formatCurrency('1500');
      expect(result).toContain('1.500');
    });

    it('should parse decimal string', () => {
      const result = formatCurrency('99.99');
      expect(result).toContain('99');
    });
  });

  describe('compact option', () => {
    it('should format large value in compact notation', () => {
      const result = formatCurrency(1500000, { compact: true });
      // pt-BR compact: "R$ 1,5 mi" or similar
      expect(result.length).toBeLessThan(formatCurrency(1500000).length);
    });

    it('should format small value without compacting', () => {
      const result = formatCurrency(50, { compact: true });
      expect(result).toContain('50');
    });
  });

  describe('showSymbol option', () => {
    it('should include R$ symbol by default', () => {
      const result = formatCurrency(100);
      expect(result).toContain('R$');
    });

    it('should omit R$ symbol when showSymbol is false', () => {
      const result = formatCurrency(100, { showSymbol: false });
      expect(result).not.toContain('R$');
    });
  });
});

// ─── parseCurrencyValue ─────────────────────────────────────────────────────

describe('parseCurrencyValue', () => {
  describe('nullish and empty inputs', () => {
    it('should return 0 for undefined', () => {
      expect(parseCurrencyValue(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(parseCurrencyValue(null)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(parseCurrencyValue('')).toBe(0);
    });
  });

  describe('numeric passthrough', () => {
    it('should return the same number when given a number', () => {
      expect(parseCurrencyValue(42.5)).toBe(42.5);
    });

    it('should return 0 for numeric zero', () => {
      expect(parseCurrencyValue(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(parseCurrencyValue(-100)).toBe(-100);
    });
  });

  describe('BRL formatted strings', () => {
    it('should parse "R$ 1.500,00" to 1500', () => {
      expect(parseCurrencyValue('R$ 1.500,00')).toBe(1500);
    });

    it('should parse "R$ 49,90" to 49.9', () => {
      expect(parseCurrencyValue('R$ 49,90')).toBe(49.9);
    });

    it('should parse "R$ 0,00" to 0', () => {
      expect(parseCurrencyValue('R$ 0,00')).toBe(0);
    });

    it('should parse value without R$ prefix', () => {
      expect(parseCurrencyValue('1.234,56')).toBe(1234.56);
    });

    it('should parse large formatted value', () => {
      expect(parseCurrencyValue('R$ 1.234.567,89')).toBe(1234567.89);
    });
  });

  describe('raw numeric strings', () => {
    it('should parse plain integer string', () => {
      expect(parseCurrencyValue('100')).toBe(100);
    });

    it('should treat dot as thousands separator in plain decimal string', () => {
      // parseCurrencyValue is designed for BRL format where dot = thousands separator
      // "99.99" → dot removed → "9999" → comma replaced → 9999
      expect(parseCurrencyValue('99.99')).toBe(9999);
    });
  });

  describe('invalid strings', () => {
    it('should return 0 for non-numeric string', () => {
      expect(parseCurrencyValue('abc')).toBe(0);
    });

    it('should return 0 for symbols only', () => {
      expect(parseCurrencyValue('R$ ')).toBe(0);
    });
  });
});

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  describe('nullish inputs', () => {
    it('should return dash for undefined', () => {
      expect(formatDate(undefined)).toBe('-');
    });

    it('should return dash for null', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatDate('')).toBe('-');
    });
  });

  describe('valid date strings', () => {
    it('should format ISO date (YYYY-MM-DD)', () => {
      const result = formatDate('2025-03-15');
      // pt-BR: DD/MM/YYYY
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain('2025');
    });

    it('should format full ISO datetime', () => {
      const result = formatDate('2025-12-25T10:30:00Z');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain('2025');
    });

    it('should format start of year (with timezone)', () => {
      // "YYYY-MM-DD" without time is parsed as UTC midnight,
      // which may shift to previous day in negative UTC offsets
      const result = formatDate('2025-01-01T12:00:00');
      expect(result).toContain('01/01/2025');
    });
  });
});
