/**
 * The Ingram HW workbook has eight product rows (39-46). Never silently drop
 * a customer's products when generating an external distributor order.
 */
export const INGRAM_HW_MAX_PRODUCTS = 8;
export type DistributorProductRow = {
    sku: string;
    quantity: number;
    unitPrice: number;
};

const TEXT_KEYS = [
    'bidNumber', 'paymentTerms', 'dealerName', 'dealerCnpj',
    'userName', 'userCnpj', 'userIe', 'userAddress', 'userNeighborhood',
    'userZip', 'userCity', 'userState', 'userContact', 'userPhone', 'userEmail',
] as const;
const ALLOWED_KEYS = new Set<string>([...TEXT_KEYS, 'billingType', 'products']);
const LEADING_FORMULA = /^[\s]*[=+\-@]/;

export function validateDistributorOrderExtraData(
    extraData: unknown,
): Record<string, unknown> | undefined {
    if (extraData === undefined) return undefined;
    if (!extraData || typeof extraData !== 'object' || Array.isArray(extraData)) {
        throw new Error('Dados do pedido do distribuidor inválidos.');
    }
    const values = extraData as Record<string, unknown>;
    for (const [key, value] of Object.entries(values)) {
        if (!ALLOWED_KEYS.has(key)) {
            throw new Error('Campo de pedido do distribuidor não permitido.');
        }
        if (value === undefined) continue;
        if (key === 'products') {
            if (!Array.isArray(value)) throw new Error('Produtos de pedido inválidos.');
        } else if (key === 'billingType') {
            if (value !== 'reseller' && value !== 'end_user') {
                throw new Error('Modalidade de faturamento inválida.');
            }
        } else if (typeof value !== 'string' || value.length > 500 ||
            LEADING_FORMULA.test(value)) {
            throw new Error('Campo de pedido do distribuidor inválido.');
        }
    }
    return values;
}

export function validateDistributorOrderProducts(rows: unknown): DistributorProductRow[] {
    if (!Array.isArray(rows) || rows.length === 0 ||
        rows.length > INGRAM_HW_MAX_PRODUCTS) {
        throw new Error('O pedido deve conter entre 1 e 8 produtos; a planilha não suporta mais linhas.');
    }
    return rows.map((row: unknown) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
            throw new Error('Produto de pedido inválido.');
        }
        const data = row as Record<string, unknown>;
        if (typeof data.sku !== 'string' || !data.sku.trim() ||
            data.sku.length > 120 || LEADING_FORMULA.test(data.sku) ||
            typeof data.quantity !== 'number' || !Number.isInteger(data.quantity) ||
            data.quantity <= 0 || data.quantity > 100000 ||
            typeof data.unitPrice !== 'number' || !Number.isFinite(data.unitPrice) ||
            data.unitPrice < 0 || data.unitPrice > 1_000_000_000 ||
            !Number.isFinite(data.unitPrice * data.quantity)) {
            throw new Error('Produto com SKU, quantidade ou preço inválidos.');
        }
        return { sku: data.sku.trim(), quantity: data.quantity, unitPrice: data.unitPrice };
    });
}
