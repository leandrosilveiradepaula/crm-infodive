import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ from: vi.fn(), requireSessionContext: vi.fn() }));
vi.mock('../src/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: mock.from }) }));
vi.mock('../src/lib/auth-server', () => ({ requireSessionContext: mock.requireSessionContext }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { ContractService } from '../src/services/ContractService';
import { getContracts } from '../src/app/(dashboard)/contracts/actions';

const ORG = 'org-a', OTHER = 'org-b', OWNER = 'seller-a', OTHER_OWNER = 'seller-b';
const row = (id: string, org = ORG, owner = OWNER, dealOrg = org) => ({
    id, organization_id: org, title: id, created_at: '2026-11-01T00:00:00Z',
    deals: { owner_id: owner, organization_id: dealOrg },
});
type Row = ReturnType<typeof row>;

function collection(rows: Row[], options: { serverCap?: number; failAt?: number; duplicateAt?: number; countChangeAt?: number; emptyAt?: number } = {}) {
    const queries: any[] = [];
    const from = vi.fn(() => {
        const filters: [string, unknown][] = [];
        const query: any = {
            select: vi.fn(() => query),
            eq: vi.fn((column: string, value: unknown) => { filters.push([column,value]); return query; }),
            order: vi.fn(() => query),
            range: vi.fn(async (start: number, end: number) => {
                const selected = rows.filter(r => filters.every(([column,value]) =>
                    column === 'organization_id' ? r.organization_id === value :
                    column === 'deals.organization_id' ? r.deals?.organization_id === value :
                    column === 'deals.owner_id' ? r.deals?.owner_id === value : false));
                const data = selected.slice(start, Math.min(end+1, start+(options.serverCap??100)));
                if (options.failAt === start) return { data, count: selected.length, error: { message: 'offline' } };
                if (options.duplicateAt === start && data.length) data[0] = selected[0];
                return { data: options.emptyAt === start ? [] : data,
                    count: selected.length + (options.countChangeAt === start ? 1 : 0), error: null };
            }),
        };
        queries.push(query);
        return query;
    });
    return { from, queries };
}
function fixtureProfile(role: string, organization_id = ORG, status = 'active') {
    const q: any = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        maybeSingle: vi.fn(async () => ({ data: { role, status, organization_id }, error: null })),
    };
    return q;
}
describe('CRM #209 complete tenant and owner-safe contract listing', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mock.requireSessionContext.mockResolvedValue({ userId: OWNER, organizationId: ORG });
    });

    it('loads every authorized page even past 1000 rows, including a smaller backend row cap', async () => {
        const rows = Array.from({length: 1251}, (_, i) => row('contract-' + i));
        const { from, queries } = collection([...rows, row('other-owner', ORG, OTHER_OWNER),
            row('other-tenant', OTHER), row('cross-tenant-deal', ORG, OWNER, OTHER)], {serverCap: 73});
        mock.from.mockImplementation(from);
        const result = await ContractService.getContracts(ORG, OWNER, false);
        expect(result.map(r => r.id)).toEqual(rows.map(r => r.id));
        expect(queries.length).toBeGreaterThan(13);
        expect(queries[1].range).toHaveBeenCalledWith(73,172);
        for (const query of queries) {
            expect(query.select).toHaveBeenCalledWith('*, deals!inner(owner_id,organization_id)', {count:'exact'});
            expect(query.eq.mock.calls).toEqual([['organization_id',ORG],['deals.organization_id',ORG],['deals.owner_id',OWNER]]);
            expect(query.order.mock.calls).toEqual([['created_at',{ascending:false,nullsFirst:false}],['id',{ascending:false}]]);
        }
    });

    it('keeps organization-wide authority for admin/manager and never exposes another tenant', async () => {
        const unlinked = {...row('unlinked'), deals: null} as unknown as Row;
        const rows = [row('owned'), row('other-owner', ORG, OTHER_OWNER), unlinked, row('foreign',OTHER)];
        const {from,queries} = collection(rows);
        mock.from.mockImplementation(from);
        expect((await ContractService.getContracts(ORG,null,true)).map(r=>r.id)).toEqual(['owned','other-owner','unlinked']);
        expect(queries[0].eq.mock.calls).toEqual([['organization_id',ORG]]);
        expect((await ContractService.getContracts(ORG,OWNER,false)).map(r=>r.id)).toEqual(['owned']);
    });

    it.each([{failAt:100},{duplicateAt:100},{countChangeAt:100},{emptyAt:100}])(
        'fails explicitly instead of returning a partial or inconsistent collection (%j)', async options => {
            const {from} = collection(Array.from({length: 210},(_,i)=>row('row-'+i)),options);
            mock.from.mockImplementation(from);
            await expect(ContractService.getContracts(ORG, OWNER, false)).rejects.toThrow();
        });
    it('rejects a missing owner before querying and rejects foreign rows from an inconsistent backend', async () => {
        await expect(ContractService.getContracts(ORG,null,false)).rejects.toThrow();
        expect(mock.from).not.toHaveBeenCalled();
        const q:any = {select:vi.fn(()=>q),eq:vi.fn(()=>q),order:vi.fn(()=>q),
            range:vi.fn(async()=>({data:[row('foreign',OTHER)],count:1,error:null}))};
        mock.from.mockReturnValue(q);
        await expect(ContractService.getContracts(ORG, OWNER, false)).rejects.toThrow();
    });

    it.each(['admin','manager','vendedor'])('derives authority for %s from the active server profile, preserving all visible pages', async role => {
        const profile = fixtureProfile(role);
        const rows = Array.from({length: 1251}, (_,i)=>row('contract-'+i));
        const {from,queries} = collection([...rows,row('colleague',ORG,OTHER_OWNER),row('foreign',OTHER)]);
        mock.from.mockImplementation(table => table==='profiles'?profile:from());
        const contracts = await getContracts();
        expect(contracts).toHaveLength(role==='vendedor'?1251:1252);
        expect(profile.eq.mock.calls).toEqual([['id',OWNER],['organization_id',ORG]]);
        expect(queries[0].eq.mock.calls).toEqual(role==='vendedor'?
            [['organization_id',ORG],['deals.organization_id',ORG],['deals.owner_id',OWNER]]:[['organization_id',ORG]]);
        expect(contracts.some(c=>c.id==='foreign')).toBe(false);
    });

    it.each([['support',ORG,'active'],['unknown',ORG,'active'],['admin',OTHER,'active'],['admin',ORG,'inactive']])(
        'denies unapproved or revoked authority before contract data is requested', async(role,org,status) => {
            mock.from.mockReturnValue(fixtureProfile(role,org,status));
            await expect(getContracts()).rejects.toThrow('Não foi possível carregar os contratos.');
            expect(mock.from.mock.calls).toEqual([['profiles']]);
        });
    it('does not query anything without a valid authenticated session', async()=>{
        mock.requireSessionContext.mockRejectedValue(new Error('Unauthorized'));
        await expect(getContracts()).rejects.toThrow();
        expect(mock.from).not.toHaveBeenCalled();
    });
});
