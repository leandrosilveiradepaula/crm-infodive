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

export function mergeDealProductCurrencyFields(
    current: DealProductCurrencyPayloadSource,
    updates: DealProductCurrencyPayloadSource,
) {
    const hasOwn = (key: keyof DealProductCurrencyPayloadSource) =>
        Object.prototype.hasOwnProperty.call(updates, key);

    return normalizeDealProductCurrencyFields({
        is_usd: hasOwn('is_usd') ? updates.is_usd : current.is_usd,
        usd_cost: hasOwn('usd_cost') ? updates.usd_cost : current.usd_cost,
        exchange_rate: hasOwn('exchange_rate') ? updates.exchange_rate : current.exchange_rate,
        present_in_usd: hasOwn('present_in_usd') ? updates.present_in_usd : current.present_in_usd,
    });
}
