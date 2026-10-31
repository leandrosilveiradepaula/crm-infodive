import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../src/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }));
import { ContractService } from '../src/services/ContractService';

const USER = 'user-1';
const ORG = 'org-1';
const OTHER = 'org-2';
const DATE = '2026-10-30T12:00:00+00:00';
const uid = (n: number) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const rows = (n: number) => Array.from({ length: n }, (_, i) =>
  ({ id: uid(n - i), created_at: DATE }));
type Response = { data: unknown; error: unknown };

function query(response: Response) {
  const q: Record<string, any> = {};
  for (const key of ['select', 'eq', 'or', 'order', 'limit', 'is', 'insert', 'update', 'delete']) q[key] = vi.fn(() => q);
  q.maybeSingle = vi.fn(async () => response);
  q.single = vi.fn(async () => response);
  return q;
}
function setup(role: string | null, resultRows: unknown[] = [], error: unknown = null) {
  const profile = query({ data: role ? { role } : null, error });
  const contracts = query({ data: null, error: null });
  let page = 0;
  contracts.limit = vi.fn(async (size: number) => {
    const start = page++ * size;
    return { data: resultRows.slice(start, start + size), error: null };
  });
  const from = vi.fn((table: string) => table === 'profiles' ? profile : contracts);
  mocked.createAdminClient.mockReturnValue({ from });
  return { profile, contracts, from };
}

describe('CRM #171 contract owner/tenant access and pagination', () => {
  beforeEach(() => vi.resetAllMocks());

  it('paginates >1000 rows with keysets, not giant IN/offset', async () => {
    const { contracts } = setup('vendedor', rows(1201));
    expect(await ContractService.getContracts(USER, ORG)).toHaveLength(1201);
    expect(contracts.eq).toHaveBeenCalledWith('visible_deal.owner_id', USER);
    expect(contracts.eq).toHaveBeenCalledWith('visible_deal.organization_id', ORG);
    expect(contracts.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(contracts.limit).toHaveBeenCalledTimes(3);
    expect(contracts.or).toHaveBeenCalledTimes(2);
    expect(contracts.or).toHaveBeenCalledWith(
      'created_at.lt."' + DATE + '",and(created_at.eq."' + DATE + '",id.lt.' + uid(702) + ')');
    expect(contracts.order).toHaveBeenCalledWith('id', { ascending: false });
    expect(contracts.order).toHaveBeenCalledWith('created_at', { ascending: false, nullsFirst: true });
    expect(contracts.in).toBeUndefined();
    expect(contracts.range).toBeUndefined();
  });
  it('rejects later-page errors rather than returning a partial list', async () => {
    const { contracts } = setup('vendedor');
    contracts.limit = vi.fn()
      .mockResolvedValueOnce({ data: rows(500), error: null })
      .mockResolvedValueOnce({ data: [], error: { message: 'down' } });
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('carregar');
  });
  it('rejects duplicate IDs and null sort keys', async () => {
    const { contracts } = setup('vendedor');
    const first = rows(500);
    contracts.limit = vi.fn()
      .mockResolvedValueOnce({ data: first, error: null })
      .mockResolvedValueOnce({ data: [first[499]], error: null });
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('inválida');
    setup('admin', [{ id: uid(1), created_at: null }]);
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('inválida');
  });
  it('admin sees only tenant records without an owner filter', async () => {
    const { contracts } = setup('admin', rows(2));
    expect(await ContractService.getContracts(USER, ORG)).toHaveLength(2);
    expect(contracts.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(contracts.eq).not.toHaveBeenCalledWith('visible_deal.owner_id', USER);
  });
  it('fails closed on unknown/missing roles and checks tenant against active profile', async () => {
    setup('support');
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('negado');
    setup(null);
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('negado');
    const { profile } = setup('vendedor');
    await ContractService.getContracts(USER, ORG);
    expect(profile.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(profile.eq).toHaveBeenCalledWith('status', 'active');
    expect(profile.eq).not.toHaveBeenCalledWith('organization_id', OTHER);
  });
  it('rejects role lookup errors', async () => {
    setup('vendedor', [], { message: 'db down' });
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('negado');
  });
  it('rejects a cross-tenant proposal even for manager', async () => {
    const profile = query({ data: { role: 'manager' }, error: null });
    const foreignProposal = query({ data: null, error: null });
    const from = vi.fn((table: string) => table === 'profiles' ? profile : foreignProposal);
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(ContractService.createContract(USER, ORG,
      { title: 'draft', proposalId: uid(1) })).rejects.toThrow('Proposta');
    expect(foreignProposal.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(from).not.toHaveBeenCalledWith('contracts');
  });
  it('rejects a proposal linked to a deal when creating an unlinked contract', async () => {
    const profile = query({ data: { role: 'admin' }, error: null });
    const linkedProposal = query({ data: { id: uid(2), deal_id: uid(3) }, error: null });
    const from = vi.fn((table: string) => table === 'profiles' ? profile : linkedProposal);
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(ContractService.createContract(USER, ORG,
      { title: 'draft', dealId: null, proposalId: uid(2) }))
      .rejects.toThrow('Proposta');
    expect(from).not.toHaveBeenCalledWith('contracts');
  });
  it('rejects a retained proposal incompatible with a new deal', async () => {
    const profile = query({ data: { role: 'admin' }, error: null });
    const contract = query({ data: { deal_id: null, proposal_id: uid(2) }, error: null });
    const newDeal = query({ data: { id: uid(4), owner_id: USER }, error: null });
    const proposal = query({ data: { id: uid(2), deal_id: uid(3) }, error: null });
    const from = vi.fn((table: string) =>
      table === 'profiles' ? profile : table === 'deals' ? newDeal :
      table === 'proposals' ? proposal : contract);
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(ContractService.updateContract(USER, ORG, uid(9),
      { dealId: uid(4) })).rejects.toThrow('Proposta');
    expect(contract.update).not.toHaveBeenCalled();
  });
  it('does not claim delete success when a row disappeared', async () => {
    const before = query({ data: { deal_id: null }, error: null });
    const profile = query({ data: { role: 'admin' }, error: null });
    const missing = query({ data: null, error: null });
    let contractQueries = 0;
    const from = vi.fn((table: string) => table === 'profiles' ? profile :
      (contractQueries++ === 0 ? before : missing));
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(ContractService.deleteContract(USER, ORG, uid(10))).rejects.toThrow('excluir');
    expect(missing.is).toHaveBeenCalledWith('deal_id', null);
    expect(missing.select).toHaveBeenCalledWith('id');
  });
  it('guards updates against a concurrently reassigned contract deal', async () => {
    const before = query({ data: { deal_id: uid(3) }, error: null });
    const profile = query({ data: { role: 'admin' }, error: null });
    const deal = query({ data: { id: uid(3), owner_id: USER }, error: null });
    const stale = query({ data: null, error: null });
    let contractQueries = 0;
    const from = vi.fn((table: string) => table === 'profiles' ? profile :
      table === 'deals' ? deal : (contractQueries++ === 0 ? before : stale));
    mocked.createAdminClient.mockReturnValue({ from });
    await expect(ContractService.updateContract(USER, ORG, uid(10), { title: 'edit' }))
      .rejects.toThrow('atualizar');
    expect(stale.eq).toHaveBeenCalledWith('deal_id', uid(3));
  });
});
