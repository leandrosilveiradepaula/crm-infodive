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
        await expect(ContractService.createContract(org,{title:'Contrato',company:'ACME',dealId:deal,proposalId:proposal},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
        expect(calls.find(c=>c.table==='proposals')?.filters).toContainEqual(['deal_id',deal]);
    });
    it('refuses edits to a contract not owned by the caller', async () => {
        const calls=fixture({contracts:{data:{id:'contract-a',deal_id:deal,proposal_id:null},error:null},deals:{data:null,error:null}});
        await expect(ContractService.updateContract(org,'contract-a',{status:'signed'},owner)).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('guards authorized deletes by original deal link and demands a DB receipt', async () => {
        const calls=fixture({contracts:{data:{id:'contract-a',deal_id:deal,proposal_id:null,status:'draft'},error:null},deals:{data:{id:deal},error:null},'contracts:delete':{data:null,error:null}});
        await expect(ContractService.deleteContract(org,'contract-a',owner)).rejects.toThrow();
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
        await expect(ContractService.updateContract(org, 'id', {signature_image:'data:image/png;base64,AA=='})).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert'||c.mode==='update')).toBeUndefined();
    });
    it('saves a tenant-owned draft against an exact revision and demands matching receipt', async () => {
        const revision = '2026-10-13T10:00:00.000Z';
        const calls = fixture({
            contracts: {data:{id:'draft-1',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:{id:'draft-1'},error:null}
        });
        await expect(ContractService.updateContract(org,'draft-1',{title:'Novo texto',content_json:{text:'Termos'}},owner,revision)).resolves.toEqual({id:'draft-1'});
        const write = calls.find(c=>c.mode==='update');
        expect(write?.filters).toContainEqual(['organization_id',org]);
        expect(write?.filters).toContainEqual(['status','draft']);
        expect(write?.filters).toContainEqual(['deal_id',deal]);
        expect(write?.filters).toContainEqual(['updated_at',revision]);
    });
    it('fails closed on stale revision, missing receipt, forged receipt or malformed timestamp', async () => {
        let calls = fixture({
            contracts: {data:{id:'draft-1',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:null,error:null}
        });
        await expect(ContractService.updateContract(org,'draft-1',{title:'Atualização'},owner,'2026-10-13T10:00:00Z')).rejects.toThrow();
        expect(calls.some(c=>c.mode==='update')).toBe(true);
        calls = fixture({
            contracts: {data:{id:'draft-1',deal_id:deal,proposal_id:null,status:'draft'},error:null},
            deals: {data:{id:deal},error:null},
            'contracts:update': {data:{id:'other'},error:null}
        });
        await expect(ContractService.updateContract(org,'draft-1',{title:'Atualização'},owner,'2026-10-13T10:00:00Z')).rejects.toThrow();
        calls = fixture({});
        await expect(ContractService.updateContract(org,'draft-1',{title:'Atualização'},owner,'invalid-date')).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('rejects changes to legacy non-drafts without writing', async () => {
        const calls = fixture({contracts:{data:{id:'historic',deal_id:deal,proposal_id:null,status:'signed'},error:null}});
        await expect(ContractService.updateContract(org,'historic',{title:'Alteração'},undefined,'2026-10-13T10:00:00Z')).rejects.toThrow();
        expect(calls.find(c=>c.mode==='update')).toBeUndefined();
    });
    it('rejects malformed amounts, references, status, and empty edits before any write', async () => {
        const calls=fixture({});
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',value:NaN})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',dealId:'foreign'})).rejects.toThrow();
        await expect(ContractService.createContract(org,{title:'X',company:'ACME',status:'forged' as never})).rejects.toThrow();
        expect(calls.find(c=>c.mode==='insert')).toBeUndefined();
    });
});
