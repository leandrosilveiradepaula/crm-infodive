import { beforeEach, describe, expect, it, vi } from 'vitest';

const from = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: () => ({ from }),
}));

import { ContractService } from '@/services/ContractService';

type QueryResult = { data: unknown[] | null; error: unknown };

function createQuery(result: QueryResult) {
    const query = {
        select: vi.fn(),
        eq: vi.fn(),
        order: vi.fn(),
        range: vi.fn(),
    };

    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockResolvedValue(result);
    return query;
}

describe('ContractService.getContracts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('limits a vendedor to its organization and deal owner through an inner relationship', async () => {
        const query = createQuery({ data: [], error: null });
        from.mockReturnValue(query);

        await ContractService.getContracts('org-a', 'seller-a', false);

        expect(from).toHaveBeenCalledWith('contracts');
        expect(query.select).toHaveBeenCalledWith('*, deals!inner(owner_id)');
        expect(query.eq).toHaveBeenNthCalledWith(1, 'organization_id', 'org-a');
        expect(query.eq).toHaveBeenNthCalledWith(2, 'deals.owner_id', 'seller-a');
    });

    it('does not add an owner filter for a role with existing view-all authority', async () => {
        const query = createQuery({ data: [], error: null });
        from.mockReturnValue(query);

        await ContractService.getContracts('org-a', null, true);

        expect(query.select).toHaveBeenCalledWith('*');
        expect(query.eq).toHaveBeenCalledTimes(1);
        expect(query.eq).toHaveBeenCalledWith('organization_id', 'org-a');
    });

    it('uses deterministic ordering and global page boundaries beyond one thousand records', async () => {
        const query = createQuery({ data: [], error: null });
        from.mockReturnValue(query);

        await ContractService.getContracts('org-a', null, true, 10, 100);

        expect(query.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
        expect(query.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
        expect(query.range).toHaveBeenCalledWith(1000, 1099);
    });

    it('rejects invalid page limits instead of issuing an unbounded query', async () => {
        await expect(ContractService.getContracts('org-a', null, true, 0, 101))
            .rejects.toThrow('Paginação de contratos inválida.');
        expect(from).not.toHaveBeenCalled();
    });

    it('propagates a database read failure instead of returning a partial collection', async () => {
        const query = createQuery({ data: [{ id: 'partial' }], error: { message: 'read failed' } });
        from.mockReturnValue(query);

        await expect(ContractService.getContracts('org-a', null, true))
            .rejects.toThrow('Não foi possível carregar os contratos.');
    });
});
