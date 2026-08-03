import type { DealProduct } from '@/types/deal';

export const PROPOSAL_PRICING_MODELS = ['one_time', 'monthly', 'annual'] as const;

export type ProposalPricingModel = typeof PROPOSAL_PRICING_MODELS[number];

export interface ProposalPricingGroup {
    pricingModel: ProposalPricingModel;
    title: string;
    totalLabel: string;
    products: DealProduct[];
    subtotal: number;
}

const PROPOSAL_PRICING_LABELS: Record<ProposalPricingModel, { title: string; totalLabel: string }> = {
    one_time: {
        title: 'Investimento único',
        totalLabel: 'Total único',
    },
    monthly: {
        title: 'Investimento mensal',
        totalLabel: 'Total mensal',
    },
    annual: {
        title: 'Investimento anual',
        totalLabel: 'Total anual',
    },
};

export function normalizeProposalPricingModel(value?: string | null): ProposalPricingModel {
    return value === 'monthly' || value === 'annual' ? value : 'one_time';
}

export function getProposalPricingLabels(value?: string | null): { title: string; totalLabel: string } {
    return PROPOSAL_PRICING_LABELS[normalizeProposalPricingModel(value)];
}

export function getProposalProductDisplaySubtotal(product: Pick<DealProduct, 'unit_price' | 'quantity'>): number {
    return (product.unit_price || 0) * (product.quantity || 1);
}

export function groupProposalInvestmentProducts(products: DealProduct[]): ProposalPricingGroup[] {
    return PROPOSAL_PRICING_MODELS.map(pricingModel => {
        const groupedProducts = products.filter(
            product => normalizeProposalPricingModel(product.pricing_model) === pricingModel
        );

        return {
            pricingModel,
            title: PROPOSAL_PRICING_LABELS[pricingModel].title,
            totalLabel: PROPOSAL_PRICING_LABELS[pricingModel].totalLabel,
            products: groupedProducts,
            subtotal: groupedProducts.reduce(
                (acc, product) => acc + getProposalProductDisplaySubtotal(product),
                0
            ),
        };
    }).filter(group => group.products.length > 0);
}
