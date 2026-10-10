import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('invoice partial-persistence UX contract', () => {
    it('keeps the upload detail modal from hiding a partially persisted invoice', () => {
        const source = readFileSync('src/components/sales/SalesOrderDetails.tsx', 'utf8');
        expect(source).toContain("'partialSuccess' in result && result.partialSuccess");
        expect(source).toContain('Verifique antes de reenviar');
        expect(source).toContain('onUpdate();');
    });

    it('refreshes the orders table after a partial invoice write and warns the operator', () => {
        const source = readFileSync('src/app/(dashboard)/sales/tabs/OrdersTab.tsx', 'utf8');
        expect(source).toContain("'partialSuccess' in result && result.partialSuccess");
        expect(source).toContain('toast.warning(result.error');
        expect(source).toContain('await onReload();');
    });

    it('preserves read-only preview in the server action', () => {
        const source = readFileSync('src/app/(dashboard)/sales/actions.ts', 'utf8');
        expect(source).toContain('if (!confirmSave)');
        expect(source).toContain('saved: false, extractedData, fileUrl: null');
        expect(source).toContain("storage.from('documents').remove([fileName])");
    });
});
