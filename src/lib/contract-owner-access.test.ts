import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { ContractService } from '../services/ContractService';

type Outcome = { data: unknown; error: unknown };
type Call = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
function fixture(outcomes: Record<string, Outcome>) {
    const calls: Call[] = [];
    const from = vi.fn((table: string) => {
        const call: Call = { table, mode: 'read', filters: [] }; calls.push(call);
        const q = {
            select() { return q; },
            then(resolve: (value: Outcome) => unknown, reject?: (reason: unknown) => unknown) {
                return Promise.resolve(outcomes[table + ':' + call.mode] ?? outcomes[table] ?? { data: [], error: null })
                    .then(resolve, reject);
            },
            eq(k: string, v: unknown) { call.filters.push([k, v]); return q; },
            in(k: string, v: unknown) { call.filters.push([k, v]); return q; },
            order() { return table === 'contracts' ? q : Promise.resolve(outcomes[table + ':' + call.mode] ?? outcomes[table] ?? { data: [], error: null }); },
            range(start: number, end: number) {
                const outcome = outcomes[table + ':' + call.mode] ?? outcomes[table] ?? { data: [], error: null };
                return Promise.resolve({ ...outcome, data: Array.isArray(outcome.data) ? outcome.data.slice(start, end + 1) : outcome.data });
            },
            insert(payload: unknown) { call.mode = 'insert'; call.payload = payload; return q; },
            update(payload: unknown) { call.mode = 'update'; call.payload = payload; return q; },
            delete() { call.mode = 'delete'; return q; },
            maybeSingle() { return Promise.resolve(outcomes[table + ':' + call.mode] ?? outcomes[table] ?? { data: null, error: null }); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return calls;
}
const org='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',owner='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',deal='11111111-1111-4111-8111-111111111111',proposal='22222222-2222-4222-8222-222222222222';
describe('contract tenant and owner boundaries', () => {
    beforeEach(() => vi.clearAllMocks());
    it('filters seller reads to owned deal IDs and never broadens an empty scope', async () => {
        let calls = fixture({ deals: {data:[],error:null} });
        expect(await ContractService.getContracts(org, owner)).toEqual([]);
        expect(calls.find(c=>c.table==='contracts')).toBeUndefined();
        calls = fixture({deals:{data:[{id:deal}],error:null},contracts:{data:[],error:null}});
        expect(await ContractService.getContracts(org,owner)).toEqual([]);
        expect(calls.find(c=>c.table==='contracts')?.filters).toContainEqual(['deal_id',[deal]]);
        expect(calls.find(c=>c.table==='deals')?.filters).toContainEqual(['owner_id',owner]);
    });
    it('rejects a seller contract for a deal not owned by that seller', async () => {
        const calls=fixture({deals:{data:null,error:null}});
        await expect(ContractService.createContract(org,{title:'Contrato',dealId:deal},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
    });
    it('rejects a proposal linked to a different deal', async () => {
        const calls=fixture({deals:{data:{id:deal},error:null},proposals:{data:null,error:null}});
        await expect(ContractService.createContract(org,{title:'Contrato',company:'ACME',dealId:deal,proposalId:proposal},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
        expect(calls.find(c=>c.table==='proposals')?.filters).toContainEqual(['deal_id',deal]);
    });
    it('refuses edits to a contract not owned by the caller', async () => {
        const calls=fixture({contracts:{data:{id:'33333333-3333-4333-8333-333333333333',deal_id:deal,proposal_id:null},error:null},deals:{data:null,error:null}});
        await expect(ContractService.updateContract(org,'33333333-3333-4333-8333-333333333333',{status:'signed'},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('guards authorized deletes by original deal link and demands a DB receipt', async () => {
        const calls=fixture({contracts:{data:{id:'33333333-3333-4333-8333-333333333333',deal_id:deal,proposal_id:null,status:'draft'},error:null},deals:{data:{id:deal},error:null},'contracts:delete':{data:null,error:null}});
        await expect(ContractService.deleteContract(org,'33333333-3333-4333-8333-333333333333',owner)).rejects.toThrow();
        const deletion=calls.find(c=>c.mode==='delete');
        expect(deletion?.filters).toContainEqual(['organization_id',org]);
        expect(deletion?.filters).toContainEqual(['deal_id',deal]);
        expect(deletion?.filters).toContainEqual(['status','draft']);
    });
    it('never exposes deal options outside the authenticated seller scope', async () => {
        const calls = fixture({ deals: { data: [{ id: deal, title: 'Oportunidade A', company: 'Cliente A' }], error: null } });
        await expect(ContractService.getOwnedContractDealOptions(org, owner)).resolves.toEqual([
            { id: deal, title: 'Oportunidade A', company: 'Cliente A' }
        ]);
        const query = calls.find(call => call.table === 'deals');
        expect(query?.filters).toContainEqual(['organization_id', org]);
        expect(query?.filters).toContainEqual(['owner_id', owner]);
    });
    it('rejects a failed eligible deal query instead of inventing an empty choice list', async () => {
        fixture({ deals: { data: null, error: null } });
        await expect(ContractService.getOwnedContractDealOptions(org, owner)).rejects.toThrow();
    });
    it('rejects contracts with missing required company before the database write', async () => {
        const calls = fixture({});
        await expect(ContractService.createContract(org, {title: 'Rascunho'})).rejects.toThrow();
        await expect(ContractService.createContract(org, {title: 'Rascunho', company: '   '})).rejects.toThrow();
        expect(calls.find(call => call.mode === 'insert')).toBeUndefined();
    });
    it('refuses legacy signature fields or signed status before any write', async () => {
        const calls = fixture({});
        await expect(ContractService.createContract(org, {title:'A',company:'ACME',status:'signed'})).rejects.toThrow();
        await expect(ContractService.createContract(org, {title:'A',company:'ACME',signerName:'Claimed signer'})).rejects.toThrow();
        await expect(ContractService.updateContract(org, '77777777-7777-4777-8777-777777777777', {signature_image:'data:image/png;base64,AA=='})).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert'||c.mode==='update')).toBeUndefined();
    });
    it('saves a tenant-owned draft against an exact revision and demands matching receipt', async () => {
        const revision = '2026-10-13T10:00:00.000Z';
        const calls = fixture({
            contracts: {data:{id:'44444444-4444-4444-8444-444444444444',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:{id:'44444444-4444-4444-8444-444444444444'},error:null}
        });
        await expect(ContractService.updateContract(org,'44444444-4444-4444-8444-444444444444',{title:'Novo texto',content_json:{text:'Termos'}},owner,revision)).resolves.toEqual({id:'44444444-4444-4444-8444-444444444444'});
        const write = calls.find(c=>c.mode==='update');
        expect(write?.filters).toContainEqual(['organization_id',org]);
        expect(write?.filters).toContainEqual(['status','draft']);
        expect(write?.filters).toContainEqual(['deal_id',deal]);
        expect(write?.filters).toContainEqual(['updated_at',revision]);
    });
    it('fails closed on stale revision, missing receipt, forged receipt or malformed timestamp', async () => {
        let calls = fixture({
            contracts: {data:{id:'44444444-4444-4444-8444-444444444444',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:null,error:null}
        });
        await expect(ContractService.updateContract(org,'44444444-4444-4444-8444-444444444444',{title:'Atualização'},owner,'2026-10-13T10:00:00Z')).rejects.toThrow();
        expect(calls.some(c=>c.mode==='update')).toBe(true);
        calls = fixture({
            contracts: {data:{id:'44444444-4444-4444-8444-444444444444',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:{id:'66666666-6666-4666-8666-666666666666'},error:null}
        });
        await expect(ContractService.updateContract(org,'44444444-4444-4444-8444-444444444444',{title:'Atualização'},owner,'2026-10-13T10:00:00Z')).rejects.toThrow();
        calls = fixture({});
        await expect(ContractService.updateContract(org,'44444444-4444-4444-8444-444444444444',{title:'Atualização'},owner,'invalid-date')).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('rejects changes to legacy non-drafts without writing', async () => {
        const calls = fixture({contracts:{data:{id:'55555555-5555-4555-8555-555555555555',deal_id:deal,proposal_id:null,status:'signed'},error:null}});
        await expect(ContractService.updateContract(org,'55555555-5555-4555-8555-555555555555',{title:'Alteração'},undefined,'2026-10-13T10:00:00Z')).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('rejects malformed owned deal ID responses without silently hiding contracts', async () => {
        fixture({deals:{data:[{id:'not-a-uuid'}],error:null}});
        await expect(ContractService.getContracts(org,owner)).rejects.toThrow();
    });
    it('rejects privileged contracts from a different tenant or with malformed shape', async () => {
        const wrongTenant={id:'88888888-8888-4888-8888-888888888888',organization_id:'99999999-9999-4999-8999-999999999999',title:'A',company_name:'ACME',status:'draft',type:'service'};
        fixture({contracts:{data:[wrongTenant],error:null}});
        await expect(ContractService.getContracts(org)).rejects.toThrow();
        fixture({contracts:{data:[{...wrongTenant,organization_id:org,title:null}],error:null}});
        await expect(ContractService.getContracts(org)).rejects.toThrow();
    });
    it('rejects a forged creation receipt and a forged deletion receipt', async () => {
        const calls=fixture({'contracts:insert':{data:{id:'invalid'},error:null}});
        await expect(ContractService.createContract(org,{title:'A',company:'ACME'})).rejects.toThrow();
        expect(calls.some(c=>c.mode==='insert')).toBe(true);
        fixture({contracts:{data:{id:'33333333-3333-4333-8333-333333333333',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals:{data:{id:deal},error:null},
            'contracts:delete':{data:{id:'66666666-6666-4666-8666-666666666666'},error:null}});
        await expect(ContractService.deleteContract(org,'33333333-3333-4333-8333-333333333333',owner)).rejects.toThrow();
    });
    it('rejects missing tenant identity before privileged queries', async () => {
        const calls=fixture({});
        await expect(ContractService.getContracts('tenant-a')).rejects.toThrow();
        await expect(ContractService.createContract('tenant-a',{title:'A',company:'ACME'})).rejects.toThrow();
        expect(calls).toHaveLength(0);
    });
    it('reads consecutive pages, orders by timestamp and id, and returns complete rows', async () => {
        const rows = Array.from({length: 205}, (_, i) => ({
            id: `${String(i + 1).padStart(8,'0')}-1111-4111-8111-111111111111`,
            organization_id: org, title: 'Contrato', company_name: 'Cliente',
            status: 'draft', type: 'service'
        }));
        const calls = fixture({contracts:{data:rows,error:null}});
        const result = await ContractService.getContracts(org);
        expect(result).toHaveLength(205);
        expect(calls.filter(c=>c.table==='contracts')).toHaveLength(2);
    });
    it('rejects duplicate or inconsistent pages rather than reporting success', async () => {
        const row = {id:'88888888-8888-4888-8888-888888888888', organization_id:org,
            title:'Contrato', company_name:'Cliente', status:'draft', type:'service'};
        const rows = Array.from({length: 201},()=>row);
        fixture({contracts:{data:rows,error:null}});
        await expect(ContractService.getContracts(org)).rejects.toThrow();
    });
    it('rejects malformed amounts, references, status, and empty edits before any write', async () => {
        const calls=fixture({});
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',value:NaN})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',dealId:'foreign'})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',status:'forged' as never})).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
    });
});
