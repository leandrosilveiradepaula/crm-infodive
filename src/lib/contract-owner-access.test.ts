import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('./supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { ContractService } from '../services/ContractService';

type Outcome = { data: any; error: any };
type Call = { table: string; mode: string; filters: [string, unknown][]; payload?: unknown };
function fixture(outcomes: Record<string, Outcome>) {
    const calls: Call[] = [];
    const from = vi.fn((table: string) => {
        const call: Call = { table, mode: 'read', filters: [] }; calls.push(call);
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { call.filters.push([k, v]); return q; },
            in(k: string, v: unknown) { call.filters.push([k, v]); return q; },
            order() { return Promise.resolve(outcomes[table + ':' + call.mode] ?? outcomes[table] ?? { data: [], error: null }); },
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
const org='tenant-a',owner='seller-a',deal='11111111-1111-4111-8111-111111111111',proposal='22222222-2222-4222-8222-222222222222';
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
        await expect(ContractService.createContract(org,{title:'Contrato',dealId:deal,proposalId:proposal},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
        expect(calls.find(c=>c.table==='proposals')?.filters).toContainEqual(['deal_id',deal]);
    });
    it('refuses edits to a contract not owned by the caller', async () => {
        const calls=fixture({contracts:{data:{id:'contract-a',deal_id:deal,proposal_id:null},error:null},deals:{data:null,error:null}});
        await expect(ContractService.updateContract(org,'contract-a',{status:'signed'},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('guards authorized deletes by original deal link and demands a DB receipt', async () => {
        const calls=fixture({contracts:{data:{id:'contract-a',deal_id:deal,proposal_id:null},error:null},deals:{data:{id:deal},error:null},'contracts:delete':{data:null,error:null}});
        await expect(ContractService.deleteContract(org,'contract-a',owner)).rejects.toThrow();
        const deletion=calls.find(c=>c.mode==='delete');
        expect(deletion?.filters).toContainEqual(['organization_id',org]);
        expect(deletion?.filters).toContainEqual(['deal_id',deal]);
    });
    it('rejects malformed amounts, references, status, and empty edits before any write', async () => {
        const calls=fixture({});
        await expect(ContractService.createContract(org,{title:'X',value:NaN})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',dealId:'foreign'})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',status:'forged' as any})).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
    });
});
