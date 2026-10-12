import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { DealService } from './DealService';

type Result = { data: unknown; error: { message: string } | null };
type Operation = {
    table: string;
    action: 'read' | 'insert' | 'update';
    filters: Array<[string, unknown]>;
    payload?: Record<string, unknown> | Record<string, unknown>[];
};
function fakeDb(overrides: Record<string, Result> = {}) {
    const ops: Operation[] = [];
    const from = vi.fn((table: string) => {
        const op: Operation = { table, action: 'read', filters: [] };
        ops.push(op);
        const dataFor = (): Result => {
            const overridden = overrides[table + ':' + op.action] ?? overrides[table];
            if (overridden) return overridden;
            if (table === 'profiles') {
                return { data: { id: 'actor-a', role: 'manager', roles: [], status: 'active' }, error: null };
            }
            if (table === 'accounts') return { data: { id: 'account-a' }, error: null };
            return { data: { id: 'deal-a', ...(op.action === 'update' ? op.payload as object : {}) }, error: null };
        };
        const query = {
            select() { return query; },
            eq(key: string, value: unknown) { op.filters.push([key, value]); return query; },
            insert(payload: Record<string, unknown>[]) { op.action = 'insert'; op.payload = payload; return query; },
            update(payload: Record<string, unknown>) { op.action = 'update'; op.payload = payload; return query; },
            maybeSingle() { return Promise.resolve(dataFor()); },
            single() { return Promise.resolve(dataFor()); },
        };
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}

describe('deal write and stage integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects empty titles and non-finite amounts before privileged database access', async () => {
        const x = fakeDb();
        await expect(DealService.createDeal('actor-a', 'tenant-a', { title: ' ' })).rejects.toThrow();
        await expect(DealService.createDeal('actor-a', 'tenant-a', { title: 'Valid', value: Infinity })).rejects.toThrow();
        await expect(DealService.createDeal('actor-a', 'tenant-a', { title: 'Valid', probability: -1 })).rejects.toThrow();
        expect(x.from).not.toHaveBeenCalled();
    });

    it('preserves zero-valued probabilities and amounts when creating a deal', async () => {
        const x = fakeDb();
        await expect(DealService.createDeal('actor-a', 'tenant-a', {
            title: 'Nova oportunidade', value: 0, probability: 0,
        })).resolves.toMatchObject({ id: 'deal-a' });
        const op = x.ops.find(row => row.table === 'deals' && row.action === 'insert');
        expect(op?.payload).toEqual([expect.objectContaining({
            value: 0, probability: 0, owner_id: 'actor-a', organization_id: 'tenant-a',
        })]);
    });

    it('rejects foreign account references on create and update before writes', async () => {
        const x = fakeDb({ accounts: { data: null, error: null } });
        await expect(DealService.createDeal('actor-a', 'tenant-a', {
            title: 'Valid', account_id: 'other-tenant-account',
        })).rejects.toThrow('Conta não encontrada');
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            account_id: 'other-tenant-account',
        })).rejects.toThrow('Conta não encontrada');
        expect(x.ops.some(row => row.action === 'insert' || row.action === 'update')).toBe(false);
        expect(x.ops.filter(row => row.table === 'accounts')
            .every(row => row.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-a')))
            .toBe(true);
    });

    it('refuses empty, unexpected-only, and invalid financial updates', async () => {
        const x = fakeDb();
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {})).rejects.toThrow();
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            organization_id: 'other-tenant',
        } as never)).rejects.toThrow();
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            commission_deduction: Number.NaN,
        })).rejects.toThrow();
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            probability: 101,
        })).rejects.toThrow();
        expect(x.ops.every(row => row.action === 'read')).toBe(true);
    });

    it('requires an active tenant owner for reassignment', async () => {
        const x = fakeDb({ profiles: { data: { id: 'owner-b', status: 'inactive', role: 'manager', roles: [] }, error: null } });
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            owner_id: 'owner-b',
        })).rejects.toThrow('responsável');
        expect(x.ops.some(row => row.action === 'update')).toBe(false);
        expect(x.ops.filter(row => row.table === 'profiles')
            .every(row => row.filters.some(([key, value]) => key === 'organization_id' && value === 'tenant-a')))
            .toBe(true);
    });

    it('rejects malformed stage and out-of-range probability before mutation', async () => {
        const x = fakeDb();
        await expect(DealService.updateDealStage('actor-a', 'deal-a', 'tenant-a', '')).rejects.toThrow();
        await expect(DealService.updateDealStage('actor-a', 'deal-a', 'tenant-a', 'proposal', 150)).rejects.toThrow();
        expect(x.from).not.toHaveBeenCalled();
    });

    it('fails closed when stage update affects no row', async () => {
        const x = fakeDb({ 'deals:update': { data: null, error: null } });
        await expect(DealService.updateDealStage('actor-a', 'deal-a', 'tenant-a', 'won')).rejects.toThrow();
        const op = x.ops.find(row => row.table === 'deals' && row.action === 'update');
        expect(op?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(op?.payload).toMatchObject({ stage: 'won', probability: 100 });
    });

    it('fails closed when updateDeal returns no matching row', async () => {
        fakeDb({ 'deals:update': { data: null, error: null } });
        await expect(DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            description: 'Valid description',
        })).rejects.toThrow('Não foi possível atualizar');
    });

    it('does not leave stale closure timestamps after a stage move', async () => {
        const x = fakeDb();
        await DealService.updateDealStage('actor-a', 'deal-a', 'tenant-a', 'qualification', 30);
        const op = x.ops.find(row => row.table === 'deals' && row.action === 'update');
        expect(op?.payload).toMatchObject({
            stage: 'qualification', probability: 30, won_at: null, lost_at: null,
        });
    });

    it('uses canonical closure state when creating a Won deal', async () => {
        const x = fakeDb();
        await DealService.createDeal('actor-a', 'tenant-a', {
            title: 'Ganha', stage: 'won', probability: 25,
        });
        const op = x.ops.find(row => row.table === 'deals' && row.action === 'insert');
        expect(op?.payload).toEqual([expect.objectContaining({
            stage: 'won', probability: 100, lost_at: null,
            won_at: expect.any(String),
        })]);
    });

    it('enforces canonical closure state via ordinary deal editing', async () => {
        const x = fakeDb();
        await DealService.updateDeal('actor-a', 'deal-a', 'tenant-a', {
            stage: 'lost', probability: 80, won_at: 'forged', lost_at: 'forged',
        });
        const op = x.ops.find(row => row.table === 'deals' && row.action === 'update');
        expect(op?.payload).toMatchObject({
            stage: 'lost', probability: 0, won_at: null,
            lost_at: expect.any(String),
        });
    });

});
