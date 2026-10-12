import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SettingsService, type PipelineStage } from './SettingsService';

const actor = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const org = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const id = '11111111-1111-4111-8111-111111111111';
const current: PipelineStage = { id, name: 'Qualificação', color: '#abcdef', order_index: 0 };
describe('pipeline stage transactional service boundary', () => {
 beforeEach(() => {
   vi.clearAllMocks();
   mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
   mocks.rpc.mockResolvedValue({ data: [{ revision: 3 }], error: null });
 });
 it('rejects stale forms without actor and revision before I/O', async () => {
   await expect(SettingsService.savePipelineStages(org,[current])).resolves.toMatchObject({success:false});
   expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it('accepts confirmed snapshot and carries revision into one atomic RPC', async () => {
   mocks.rpc.mockResolvedValueOnce({data:[{revision:2,stages:[current]}],error:null});
   const snap=await SettingsService.getPipelineStageSnapshot(actor,org);
   expect(snap.revision).toBe(2);
   expect(snap.stages).toEqual([current]);
   const result=await SettingsService.savePipelineStages(org,[current],2,actor);
   expect(result).toMatchObject({success:true,revision:3});
   expect(mocks.rpc).toHaveBeenLastCalledWith('replace_pipeline_stages_atomic',{
      p_actor_id:actor,p_org_id:org,p_expected_revision:2,
      p_stages:[{id,name:'Qualificação',color:'#abcdef'}],
   });
 });
 it('never reports success on missing transaction receipt or mismatch', async () => {
   for(const response of [
      {data:null,error:null},{data:[],error:null},
      {data:[{revision:99}],error:null},
      {data:[{revision:3}],error:{code:'XX000'}},
   ]) {
      mocks.rpc.mockResolvedValueOnce(response);
      const result=await SettingsService.savePipelineStages(org,[current],2,actor);
      expect(result.success).toBe(false);
   }
 });
 it('rejects malformed organization identifiers before contacting the database', async () => {
   await expect(SettingsService.getPipelineStageSnapshot(actor,'invalid-org'))
     .rejects.toThrow('identificar a organização');
   await expect(SettingsService.savePipelineStages(org,[current],2,'invalid-user'))
     .resolves.toMatchObject({success:false});
   expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it('returns explicit conflict and refuses duplicate and malformed stage values', async () => {
   mocks.rpc.mockResolvedValueOnce({data:null,error:{code:'40001'}});
   await expect(SettingsService.savePipelineStages(org,[current],2,actor))
     .resolves.toMatchObject({success:false,conflict:true});
   await expect(SettingsService.savePipelineStages(org,[current,{...current,id:'not-a-uuid'}],2,actor))
     .resolves.toMatchObject({success:false});
   await expect(SettingsService.savePipelineStages(org,[current,{...current,id:'22222222-2222-4222-8222-222222222222',name:' qualificação '}],2,actor))
     .resolves.toMatchObject({success:false});
   expect(mocks.rpc).toHaveBeenCalledTimes(1);
 });
});
