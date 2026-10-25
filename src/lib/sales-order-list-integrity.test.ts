import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { salesOrderMatchesFilter, validateSalesOrderList } from './sales-order-list-integrity';

const order = {
    id: 'order-a', created_at: '2026-10-10T10:00:00Z',
    status: 'pedido_gerado', total_value: 100,
};
describe('sales order list fail-closed UX contract', () => {
    it('keeps a legitimate empty list distinct from malformed response', () => {
        expect(validateSalesOrderList([])).toEqual([]);
        expect(() => validateSalesOrderList(null)).toThrow('indisponível');
        expect(() => validateSalesOrderList({ rows: [] })).toThrow('indisponível');
    });

    it('rejects null rows, invalid status, missing IDs or dates and nonnumeric totals', () => {
        for (const value of [null, {}, { ...order, id: '' }, { ...order, status: 'wrong' },
            { ...order, created_at: 'yesterday' }, { ...order, total_value: 'not-a-number' }]) {
            expect(() => validateSalesOrderList([value])).toThrow('inválido');
        }
    });

    it('accepts finite numeric totals without showing stringly-typed or fake zero values', () => {
        const normalized = validateSalesOrderList([{ ...order, total_value: '120.50' }]);
        expect(normalized[0].total_value).toBe(120.5);
        expect(() => validateSalesOrderList([{ ...order, total_value: null }])).toThrow('inválido');
        expect(() => validateSalesOrderList([{ ...order, total_value: Number.POSITIVE_INFINITY }]))
            .toThrow('inválido');
    });

    it('searches safely when deal and customer fields are absent or null', () => {
        const normalized = validateSalesOrderList([{ ...order, deal: { title: null, customer: null } }]);
        expect(salesOrderMatchesFilter(normalized[0], 'ORDER-A', 'all')).toBe(true);
        expect(salesOrderMatchesFilter(normalized[0], 'qualquer cliente', 'all')).toBe(false);
    });

    it('matches customer/title text case-insensitively while respecting status', () => {
        const [data] = validateSalesOrderList([{ ...order, deal: { title: 'Projeto Piloto',
            customer: { name: 'Infodive' } } }]);
        expect(salesOrderMatchesFilter(data, 'infodive', 'pedido_gerado')).toBe(true);
        expect(salesOrderMatchesFilter(data, 'PROJETO', 'all')).toBe(true);
        expect(salesOrderMatchesFilter(data, 'Projeto', 'entregue')).toBe(false);
    });

    it('renders explicit failure, retry and stale-request protection instead of fake zero metrics', () => {
        const source = readFileSync('src/components/sales/SalesOrderList.tsx', 'utf8');
        expect(source).toContain('const version = ++loadVersion.current');
        expect(source).toContain('version === loadVersion.current');
        expect(source).toContain("setError('Falha ao carregar os pedidos. Tente novamente.')");
        expect(source).toContain('role="alert"');
        expect(source).toContain('Tentar novamente');
        expect(source).toContain("error ? '—' : orders.filter");
    });
});
