import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  requireAuditedAdminAction: vi.fn(),
  requireSessionContext: vi.fn(),
  createAdminClient: vi.fn(),
  userService: {
    getUsers:vi.fn(),updateUserRole:vi.fn(),archiveUser:vi.fn(),
    updateUserProfile:vi.fn(),createInvitation:vi.fn(),updateMyProfile:vi.fn(),
    getUserProfile:vi.fn(),
  },
  settingsService: {
    getOrgSettings:vi.fn(),saveOrgSettings:vi.fn(),
    getPipelineStages:vi.fn(),savePipelineStages:vi.fn(),
  },
}));

vi.mock('@/lib/server-authorization',()=>({requirePermission:mocked.requirePermission}));
vi.mock('@/lib/admin-audit',()=>({requireAuditedAdminAction:mocked.requireAuditedAdminAction}));
vi.mock('@/lib/auth-server',()=>({requireSessionContext:mocked.requireSessionContext}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:mocked.createAdminClient}));
vi.mock('@/services/UserService',()=>({UserService:mocked.userService}));
vi.mock('@/services/SettingsService',()=>({SettingsService:mocked.settingsService}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));

import * as settings from '../src/app/(dashboard)/settings/actions';
import * as users from '../src/app/(dashboard)/settings/users-actions';
import * as integrations from '../src/app/(dashboard)/integrations/actions';
import * as apiKeys from '../src/app/(dashboard)/integrations/apikey-actions';
import * as webhooks from '../src/app/(dashboard)/integrations/webhook-actions';
import * as audit from '../src/app/(dashboard)/settings/audit-actions';
import * as priceLists from '../src/app/(dashboard)/settings/price-lists-actions';
import { GET as authMe } from '../src/app/api/auth/me/route';

const ID='11111111-1111-4111-8111-111111111111';
const ORG='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const directWrites: Array<[string,()=>Promise<unknown>]> = [
  ['updateUserRole',()=>settings.updateUserRole(ID,'admin')],
  ['archiveUserAction settings',()=>settings.archiveUserAction(ID)],
  ['updateUserProfile',()=>settings.updateUserProfile(ID,{role:'admin'})],
  ['createInvitationAction',()=>settings.createInvitationAction('example@invalid.test','admin')],
  ['saveOrgSettings',()=>settings.saveOrgSettings({name:'x'})],
  ['savePipelineStages',()=>settings.savePipelineStages([])],
  ['updateUserAction alternate',()=>users.updateUserAction(ID,{role:'admin'})],
  ['archiveUserAction alternate',()=>users.archiveUserAction(ID)],
  ['toggleIntegrationStatus',()=>integrations.toggleIntegrationStatus(ID,'connected')],
  ['createApiKey combined',()=>integrations.createApiKey('test')],
  ['revokeApiKey combined',()=>integrations.revokeApiKey(ID)],
  ['deleteApiKey combined',()=>integrations.deleteApiKey(ID)],
  ['createWebhook combined',()=>integrations.createWebhook({url:'https://example.invalid',events:[],status:'active'})],
  ['deleteWebhook combined',()=>integrations.deleteWebhook(ID)],
  ['createApiKey dedicated',()=>apiKeys.createApiKey('test')],
  ['revokeApiKey dedicated',()=>apiKeys.revokeApiKey(ID)],
  ['removeApiKey dedicated',()=>apiKeys.removeApiKey(ID)],
  ['createWebhook dedicated',()=>webhooks.createWebhook({url:'https://example.invalid',events:[],status:'active'} as any)],
  ['removeWebhook dedicated',()=>webhooks.removeWebhook(ID)],
  ['save price-list template',()=>priceLists.saveTemplateAction('vendor',{} as any)],
  ['import price-list',()=>priceLists.importPriceListAction('list','vendor','file.csv',[])],
  ['delete price-list',()=>priceLists.deletePriceListAction(ID)],
];

const directReads: Array<[string,()=>Promise<unknown>]> = [
  ['settings getUsers',()=>settings.getUsers()],
  ['alternate getUsers',()=>users.getUsers()],
  ['integrations',()=>integrations.getIntegrations()],
  ['combined API keys',()=>integrations.getApiKeys()],
  ['dedicated API keys',()=>apiKeys.getApiKeys()],
  ['combined webhooks',()=>integrations.getWebhooks()],
  ['dedicated webhooks',()=>webhooks.getWebhooks()],
  ['audit log viewer',()=>audit.getAuditLogs()],
  ['price-list inventory',()=>priceLists.getPriceLists()],
  ['price-list template',()=>priceLists.getTemplateAction('vendor')],
];

describe('direct Server Action RBAC, not UI hiding',()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    mocked.requirePermission.mockRejectedValue(new Error('Forbidden: server-side permission required'));
    mocked.requireAuditedAdminAction.mockRejectedValue(new Error('Forbidden: server-side permission required'));
    mocked.requireSessionContext.mockRejectedValue(new Error('Unauthorized'));
  });

  it.each(directWrites)('denies %s before any service-role mutation',async (_name,execute)=>{
    await expect(execute()).rejects.toThrow('Forbidden');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
    expect(mocked.userService.updateUserRole).not.toHaveBeenCalled();
    expect(mocked.userService.archiveUser).not.toHaveBeenCalled();
    expect(mocked.settingsService.savePipelineStages).not.toHaveBeenCalled();
    expect(mocked.settingsService.saveOrgSettings).not.toHaveBeenCalled();
  });

  it.each(directReads)('denies privileged read %s without server role',async (_name,execute)=>{
    await expect(execute()).rejects.toThrow('Forbidden');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('never lets a client forge security audit data',async ()=>{
    const result=await audit.createAuditLog({user:'admin',action:'fake_success',details:'fake',
      category:'security',ip:'127.0.0.1'});
    expect(result.success).toBe(false);
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('allows a genuine own-profile edit but not role updates through that path',async ()=>{
    mocked.requireSessionContext.mockResolvedValue({userId:ID,organizationId:ORG});
    mocked.userService.updateMyProfile.mockResolvedValue({success:true});
    await expect(settings.updateMyProfile({full_name:'Example'})).resolves.toMatchObject({success:true});
    expect(mocked.userService.updateMyProfile).toHaveBeenCalledWith(ID,ORG,{full_name:'Example'});
    expect(mocked.requireAuditedAdminAction).not.toHaveBeenCalled();
  });

  it('rejects self-archive even for a privileged caller',async ()=>{
    mocked.requireAuditedAdminAction.mockResolvedValue({userId:ID,organizationId:ORG});
    await expect(settings.archiveUserAction(ID)).rejects.toThrow('cannot archive');
    await expect(users.archiveUserAction(ID)).rejects.toThrow('cannot archive');
    expect(mocked.createAdminClient).not.toHaveBeenCalled();
  });

  it('denies /api/auth/me on revoked session rather than returning 200',async ()=>{
    const res=await authMe();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('Unauthorized');
    expect(mocked.userService.getUserProfile).not.toHaveBeenCalled();
  });

  it('denies /api/auth/me if a profile vanishes after session validation',async ()=>{
    mocked.requireSessionContext.mockResolvedValue({userId:ID,organizationId:ORG});
    mocked.userService.getUserProfile.mockResolvedValue({success:false,error:'Not found'});
    const res=await authMe();
    expect(res.status).toBe(401);
    expect(mocked.userService.getUserProfile).toHaveBeenCalledWith(ID,ORG);
  });

  it('uses the current tenant from the server on /api/auth/me',async ()=>{
    mocked.requireSessionContext.mockResolvedValue({userId:ID,organizationId:ORG});
    mocked.userService.getUserProfile.mockResolvedValue({success:true,data:{id:ID,organization_id:ORG}});
    const res=await authMe();
    expect(res.status).toBe(200);
    const json=await res.json();
    expect(json.userId).toBe(ID);
    expect(json.profile.organization_id).toBe(ORG);
  });
});
