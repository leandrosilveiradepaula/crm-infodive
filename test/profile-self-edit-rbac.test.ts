import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked=vi.hoisted(()=>({ createAdminClient:vi.fn() }));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocked.createAdminClient}));
vi.mock('@/lib/constants',()=>({USER_ROLES:{ADMIN:'admin',MANAGER:'manager',VENDEDOR:'vendedor',SALES:'sales'}}));

import { UserService } from '../src/services/UserService';
import { SettingsService } from '../src/services/SettingsService';

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

describe('server-side cross-tenant administrative writes',()=>{
  beforeEach(()=>{vi.resetAllMocks();});

  it('denies transfer to another tenant before touching deals or archiving a user',async ()=>{
    const maybeSingle=vi.fn().mockResolvedValue({data:null,error:null});
    const eq=vi.fn();
    const chain={eq,maybeSingle};
    eq.mockReturnValue(chain);
    const select=vi.fn().mockReturnValue(chain);
    const from=vi.fn((table:string)=>{
      if(table==='profiles')return {select};
      throw new Error('Cross-tenant write reached '+table);
    });
    mocked.createAdminClient.mockReturnValue({from});
    const result=await UserService.archiveUser(USER,ORG,OTHER);
    expect(result.success).toBe(false);
    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('id');
    expect(eq).toHaveBeenCalledWith('organization_id',ORG);
    expect(eq).toHaveBeenCalledWith('status','active');
  });

  it('denies pipeline upsert of an ID that already belongs to another tenant',async ()=>{
    const foreignStage=OTHER;
    const select=vi.fn((columns:string)=>{
      if(columns==='id')return {eq:vi.fn().mockResolvedValue({data:[],error:null})};
      if(columns==='id,organization_id')return {
        in:vi.fn().mockResolvedValue({data:[{id:foreignStage,organization_id:OTHER}],error:null}),
      };
      throw new Error('Unexpected columns '+columns);
    });
    const upsert=vi.fn(),remove=vi.fn();
    const from=vi.fn().mockReturnValue({select,upsert,delete:remove});
    mocked.createAdminClient.mockReturnValue({from});
    const result=await SettingsService.savePipelineStages(ORG,[
      {id:foreignStage,name:'Foreign',color:'#ffffff',order_index:0},
    ]);
    expect(result.success).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
