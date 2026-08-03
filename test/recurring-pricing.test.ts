import { describe, expect, it } from 'vitest';
import { calculateDealTotalCost, calculateDealValue, getRecurringPricingMultiplier, type ProductPriceItem } from '../src/utils/dealCalculations';
import { calculateDealCommission } from '../src/utils/commissionCalculator';

const product = (overrides: Partial<ProductPriceItem> = {}): ProductPriceItem => ({
    id: overrides.id || 'product-1',
    unit_price: overrides.unit_price ?? 100,
    quantity: overrides.quantity ?? 1,
    cost: overrides.cost ?? 40,
    ...overrides
});

describe('recurring proposal pricing core', () => {
    it('uses multiplier 1 when pricing_model is absent or one_time', () => {
        expect(getRecurringPricingMultiplier(undefined)).toBe(1);
        expect(getRecurringPricingMultiplier(null)).toBe(1);
        expect(getRecurringPricingMultiplier('unexpected')).toBe(1);
        expect(getRecurringPricingMultiplier('one_time')).toBe(1);
        expect(calculateDealValue([product()])).toBe(100);
        expect(calculateDealValue([product({ pricing_model: 'one_time' })])).toBe(100);
    });

    it('uses multiplier 12 for monthly pricing', () => {
        expect(getRecurringPricingMultiplier('monthly')).toBe(12);
        expect(calculateDealValue([product({ pricing_model: 'monthly' })])).toBe(1200);
    });

    it('uses multiplier 1 for annual pricing', () => {
        expect(getRecurringPricingMultiplier('annual')).toBe(1);
        expect(calculateDealValue([product({ pricing_model: 'annual' })])).toBe(100);
    });

    it('preserves quantity in recurring calculations', () => {
        expect(calculateDealValue([product({ pricing_model: 'monthly', quantity: 2 })])).toBe(2400);
    });

    it('preserves cost calculations with recurring multiplier', () => {
        expect(calculateDealTotalCost([product({ pricing_model: 'monthly', cost: 25, quantity: 2 })])).toBe(600);
    });

    it('does not introduce discount behavior into the existing calculation', () => {
        const discountedProduct = product({ pricing_model: 'monthly', unit_price: 100, quantity: 1 }) as ProductPriceItem & { discount: number };
        discountedProduct.discount = 50;

        expect(calculateDealValue([discountedProduct])).toBe(1200);
    });

    it('keeps optional scenario selection rules', () => {
        const products = [
            product({ id: 'option-a', is_optional: true, unit_price: 100, pricing_model: 'monthly' }),
            product({ id: 'option-b', is_optional: true, unit_price: 500 })
        ];

        expect(calculateDealValue(products)).toBe(1200);
    });

    it('keeps parent and child rules with each product multiplier applied once', () => {
        const products = [
            product({ id: 'parent', unit_price: 100, pricing_model: 'monthly' }),
            product({ id: 'child', parent_id: 'parent', unit_price: 50, pricing_model: 'annual' })
        ];

        expect(calculateDealValue(products)).toBe(1250);
    });

    it('uses annualized monthly margin for commission', () => {
        const result = calculateDealCommission({
            commission_deduction: 0,
            deal_products: [product({ pricing_model: 'monthly', unit_price: 100, cost: 40 })]
        }, null, 10);

        expect(result.netMargin).toBe(720);
        expect(result.commission).toBe(72);
    });

    it('keeps one_time and annual commission with multiplier 1', () => {
        const result = calculateDealCommission({
            commission_deduction: 0,
            deal_products: [
                product({ id: 'one-time', pricing_model: 'one_time', unit_price: 100, cost: 40 }),
                product({ id: 'annual', pricing_model: 'annual', unit_price: 100, cost: 40 })
            ]
        }, null, 10);

        expect(result.netMargin).toBe(120);
        expect(result.commission).toBe(12);
    });
});
