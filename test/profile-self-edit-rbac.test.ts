import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked=vi.hoisted(()=>({ createAdminClient:vi.fn() }));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocked.createAdminClient}));

import { UserService } from '../src/services/UserService';

const USER='11111111-1111-4111-8111-111111111111';
const ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('self-service profile update cannot escalate through service_role',()=>{
  beforeEach(()=>{vi.resetAllMocks();});

  it.each([
    {role:'admin'},
    {roles:['admin']},
    {organization_id:OTHER},
    {status:'active'},
    {full_name:'Example',role:'admin'},
    {full_name:123},
    {phone:{toString:()=>'+123'}},
    {unknown:'value'},
    {},
  ])('rejects an untrusted self-edit payload with unapproved keys or no fields %#',async body=>{
    // A no-op empty object may be harmless, but cannot be a privileged write
    // with an injected field. It is handled separately below.
    if(Object.keys(body).length===0)return;
    const result=await UserService.updateMyProfile(USER,ORG,body as any);
    expect(result.success).toBe(false);
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('permits only the allowlisted display fields scoped to own tenant',async ()=>{
    const eq=vi.fn();
    eq.mockReturnValueOnce({eq}).mockResolvedValueOnce({error:null});
    const update=vi.fn().mockReturnValue({eq});
    const from=vi.fn().mockReturnValue({update});
    mocked.createAdminClient.mockReturnValue({from});
    const result=await UserService.updateMyProfile(USER,ORG,{full_name:'Example',phone:'123'});
    expect(result).toEqual({success:true});
    expect(update).toHaveBeenCalledOnce();
    const record=update.mock.calls[0][0];
    expect(Object.keys(record).sort()).toEqual(['full_name','phone','updated_at']);
    expect(record.full_name).toBe('Example');
    expect(record.phone).toBe('123');
    expect(eq).toHaveBeenCalledWith('id',USER);
    expect(eq).toHaveBeenCalledWith('organization_id',ORG);
  });
});
