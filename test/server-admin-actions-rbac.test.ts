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
const OTHER_ID='22222222-2222-4222-8222-222222222222';
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
];

function query(result: { data?: unknown; error?: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

function adminClient(...queries: any[]) {
  return { from: vi.fn(() => queries.shift()) };
}

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

  it('denies price-list reads and writes even when the action returns a failure envelope',async ()=>{
    const attempts=[
      ()=>priceLists.saveTemplateAction('vendor',{} as any),
      ()=>priceLists.importPriceListAction('list','vendor','file.csv',[]),
      ()=>priceLists.deletePriceListAction(ID),
      ()=>priceLists.getPriceLists(),
      ()=>priceLists.getTemplateAction('vendor'),
    ];
    for(const attempt of attempts){
      const result=await attempt();
      expect(result).toMatchObject({success:false});
    }
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

describe('tenant-scoped user mutation receipts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocked.requireAuditedAdminAction.mockResolvedValue({ userId: OTHER_ID, organizationId: ORG });
  });

  it.each(['missing target', 'cross-tenant target'])('fails an update with an empty receipt for a %s', async () => {
    const update = query({ data: null, error: null });
    mocked.createAdminClient.mockReturnValue(adminClient(update));

    await expect(users.updateUserAction(ID, { role: 'admin' })).resolves.toMatchObject({ success: false });
    expect(update.update).toHaveBeenCalledWith({ role: 'admin' });
    expect(update.select).toHaveBeenCalledWith('id');
    expect(update.maybeSingle).toHaveBeenCalled();
  });

  it('fails an update when its database mutation returns an error', async () => {
    const update = query({ data: null, error: new Error('database unavailable') });
    mocked.createAdminClient.mockReturnValue(adminClient(update));

    await expect(users.updateUserAction(ID, { role: 'admin' })).resolves.toMatchObject({
      success: false,
      error: 'database unavailable',
    });
  });

  it('keeps role mapping and returns success only for the requested update receipt', async () => {
    const update = query({ data: { id: ID }, error: null });
    mocked.createAdminClient.mockReturnValue(adminClient(update));

    await expect(users.updateUserAction(ID, { roles: ['sales', 'manager'] })).resolves.toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({ roles: ['vendedor', 'manager'], role: 'vendedor' });
  });

  it.each(['missing target', 'cross-tenant target'])('does not transfer deals when archive target is a %s', async () => {
    const target = query({ data: null, error: null });
    const client = adminClient(target);
    mocked.createAdminClient.mockReturnValue(client);

    await expect(users.archiveUserAction(ID, OTHER_ID)).resolves.toMatchObject({ success: false });
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledWith('profiles');
    expect(target.update).not.toHaveBeenCalled();
  });

  it('fails archive when target lookup reports a database error without transferring deals', async () => {
    const target = query({ data: null, error: new Error('database unavailable') });
    const client = adminClient(target);
    mocked.createAdminClient.mockReturnValue(client);

    await expect(users.archiveUserAction(ID, OTHER_ID)).resolves.toMatchObject({
      success: false,
      error: 'database unavailable',
    });
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('preserves a legitimate transfer and archive only when both target receipts are valid', async () => {
    const target = query({ data: { id: ID }, error: null });
    const owner = query({ data: { id: OTHER_ID }, error: null });
    const transfer = query({ error: null });
    const archive = query({ data: { id: ID }, error: null });
    mocked.createAdminClient.mockReturnValue(adminClient(target, owner, transfer, archive));

    await expect(users.archiveUserAction(ID, OTHER_ID)).resolves.toEqual({ success: true });
    expect(transfer.update).toHaveBeenCalledWith({ owner_id: OTHER_ID });
    expect(archive.update).toHaveBeenCalledWith({ status: 'inactive' });
    expect(archive.select).toHaveBeenCalledWith('id');
  });

  it('fails archive when the final archive mutation has no target receipt', async () => {
    const target = query({ data: { id: ID }, error: null });
    const archive = query({ data: null, error: null });
    mocked.createAdminClient.mockReturnValue(adminClient(target, archive));

    await expect(users.archiveUserAction(ID)).resolves.toMatchObject({ success: false });
    expect(archive.update).toHaveBeenCalledWith({ status: 'inactive' });
  });
});
