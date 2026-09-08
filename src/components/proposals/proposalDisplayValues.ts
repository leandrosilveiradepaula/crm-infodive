import type { DealProduct } from '@/types/deal';

export const PROPOSAL_PRICING_MODELS = ['one_time', 'monthly', 'annual'] as const;

export type ProposalPricingModel = typeof PROPOSAL_PRICING_MODELS[number];

export type ProposalDisplayCurrency = 'BRL' | 'USD';

export interface ProposalDisplayItem {
    product: DealProduct;
    currency: ProposalDisplayCurrency;
    unitPrice: number;
    subtotal: number;
    quantity: number;
    pricingModel: ProposalPricingModel;
    validExchangeRate: boolean;
    usdFallbackToBrl: boolean;
}

export interface ProposalDisplayCurrencyTotal {
    currency: ProposalDisplayCurrency;
    subtotal: number;
    totalLabel: string;
}

export interface ProposalDisplayPricingGroup {
    pricingModel: ProposalPricingModel;
    title: string;
    totalLabel: string;
    items: ProposalDisplayItem[];
    totals: ProposalDisplayCurrencyTotal[];
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

export function hasValidProposalExchangeRate(product: Pick<DealProduct, 'exchange_rate'>): boolean {
    const exchangeRate = Number(product.exchange_rate);
    return Number.isFinite(exchangeRate) && exchangeRate > 0;
}

export function getProposalDisplayCurrency(product: Pick<DealProduct, 'is_usd' | 'present_in_usd' | 'exchange_rate'>): ProposalDisplayCurrency {
    return product.is_usd === true && product.present_in_usd === true && hasValidProposalExchangeRate(product) ? 'USD' : 'BRL';
}

export function getProposalDisplayUnitPrice(product: Pick<DealProduct, 'unit_price' | 'is_usd' | 'present_in_usd' | 'exchange_rate'>): number {
    const unitPrice = Number(product.unit_price) || 0;

    if (getProposalDisplayCurrency(product) === 'USD') {
        return unitPrice / Number(product.exchange_rate);
    }

    return unitPrice;
}

export function normalizeProposalQuantity(quantity?: number | string | null): number {
    if (quantity === undefined || quantity === null || quantity === '') return 1;

    const normalizedQuantity = Number(quantity);
    return Number.isFinite(normalizedQuantity) ? normalizedQuantity : 1;
}

export function getProposalDisplaySubtotal(product: Pick<DealProduct, 'unit_price' | 'quantity' | 'is_usd' | 'present_in_usd' | 'exchange_rate'>): number {
    const quantity = normalizeProposalQuantity(product.quantity);
    return getProposalDisplayUnitPrice(product) * quantity;
}

export function buildProposalDisplayItem(product: DealProduct): ProposalDisplayItem {
    const currency = getProposalDisplayCurrency(product);
    const unitPrice = getProposalDisplayUnitPrice(product);
    const quantity = normalizeProposalQuantity(product.quantity);
    const subtotal = getProposalDisplaySubtotal(product);
    const validExchangeRate = hasValidProposalExchangeRate(product);

    return {
        product,
        currency,
        unitPrice,
        subtotal,
        quantity,
        pricingModel: normalizeProposalPricingModel(product.pricing_model),
        validExchangeRate,
        usdFallbackToBrl: product.present_in_usd === true && (product.is_usd !== true || !validExchangeRate),
    };
}

export function getProposalDisplayCurrencyTotals(
    items: ProposalDisplayItem[],
    totalLabel: string
): ProposalDisplayCurrencyTotal[] {
    const currencies = Array.from(new Set(items.map(item => item.currency)));

    return currencies.map(currency => ({
        currency,
        subtotal: items
            .filter(item => item.currency === currency)
            .reduce((acc, item) => acc + item.subtotal, 0),
        totalLabel: `${totalLabel} ${currency}`,
    }));
}

export function buildProposalDisplayGroups(products: DealProduct[]): ProposalDisplayPricingGroup[] {
    return PROPOSAL_PRICING_MODELS.map(pricingModel => {
        const labels = PROPOSAL_PRICING_LABELS[pricingModel];
        const items = products
            .filter(product => normalizeProposalPricingModel(product.pricing_model) === pricingModel)
            .map(buildProposalDisplayItem);

        return {
            pricingModel,
            title: labels.title,
            totalLabel: labels.totalLabel,
            items,
            totals: getProposalDisplayCurrencyTotals(items, labels.totalLabel),
        };
    }).filter(group => group.items.length > 0);
}

export function formatProposalDisplayCurrency(value: number, currency: ProposalDisplayCurrency): string {
    const safeValue = Number.isFinite(value) ? value : 0;

    if (currency === 'USD') {
        return `US$ ${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(safeValue)}`;
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(safeValue).replace(/\u00A0/g, ' ');
}
