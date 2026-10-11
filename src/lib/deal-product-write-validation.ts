/** Safeguards for writes through the privileged deal-product service. */
export function validateDealProductWrite(input: unknown, creating: boolean): void {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Dados do produto da oportunidade inválidos.');
    }
    const value = input as Record<string, unknown>;
    if ((creating || value.name !== undefined) &&
        (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 240)) {
        throw new Error('Nome do produto inválido.');
    }
    for (const field of ['unit_price', 'cost', 'usd_cost', 'exchange_rate']) {
        const v = value[field];
        if (v !== undefined && v !== null &&
            (typeof v !== 'number' || !Number.isFinite(v) || v < 0)) {
            throw new Error('Valor numérico do produto inválido.');
        }
    }
    // A commercial margin may legitimately be negative. Reject only non-finite values.
    const margin = value.margin;
    if (margin !== undefined && margin !== null &&
        (typeof margin !== 'number' || !Number.isFinite(margin))) {
        throw new Error('Margem do produto inválida.');
    }
    const quantity = value.quantity;
    if (quantity !== undefined && (typeof quantity !== 'number' ||
        !Number.isInteger(quantity) || quantity <= 0)) {
        throw new Error('Quantidade do produto inválida.');
    }
    const position = value.display_order;
    if (position !== undefined && (!Number.isInteger(position) ||
        typeof position !== 'number' || position < 0)) {
        throw new Error('Ordenação do produto inválida.');
    }
    for (const ref of ['product_id', 'distributor_id']) {
        const v = value[ref];
        if (v !== undefined && v !== null && v !== '' &&
            (typeof v !== 'string' || !v.trim() || v.length > 128)) {
            throw new Error('Referência do produto inválida.');
        }
    }
}
