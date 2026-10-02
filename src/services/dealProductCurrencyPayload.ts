export interface DealProductCurrencyPayloadSource {
    is_usd?: boolean | null;
    usd_cost?: number | null;
    exchange_rate?: number | null;
    present_in_usd?: boolean | null;
}

export function hasValidDealProductExchangeRate(value: number | null | undefined): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function normalizeDealProductCurrencyFields(product: DealProductCurrencyPayloadSource) {
    const isUsd = product.is_usd ?? false;
    const exchangeRate = product.exchange_rate ?? null;

    return {
        is_usd: isUsd,
        usd_cost: product.usd_cost ?? null,
        exchange_rate: exchangeRate,
        present_in_usd:
            isUsd === true &&
            hasValidDealProductExchangeRate(exchangeRate) &&
            product.present_in_usd === true,
    };
}
