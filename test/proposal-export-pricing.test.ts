import { describe, expect, it } from 'vitest';
import type { DealProduct } from '../src/types/deal';
import {
    getProposalPricingLabels,
    groupProposalInvestmentProducts,
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

describe('proposal pricing groups for exports', () => {
    it('groups one_time, monthly, and annual products with shared labels', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'setup', pricing_model: 'one_time' }),
            product({ id: 'license', pricing_model: 'monthly' }),
            product({ id: 'support', pricing_model: 'annual' }),
        ]);

        expect(groups.map(group => group.pricingModel)).toEqual(['one_time', 'monthly', 'annual']);
        expect(groups.map(group => group.title)).toEqual([
            getProposalPricingLabels('one_time').title,
            getProposalPricingLabels('monthly').title,
            getProposalPricingLabels('annual').title,
        ]);
        expect(groups.map(group => group.totalLabel)).toEqual([
            getProposalPricingLabels('one_time').totalLabel,
            getProposalPricingLabels('monthly').totalLabel,
            getProposalPricingLabels('annual').totalLabel,
        ]);
    });

    it('omits empty pricing groups', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'monthly', pricing_model: 'monthly' }),
        ]);

        expect(groups.map(group => group.pricingModel)).toEqual(['monthly']);
    });

    it('uses monthly subtotal without multiplying by 12', () => {
        const groups = groupProposalInvestmentProducts([
            product({ pricing_model: 'monthly', unit_price: 100, quantity: 2 }),
        ]);

        expect(groups[0].subtotal).toBe(200);
    });

    it('uses annual subtotal as the direct visual value', () => {
        const groups = groupProposalInvestmentProducts([
            product({ pricing_model: 'annual', unit_price: 900, quantity: 2 }),
        ]);

        expect(groups[0].subtotal).toBe(1800);
    });

    it('preserves relative order inside each pricing group', () => {
        const groups = groupProposalInvestmentProducts([
            product({ id: 'monthly-a', pricing_model: 'monthly' }),
            product({ id: 'one-time', pricing_model: 'one_time' }),
            product({ id: 'monthly-b', pricing_model: 'monthly' }),
        ]);

        expect(groups.find(group => group.pricingModel === 'monthly')?.products.map(item => item.id)).toEqual([
            'monthly-a',
            'monthly-b',
        ]);
    });
});
