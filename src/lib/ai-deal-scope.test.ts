import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({ createAdminClient: vi.fn() }));
vi.mock('./supabase/admin',()=>({createAdminClient:mocks.createAdminClient}));
import { getAiDealScope } from './ai-deal-scope';

function stub(profile: unknown, error: unknown = null) {
    const filters: Array<[string,unknown]> = [];
    const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((column: string,value:unknown)=>{filters.push([column,value]);return query;}),
        maybeSingle: vi.fn(async()=>({data:profile,error})),
    };
    const from=vi.fn(()=>query);
    mocks.createAdminClient.mockReturnValue({from});
    return {filters,from};
}
const actor='actor',org='tenant';
describe('AI context permission and tenant boundary',()=>{
    beforeEach(()=>vi.clearAllMocks());
    it('allows tenant admins and managers full deal visibility',async()=>{
        const q=stub({role:'manager',roles:[],status:'active'});
        await expect(getAiDealScope(actor,org)).resolves.toEqual({canViewAll:true});
        expect(q.from).toHaveBeenCalledWith('profiles');
        expect(q.filters).toContainEqual(['id',actor]);
        expect(q.filters).toContainEqual(['organization_id',org]);
    });
    it('scopes active sellers to their own deals',async()=>{
        stub({role:'vendedor',roles:[],status:'active'});
        await expect(getAiDealScope(actor,org)).resolves.toEqual({canViewAll:false});
    });
    it('denies support and unknown roles from deal context',async()=>{
        for(const role of ['support','unknown']){
            stub({role,roles:[],status:'active'});
            await expect(getAiDealScope(actor,org)).rejects.toThrow('Forbidden');
        }
    });
    it('fails closed on missing, deactivated and unreadable profiles',async()=>{
        for(const [profile,error] of [
            [null,null],[{role:'admin',status:'inactive'},null],[null,{message:'DB down'}],
        ] as const){
            stub(profile,error);
            await expect(getAiDealScope(actor,org)).rejects.toThrow('Unauthorized');
        }
    });
});
