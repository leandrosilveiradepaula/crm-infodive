export interface PresentInUsdFields {
    is_usd?: boolean | null;
    exchange_rate?: number | string | null;
    present_in_usd?: boolean | null;
}

export function hasValidPresentInUsdExchangeRate(product: PresentInUsdFields): boolean {
    const exchangeRate = Number(product.exchange_rate);
    return Number.isFinite(exchangeRate) && exchangeRate > 0;
}

export function normalizePresentInUsdState<T extends PresentInUsdFields>(product: T): T & { present_in_usd: boolean } {
    return {
        ...product,
        present_in_usd: product.is_usd === true && hasValidPresentInUsdExchangeRate(product)
            ? product.present_in_usd === true
            : false,
    };
}
