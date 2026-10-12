import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { AccountService } from './AccountService';

const user = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const tenant = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const id = '11111111-1111-4111-8111-111111111111';

describe('Account aggregate atomic RPC (#119)', () => {
 beforeEach(() => {
  vi.clearAllMocks();
  mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: [{ account_id: id, aggregate_revision: 1 }], error: null });
 });
 it('creates only through the atomic RPC and strips child ids/tenant', async () => {
  const result = await AccountService.createAccount(user, tenant, {
   name: 'ACME', contacts: [{ id: 'forged', name: 'Contato', is_primary: true }],
  });
  expect(result.success).toBe(true);
  expect(mocks.rpc).toHaveBeenCalledWith('upsert_account_aggregate_atomic', expect.objectContaining({
   p_account_id: null, p_fields: expect.objectContaining({ name: 'Acme' }),
   p_contacts: [{ name: 'Contato', is_primary: true }], p_branches: [],
  }));
 });
 it('rejects stale update with no revision and never writes', async () => {
  const result = await AccountService.updateAccount(user,tenant,id,{ city: 'Porto Alegre' });
  expect(result.success).toBe(false);
  expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it('rejects failed or unverified persistence, without compensating writes', async () => {
  mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
  expect((await AccountService.createAccount(user,tenant,{ name:'Acme' })).success).toBe(false);
  mocks.rpc.mockResolvedValueOnce({ data: [{ account_id:'invalid', aggregate_revision:2 }], error:null });
  expect((await AccountService.updateAccount(user,tenant,id,{ city:'Porto', aggregate_revision:1 })).success).toBe(false);
 });
 it('passes expected revision on a valid atomic update', async () => {
  mocks.rpc.mockResolvedValueOnce({ data: [{ account_id:id, aggregate_revision:2 }], error:null });
  expect((await AccountService.updateAccount(user,tenant,id,{ city:'Porto Alegre', aggregate_revision:1 })).success).toBe(true);
  expect(mocks.rpc).toHaveBeenLastCalledWith('upsert_account_aggregate_atomic', expect.objectContaining({
   p_expected_revision:1, p_contacts:null, p_branches:null,
  }));
 });
});
