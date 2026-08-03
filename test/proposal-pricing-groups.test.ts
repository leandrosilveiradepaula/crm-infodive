import { describe, expect, it } from 'vitest';
import type { DealProduct } from '../src/types/deal';
import {
    PROPOSAL_PRICING_MODELS,
    getProposalProductDisplaySubtotal,
    groupProposalInvestmentProducts,
    normalizeProposalPricingModel,
} from '../src/components/proposals/proposalPricingGroups';

const product = (overrides: Partial<DealProduct> = {}): DealProduct => ({
    id: overrides.id || 'product-1',
    organization_id: 'org-1',
    deal_id: 'deal-1',
    name: overrides.name || 'Product',
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 100,
    cost: overrides.cost ?? 40,
    margin: overrides.margin ?? 20,
    ...overrides,
});

describe('proposal recurring pricing groups', () => {
    it('normalizes absent and invalid pricing_model to one_time', () => {
        expect(normalizeProposalPricingModel(undefined)).toBe('one_time');
        expect(normalizeProposalPricingModel(null)).toBe('one_time');
        expect(normalizeProposalPricingModel('unexpected')).toBe('one_time');
    });

    it('groups one_time, monthly, and annual products in their proposal sections', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'one', pricing_model: 'one_time' }),
            product({ id: 'month', pricing_model: 'monthly' }),
            product({ id: 'year', pricing_model: 'annual' }),
        ]);

        expect(groups.map(group => group.pricingModel)).toEqual(['one_time', 'monthly', 'annual']);
        expect(groups.map(group => group.title)).toEqual(['Investimento único', 'Investimento mensal', 'Investimento anual']);
    });

    it('does not produce empty groups', () => {
        expect(groupProposalInvestmentProducts([product({ pricing_model: 'monthly' })]).map(group => group.pricingModel)).toEqual(['monthly']);
    });

    it('uses visual subtotals without recurring multipliers', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'monthly', pricing_model: 'monthly', unit_price: 100, quantity: 2 }),
            product({ id: 'annual', pricing_model: 'annual', unit_price: 300, quantity: 2 }),
        ]);

        expect(groups.find(group => group.pricingModel === 'monthly')?.subtotal).toBe(200);
        expect(groups.find(group => group.pricingModel === 'annual')?.subtotal).toBe(600);
    });

    it('preserves quantity and display subtotal formula', () => {
        const item = product({ quantity: 3, unit_price: 125 });

        expect(getProposalProductDisplaySubtotal(item)).toBe(375);
    });

    it('preserves relative order inside each group', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'monthly-a', pricing_model: 'monthly' }),
            product({ id: 'one-time', pricing_model: 'one_time' }),
            product({ id: 'monthly-b', pricing_model: 'monthly' }),
        ]);

        expect(groups.find(group => group.pricingModel === 'monthly')?.products.map(item => item.id)).toEqual(['monthly-a', 'monthly-b']);
    });

    it('keeps optional products in their pricing group', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'optional-monthly', pricing_model: 'monthly', is_optional: true }),
        ]);

        expect(groups[0].products[0].is_optional).toBe(true);
    });

    it('places parent and child with different pricing models in their own groups', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'parent', pricing_model: 'one_time' }),
            product({ id: 'child', parent_id: 'parent', pricing_model: 'annual' }),
        ]);

        expect(groups.find(group => group.pricingModel === 'one_time')?.products.map(item => item.id)).toEqual(['parent']);
        expect(groups.find(group => group.pricingModel === 'annual')?.products.map(item => item.id)).toEqual(['child']);
    });

    it('publishes pricing models in proposal display order', () => {
        expect([...PROPOSAL_PRICING_MODELS]).toEqual(['one_time', 'monthly', 'annual']);
    });
});
