import { describe, expect, it } from 'vitest';
import {
    INGRAM_HW_MAX_PRODUCTS,
    validateDistributorOrderExtraData,
    validateDistributorOrderProducts,
} from './distributor-order-validation';

const product = { sku: 'SKU-123', quantity: 2, unitPrice: 100 };

describe('Ingram HW workbook input contracts', () => {
    it('allows exactly eight product rows without altering price and quantity', () => {
        const products = validateDistributorOrderProducts(Array.from({ length: 8 },
            (_, i) => ({ ...product, sku: 'SKU-' + i })));
        expect(INGRAM_HW_MAX_PRODUCTS).toBe(8);
        expect(products).toHaveLength(8);
        expect(products[0]).toEqual({ sku: 'SKU-0', quantity: 2, unitPrice: 100 });
    });

    it('refuses a ninth product rather than silently dropping it', () => {
        expect(() => validateDistributorOrderProducts(
            Array.from({ length: 9 }, (_, i) => ({ ...product, sku: 'SKU-' + i })),
        )).toThrow('entre 1 e 8');
        expect(() => validateDistributorOrderProducts([])).toThrow('entre 1 e 8');
    });

    it('rejects invalid quantities and non-finite or negative prices', () => {
        for (const row of [
            { ...product, quantity: 0 },
            { ...product, quantity: 1.5 },
            { ...product, quantity: 100001 },
            { ...product, unitPrice: Number.NaN },
            { ...product, unitPrice: Number.POSITIVE_INFINITY },
            { ...product, unitPrice: -1 },
        ]) {
            expect(() => validateDistributorOrderProducts([row])).toThrow('inválidos');
        }
    });

    it('rejects malformed or formula-like product SKUs', () => {
        for (const sku of ['', ' ', '=HYPERLINK("http://example.test")', '@cmd', 'a'.repeat(121)]) {
            expect(() => validateDistributorOrderProducts([{ ...product, sku }])).toThrow();
        }
    });

    it('accepts configured billing and documented end-customer overrides', () => {
        expect(validateDistributorOrderExtraData({ billingType: 'reseller',
            dealerName: 'Infodive', userEmail: 'client@example.test',
            products: [product] })).toMatchObject({
            billingType: 'reseller', dealerName: 'Infodive',
        });
        expect(validateDistributorOrderExtraData(undefined)).toBeUndefined();
    });

    it('rejects unknown overrides, invalid billing, oversized strings and formula content', () => {
        for (const value of [
            { unauthorized: 'value' },
            { billingType: 'other' },
            { userName: '=1+1' },
            { dealerName: 'A'.repeat(501) },
            { products: 'not an array' },
        ]) {
            expect(() => validateDistributorOrderExtraData(value)).toThrow();
        }
    });
});
