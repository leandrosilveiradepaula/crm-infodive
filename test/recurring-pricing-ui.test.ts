import { describe, expect, it } from 'vitest';
import {
    PRICING_MODEL_VALUES,
    createPricingModelUpdate,
    getPricingModelLabel,
    getPricingModelShortLabel,
    normalizePricingModel,
    withDefaultPricingModel
} from '../src/components/pipeline/product-row/pricingModel';

describe('recurring proposal pricing UI helpers', () => {
    it('shows Pagamento único when pricing_model is absent', () => {
        expect(normalizePricingModel(undefined)).toBe('one_time');
        expect(getPricingModelLabel(undefined)).toBe('Pagamento único');
    });

    it('shows Pagamento único for one_time', () => {
        expect(normalizePricingModel('one_time')).toBe('one_time');
        expect(getPricingModelLabel('one_time')).toBe('Pagamento único');
        expect(getPricingModelShortLabel('one_time')).toBe('Único');
    });

    it('shows Mensal for monthly', () => {
        expect(normalizePricingModel('monthly')).toBe('monthly');
        expect(getPricingModelLabel('monthly')).toBe('Mensal');
    });

    it('shows Anual for annual', () => {
        expect(normalizePricingModel('annual')).toBe('annual');
        expect(getPricingModelLabel('annual')).toBe('Anual');
    });

    it('creates the update call payload with the selected pricing_model', () => {
        expect(createPricingModelUpdate('prod-1', 'monthly')).toEqual({
            productId: 'prod-1',
            field: 'pricing_model',
            value: 'monthly',
        });
    });

    it('defaults imported products to one_time while preserving other fields', () => {
        const importedProduct = {
            id: 'imp-1',
            name: 'Imported product',
            quantity: 3,
            unit_price: 120,
            cost: 80,
            margin: 20,
            currency: 'BRL',
        };

        expect(withDefaultPricingModel(importedProduct)).toEqual({
            ...importedProduct,
            pricing_model: 'one_time',
        });
    });

    it('publishes only the supported pricing model options', () => {
        expect([...PRICING_MODEL_VALUES]).toEqual(['one_time', 'monthly', 'annual']);
    });
});
