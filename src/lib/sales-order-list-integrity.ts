import type { SalesOrder } from '../hooks/useSalesOrders';

const KNOWN_STATES = new Set([
    'pedido_gerado', 'nf_emitida', 'entregue', 'cliente_pagou',
    'distribuidor_pagou', 'comissao_paga',
]);

export function validateSalesOrderList(data: unknown): SalesOrder[] {
    if (!Array.isArray(data)) {
        throw new Error('Lista de pedidos indisponível.');
    }
    return data.map((raw: unknown) => {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('Registro de pedido inválido.');
        }
        const order = raw as Record<string, unknown>;
        const amount = order.total_value;
        const numericValue = typeof amount === 'number' ? amount :
            typeof amount === 'string' && /^-?\d+(?:\.\d+)?$/.test(amount.trim())
                ? Number(amount.trim()) : Number.NaN;
        if (typeof order.id !== 'string' || !order.id.trim() ||
            typeof order.created_at !== 'string' || !Number.isFinite(Date.parse(order.created_at)) ||
            typeof order.status !== 'string' || !KNOWN_STATES.has(order.status) ||
            !Number.isFinite(numericValue)) {
            throw new Error('Registro de pedido inválido.');
        }
        return { ...order, total_value: numericValue } as unknown as SalesOrder;
    });
}

export function salesOrderMatchesFilter(
    order: SalesOrder, search: string, status: string,
): boolean {
    if (status !== 'all' && order.status !== status) return false;
    const needle = search.trim().toLocaleLowerCase('pt-BR');
    if (!needle) return true;
    const fields = [order.id, order.deal?.title, order.deal?.customer?.name];
    return fields.some(field =>
        typeof field === 'string' && field.toLocaleLowerCase('pt-BR').includes(needle));
}
