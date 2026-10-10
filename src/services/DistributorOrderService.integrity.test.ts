import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getDealDetails: vi.fn(), getOrgSettings: vi.fn(),
}));
vi.mock('./DealService', () => ({ DealService: { getDealDetails: mocks.getDealDetails } }));
vi.mock('./SettingsService', () => ({ SettingsService: { getOrgSettings: mocks.getOrgSettings } }));
import { DistributorOrderService } from './DistributorOrderService';

describe('Ingram order generator rejects incomplete product sheets', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getOrgSettings.mockResolvedValue({ name: 'Infodive' });
        mocks.getDealDetails.mockResolvedValue({
            id: 'deal-a', deal_products: [{ sku: 'SKU-1', name: 'Product', quantity: 1, unit_price: 10 }],
        });
    });

    it('rejects oversized client product overrides before workbook I/O', async () => {
        await expect(DistributorOrderService.generateIngramHWOrder('deal-a', 'tenant-a', {
            products: Array.from({ length: 9 }, (_, i) => ({
                sku: 'SKU-' + i, quantity: 1, unitPrice: 1,
            })),
        })).rejects.toThrow('entre 1 e 8');
        expect(mocks.getOrgSettings).not.toHaveBeenCalled();
    });

    it('rejects oversized persisted deal products before loading the template', async () => {
        mocks.getDealDetails.mockResolvedValue({
            id: 'deal-a',
            deal_products: Array.from({ length: 9 }, (_, i) => ({
                sku: 'SKU-' + i, name: 'Product', quantity: 1, unit_price: 10,
            })),
        });
        await expect(DistributorOrderService.generateIngramHWOrder('deal-a', 'tenant-a'))
            .rejects.toThrow('entre 1 e 8');
        expect(mocks.getOrgSettings).not.toHaveBeenCalled();
    });
});
