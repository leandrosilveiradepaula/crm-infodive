import type { DealProduct } from '@/types/deal';
import {
    PROPOSAL_PRICING_MODELS,
    buildProposalDisplayGroups,
    getProposalDisplaySubtotal,
    getProposalPricingLabels,
    normalizeProposalPricingModel,
    type ProposalPricingModel,
} from './proposalDisplayValues';

export interface ProposalPricingGroup {
    pricingModel: ProposalPricingModel;
    title: string;
    totalLabel: string;
    products: DealProduct[];
    subtotal: number | null;
}

export {
    PROPOSAL_PRICING_MODELS,
    getProposalPricingLabels,
    normalizeProposalPricingModel,
    type ProposalPricingModel,
};

export function getProposalProductDisplaySubtotal(product: Pick<DealProduct, 'unit_price' | 'quantity' | 'is_usd' | 'present_in_usd' | 'exchange_rate'>): number {
    return getProposalDisplaySubtotal(product);
}

export function groupProposalInvestmentProducts(products: DealProduct[]): ProposalPricingGroup[] {
    return buildProposalDisplayGroups(products).map(group => ({
        pricingModel: group.pricingModel,
        title: group.title,
        totalLabel: group.totalLabel,
        products: group.items.map(item => item.product),
        subtotal: group.totals.length === 1 ? group.totals[0].subtotal : null,
    }));
}
