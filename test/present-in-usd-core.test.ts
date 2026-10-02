import { describe, expect, it } from 'vitest';
import { mergeDealProductCurrencyFields, normalizeDealProductCurrencyFields } from '../src/services/dealProductCurrencyPayload';
import { normalizePresentInUsdState } from '../src/components/pipeline/product-row/presentInUsd';
import { calculateDealValue, type ProductPriceItem } from '../src/utils/dealCalculations';
import { calculateDealCommission } from '../src/utils/commissionCalculator';

const product = (overrides: Partial<ProductPriceItem> = {}): ProductPriceItem => ({
    id: overrides.id || 'product-1',
    unit_price: overrides.unit_price ?? 100,
    quantity: overrides.quantity ?? 1,
    cost: overrides.cost ?? 40,
    ...overrides,
});

describe('present_in_usd core payload semantics', () => {
    it('normalizes absent present_in_usd to false', () => {
        expect(normalizeDealProductCurrencyFields({}).present_in_usd).toBe(false);
    });

    it('preserves present_in_usd false', () => {
        expect(normalizeDealProductCurrencyFields({ present_in_usd: false }).present_in_usd).toBe(false);
    });

    it('rejects present_in_usd true without USD mode and a valid rate', () => {
        expect(normalizeDealProductCurrencyFields({ present_in_usd: true }).present_in_usd).toBe(false);
    });

    it('preserves is_usd', () => {
        expect(normalizeDealProductCurrencyFields({ is_usd: true }).is_usd).toBe(true);
        expect(normalizeDealProductCurrencyFields({ is_usd: false }).is_usd).toBe(false);
    });

    it('preserves usd_cost', () => {
        expect(normalizeDealProductCurrencyFields({ usd_cost: 123.45 }).usd_cost).toBe(123.45);
    });

    it('preserves usd_cost 0', () => {
        expect(normalizeDealProductCurrencyFields({ usd_cost: 0 }).usd_cost).toBe(0);
    });

    it('preserves exchange_rate', () => {
        expect(normalizeDealProductCurrencyFields({ exchange_rate: 5.4321 }).exchange_rate).toBe(5.4321);
    });

    it('preserves exchange_rate 0', () => {
        expect(normalizeDealProductCurrencyFields({ exchange_rate: 0 }).exchange_rate).toBe(0);
    });

    it('keeps an absent exchange rate null-safe', () => {
        expect(normalizeDealProductCurrencyFields({ is_usd: true }).exchange_rate).toBeNull();
    });

    it('preserves an explicit zero exchange rate', () => {
        expect(normalizeDealProductCurrencyFields({ exchange_rate: 0 }).exchange_rate).toBe(0);
    });

    it('normalizes a bulk payload with all currency fields', () => {
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            usd_cost: 99,
            exchange_rate: 5.1,
            present_in_usd: true,
        })).toEqual({
            is_usd: true,
            usd_cost: 99,
            exchange_rate: 5.1,
            present_in_usd: true,
        });
    });

    it('preserves valid present_in_usd for duplicated products', () => {
        const original = normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: 5,
            present_in_usd: true,
        });
        const duplicated = { ...original, deal_id: 'new-deal' };

        expect(duplicated.present_in_usd).toBe(true);
    });

    it('sets imported products without present_in_usd to false', () => {
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            usd_cost: 10,
            exchange_rate: 5,
        }).present_in_usd).toBe(false);
    });

    it('rejects present_in_usd when USD mode is false', () => {
        expect(normalizeDealProductCurrencyFields({
            is_usd: false,
            exchange_rate: 5,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('rejects present_in_usd when the exchange rate is null or non-positive', () => {
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: null,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: 0,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('allows present_in_usd only with USD mode and a positive finite rate', () => {
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: true,
        }).present_in_usd).toBe(true);
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: Number.NaN,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
        expect(normalizeDealProductCurrencyFields({
            is_usd: true,
            exchange_rate: Number.POSITIVE_INFINITY,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('clears present_in_usd when a partial update disables USD mode', () => {
        expect(mergeDealProductCurrencyFields(
            { is_usd: true, exchange_rate: 5.2, present_in_usd: true, usd_cost: 10 },
            { is_usd: false },
        )).toEqual({
            is_usd: false,
            usd_cost: 10,
            exchange_rate: 5.2,
            present_in_usd: false,
        });
    });

    it('clears present_in_usd when a partial update removes the exchange rate', () => {
        expect(mergeDealProductCurrencyFields(
            { is_usd: true, exchange_rate: 5.2, present_in_usd: true, usd_cost: 10 },
            { exchange_rate: null },
        )).toEqual({
            is_usd: true,
            usd_cost: 10,
            exchange_rate: null,
            present_in_usd: false,
        });
    });

    it('keeps valid persisted currency state when updating only present_in_usd', () => {
        expect(mergeDealProductCurrencyFields(
            { is_usd: true, exchange_rate: 5.2, present_in_usd: false, usd_cost: 10 },
            { present_in_usd: true },
        )).toEqual({
            is_usd: true,
            usd_cost: 10,
            exchange_rate: 5.2,
            present_in_usd: true,
        });
    });

    it('does not include present_in_usd in deal.value calculation', () => {
        const brlProduct = product({ id: 'brl', present_in_usd: false });
        const usdPresentationProduct = product({ id: 'usd-presentation', present_in_usd: true });

        expect(calculateDealValue([brlProduct])).toBe(calculateDealValue([usdPresentationProduct]));
    });

    it('does not include present_in_usd in commission calculation', () => {
        const brlResult = calculateDealCommission({
            commission_deduction: 0,
            deal_products: [product({ id: 'brl', present_in_usd: false })],
        }, null, 10);
        const usdPresentationResult = calculateDealCommission({
            commission_deduction: 0,
            deal_products: [product({ id: 'usd-presentation', present_in_usd: true })],
        }, null, 10);

        expect(usdPresentationResult.netMargin).toBe(brlResult.netMargin);
        expect(usdPresentationResult.commission).toBe(brlResult.commission);
    });
});

describe('present_in_usd pipeline UI state', () => {
    it('normalizes present_in_usd to false when is_usd is false', () => {
        expect(normalizePresentInUsdState({
            is_usd: false,
            exchange_rate: 5,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('clears present_in_usd when is_usd is disabled', () => {
        const enabled = normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5,
            present_in_usd: true,
        });

        expect(normalizePresentInUsdState({
            ...enabled,
            is_usd: false,
        }).present_in_usd).toBe(false);
    });

    it('prevents present_in_usd when exchange_rate is absent', () => {
        expect(normalizePresentInUsdState({
            is_usd: true,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('prevents present_in_usd when exchange_rate is 0', () => {
        expect(normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 0,
            present_in_usd: true,
        }).present_in_usd).toBe(false);
    });

    it('allows present_in_usd when exchange_rate is positive', () => {
        expect(normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: true,
        }).present_in_usd).toBe(true);
    });

    it('clears present_in_usd when exchange_rate is reduced to 0', () => {
        const enabled = normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: true,
        });

        expect(normalizePresentInUsdState({
            ...enabled,
            exchange_rate: 0,
        }).present_in_usd).toBe(false);
    });

    it('preserves present_in_usd false', () => {
        expect(normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: false,
        }).present_in_usd).toBe(false);
    });

    it('preserves present_in_usd true when is_usd and exchange_rate are valid', () => {
        expect(normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: true,
        }).present_in_usd).toBe(true);
    });

    it('does not convert unit_price or cost', () => {
        const normalized = normalizePresentInUsdState({
            is_usd: true,
            exchange_rate: 5.2,
            present_in_usd: true,
            unit_price: 1000,
            cost: 700,
        });

        expect(normalized.unit_price).toBe(1000);
        expect(normalized.cost).toBe(700);
    });
});
