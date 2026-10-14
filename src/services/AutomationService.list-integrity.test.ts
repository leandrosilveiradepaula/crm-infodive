import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { AutomationService } from './AutomationService';

describe('automation tenant list fail-closed', () => {
    it('distinguishes a malformed null response from a valid empty result', async () => {
        let result: { data: unknown; error: null } = { data: null, error: null };
        const eq = vi.fn().mockImplementation(() => query);
        const order = vi.fn(() => Promise.resolve(result));
        const query = {
            select() { return query; },
            eq,
            order,
        };
        mocks.createAdminClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
        await expect(AutomationService.getAutomations('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as automações');
        expect(eq).toHaveBeenCalledWith('organization_id', 'tenant-a');
        result = { data: [], error: null };
        await expect(AutomationService.getAutomations('user-a', 'tenant-a')).resolves.toEqual([]);
        expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
});