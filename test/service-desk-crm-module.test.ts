import { beforeEach,describe,expect,it,vi } from 'vitest';

const mocks=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn()}));
vi.mock('../src/lib/auth-server',()=>({requireSessionContext:mocks.session}));
vi.mock('../src/lib/supabase/admin',()=>({createAdminClient:mocks.admin}));
import { createServiceDeskTicket,listServiceDeskTickets,
  transitionServiceDeskTicket,listServiceDeskAccounts,listServiceDeskContracts,
  addServiceDeskComment,recordServiceDeskTime,
  listServiceDeskAttachments,getServiceDeskAttachmentUrl
} from '../src/app/(dashboard)/service-desk/actions';

const USER='11111111-1111-4111-8111-111111111111';
const ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ACCOUNT='aaaaaaaa-1111-4111-8111-111111111111';
const CONTRACT='aaaaaaaa-2222-4222-8222-222222222222';
const TICKET='aaaaaaaa-3333-4333-8333-333333333333';

function setup(profile:unknown={id:USER,role:'support',status:'active',organization_id:ORG}) {
  const maybeSingle=vi.fn().mockResolvedValue({data:profile,error:null});
  const eq=vi.fn().mockReturnThis();
  const limit=vi.fn().mockResolvedValue({data:[{id:ACCOUNT,name:'CRM Account'}],error:null});
  const order=vi.fn().mockReturnValue({limit});
  const select=vi.fn().mockReturnValue({eq,maybeSingle,order,limit});
  const rpc=vi.fn().mockImplementation((name:string)=>{
    if(name==='crm_sd_list_tickets_v1')return Promise.resolve({data:[],error:null});
    if(name==='crm_sd_create_ticket_v1')return Promise.resolve({data:{id:TICKET,ticket_number:1},error:null});
    if(name==='crm_sd_transition_ticket_v1')return Promise.resolve({data:{id:TICKET,status:'open'},error:null});
    if(name==='crm_sd_add_comment_v1')return Promise.resolve({data:{id:CONTRACT,ticket_id:TICKET},error:null});
    if(name==='crm_sd_record_time_v1')return Promise.resolve({data:{id:CONTRACT,ticket_id:TICKET,minutes:15},error:null});
    return Promise.resolve({data:null,error:{message:'unexpected RPC'}});
  });
  const from=vi.fn().mockReturnValue({select});
  const client={from,rpc};
  mocks.admin.mockReturnValue(client);
  return {client,rpc,eq,select,from};
}
describe('CRM-owned Service Desk server authorization',()=>{
  beforeEach(()=>{vi.resetAllMocks();mocks.session.mockResolvedValue({userId:USER,organizationId:ORG});});
  it('uses the current trusted CRM profile, never an input tenant or role',async()=>{
    const {rpc,eq}=setup();
    await createServiceDeskTicket({accountId:ACCOUNT,contractId:CONTRACT,subject:'Falha no backup',priority:'high'});
    expect(eq).toHaveBeenCalledWith('id',USER);
    expect(eq).toHaveBeenCalledWith('organization_id',ORG);
    expect(rpc).toHaveBeenCalledWith('crm_sd_create_ticket_v1',{
      p_actor:USER,p_organization:ORG,p_account:ACCOUNT,p_contract:CONTRACT,
      p_subject:'Falha no backup',p_description:null,p_priority:'high'
    });
  });
  it.each([
    [null], [{id:USER,role:'vendedor',status:'active',organization_id:ORG}],
    [{id:USER,role:'support',status:'inactive',organization_id:ORG}],
    [{id:USER,role:'admin',status:'active',organization_id:OTHER}],
    [{id:USER,role:'__proto__',status:'active',organization_id:ORG}]
  ])('denies absent, revoked, unknown or cross-tenant users',async(profile)=>{
    const {rpc}=setup(profile);
    await expect(listServiceDeskTickets()).rejects.toThrow('Forbidden');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('denies any call when CRM session fails',async()=>{
    mocks.session.mockRejectedValue(new Error('Unauthorized'));
    const {rpc}=setup();
    await expect(listServiceDeskAccounts()).rejects.toThrow('Unauthorized');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects forged client-side account/contract IDs and malformed inputs',async()=>{
    const {rpc}=setup();
    await expect(createServiceDeskTicket({accountId:OTHER,contractId:'bad',subject:'ok',priority:'high'}))
      .rejects.toThrow('Invalid ticket request');
    await expect(listServiceDeskContracts('bad')).rejects.toThrow('Invalid CRM account');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('scopes comments and immutable work entries to the current CRM session',async()=>{
    const {rpc}=setup();
    await addServiceDeskComment({ticketId:TICKET,body:'  Return call  ',visibility:'internal'});
    await recordServiceDeskTime({ticketId:TICKET,minutes:15,description:'  Investigation  '});
    expect(rpc).toHaveBeenCalledWith('crm_sd_add_comment_v1',{
      p_actor:USER,p_organization:ORG,p_ticket:TICKET,
      p_body:'Return call',p_visibility:'internal'
    });
    expect(rpc).toHaveBeenCalledWith('crm_sd_record_time_v1',{
      p_actor:USER,p_organization:ORG,p_ticket:TICKET,
      p_minutes:15,p_description:'Investigation'
    });
  });
  it('rejects malformed comments and time before privileged RPC',async()=>{
    const {rpc}=setup();
    await expect(addServiceDeskComment({ticketId:TICKET,body:'',visibility:'internal'}))
      .rejects.toThrow('Invalid ticket comment');
    await expect(recordServiceDeskTime({ticketId:TICKET,minutes:0,description:'test'}))
      .rejects.toThrow('Invalid work time');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('authorizes attachment lookup through trusted CRM tenant',async()=>{
    const {rpc,client}=setup();
    rpc.mockImplementation((name:string)=>{
      if(name==='crm_sd_attachment_path_v1')return Promise.resolve({
        data:{object_key:'service-desk/'+ORG+'/'+TICKET+'/sample.pdf'},error:null
      });
      return Promise.resolve({data:[],error:null});
    });
    (client as any).storage={from:()=>({
      createSignedUrl:vi.fn().mockResolvedValue({
        data:{signedUrl:'https://example.test/temporary'},error:null
      })
    })};
    await expect(getServiceDeskAttachmentUrl(CONTRACT))
      .resolves.toBe('https://example.test/temporary');
    expect(rpc).toHaveBeenCalledWith('crm_sd_attachment_path_v1',{
      p_actor:USER,p_organization:ORG,p_attachment:CONTRACT
    });
  });
  it('refuses cross-organization attachment paths before generating signed URLs',async()=>{
    const {rpc,client}=setup();
    const sign=vi.fn();
    (client as any).storage={from:()=>({createSignedUrl:sign})};
    rpc.mockResolvedValue({data:{
      object_key:'service-desk/'+OTHER+'/'+TICKET+'/sample.pdf'},error:null
    });
    await expect(getServiceDeskAttachmentUrl(CONTRACT)).rejects.toThrow('Attachment forbidden');
    expect(sign).not.toHaveBeenCalled();
  });
  it('rejects invalid attachment IDs without privileged RPC',async()=>{
    const {rpc}=setup();
    await expect(listServiceDeskAttachments('invalid'))
      .rejects.toThrow('Invalid ticket');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('includes exact organization and expected-status CAS on transitions',async()=>{
    const {rpc}=setup();
    await transitionServiceDeskTicket({id:TICKET,expected:'new',next:'triaged'});
    expect(rpc).toHaveBeenCalledWith('crm_sd_transition_ticket_v1',{
      p_actor:USER,p_organization:ORG,p_ticket:TICKET,p_expected:'new',p_next:'triaged'
    });
  });
});
