export const PRICING_MODEL_VALUES = ['one_time', 'monthly', 'annual'] as const;

export type PricingModel = typeof PRICING_MODEL_VALUES[number];

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
    one_time: 'Pagamento único',
    monthly: 'Mensal',
    annual: 'Anual',
};

export const PRICING_MODEL_SHORT_LABELS: Record<PricingModel, string> = {
    one_time: 'Único',
    monthly: 'Mensal',
    annual: 'Anual',
};

export function normalizePricingModel(value?: string | null): PricingModel {
    return value === 'monthly' || value === 'annual' ? value : 'one_time';
}

export function getPricingModelLabel(value?: string | null): string {
    return PRICING_MODEL_LABELS[normalizePricingModel(value)];
}

export function getPricingModelShortLabel(value?: string | null): string {
    return PRICING_MODEL_SHORT_LABELS[normalizePricingModel(value)];
}

export function createPricingModelUpdate(productId: string, value?: string | null) {
    return {
        productId,
        field: 'pricing_model' as const,
        value: normalizePricingModel(value),
    };
}

export function withDefaultPricingModel<T extends { pricing_model?: string | null }>(
    product: T
): T & { pricing_model: PricingModel } {
    return {
        ...product,
        pricing_model: normalizePricingModel(product.pricing_model),
    };
}
