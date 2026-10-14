import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { requireSalesOrderSaved } from './sales-order-save-outcome';

describe('sales order status mutation integrity and UX', () => {
    it('accepts only explicit persisted success responses', () => {
        expect(() => requireSalesOrderSaved({ success: true })).not.toThrow();
        expect(() => requireSalesOrderSaved(null)).toThrow('Não foi possível');
        expect(() => requireSalesOrderSaved({ success: false, error: 'Falha no banco.' }))
            .toThrow('Falha no banco.');
    });

    it('never accepts a false success response and avoids making up a saved order', () => {
        expect(() => requireSalesOrderSaved({ success: false })).toThrow('salvar');
    });

    it('checks the returned result before calling the success callback', () => {
        const source = readFileSync('src/components/sales/SalesOrderDetails.tsx', 'utf8');
        const handler = source.slice(source.indexOf('const handleStatusChange'), source.indexOf('const handleFileUpload'));
        expect(handler).toContain('const result = await updateSalesOrder(order.id, updates)');
        expect(handler.indexOf('requireSalesOrderSaved(result)')).toBeLessThan(handler.indexOf('onUpdate()'));
    });

    it('locks overlapping mutations before a React state commit', () => {
        const source = readFileSync('src/components/sales/SalesOrderDetails.tsx', 'utf8');
        expect(source).toContain('const savingRef = useRef(false)');
        expect(source).toContain('if (savingRef.current || uploading) return');
        expect(source).toContain('savingRef.current = true');
        expect(source).toContain('savingRef.current = false');
    });

    it('disables mutation buttons and provides a live saving status', () => {
        const source = readFileSync('src/components/sales/SalesOrderDetails.tsx', 'utf8');
        expect(source).toContain('disabled={loading || uploading}');
        expect(source).toContain('role="status"');
        expect(source).toContain('Salvando alterações...');
    });

    it('shows a controlled failure without closing the detail dialog', () => {
        const source = readFileSync('src/components/sales/SalesOrderDetails.tsx', 'utf8');
        const handler = source.slice(source.indexOf('const handleStatusChange'), source.indexOf('const handleFileUpload'));
        expect(handler).toContain('toast.error(');
        expect(handler).toContain('Verifique antes de tentar novamente');
        expect(handler).toContain('finally');
    });
});
