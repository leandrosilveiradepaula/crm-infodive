export interface DealProductCurrencyPayloadSource {
    is_usd?: boolean | null;
    usd_cost?: number | null;
    exchange_rate?: number | null;
    present_in_usd?: boolean | null;
}

export function normalizeDealProductCurrencyFields(product: DealProductCurrencyPayloadSource) {
    return {
        is_usd: product.is_usd ?? false,
        usd_cost: product.usd_cost ?? null,
        exchange_rate: product.exchange_rate ?? null,
        present_in_usd: product.present_in_usd ?? false,
    };
}
