import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../src/lib/supabase/admin', () => ({ createAdminClient: mocked.createAdminClient }));
import { ContractService } from '../src/services/ContractService';

const USER = 'user-1';
const ORG = 'org-1';
const OTHER = 'org-2';

type Response = { data: unknown; error: unknown };
function query(response: Response) {
  const q: Record<string, any> = {};
  for (const key of ['select', 'eq', 'order', 'range']) q[key] = vi.fn(() => q);
  q.maybeSingle = vi.fn(async () => response);
  q.then = (resolve: (value: Response) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(response).then(resolve, reject);
  return q;
}
function setup(role: string, rows: unknown[] = [], error: unknown = null) {
  const profile = query({ data: { role }, error: null });
  const contracts = query({ data: rows, error });
  const from = vi.fn((table: string) => table === 'profiles' ? profile : contracts);
  mocked.createAdminClient.mockReturnValue({ from });
  return { profile, contracts, from };
}

describe('CRM #171 contracts read authorization', () => {
  beforeEach(() => vi.resetAllMocks());
  it('uses relational owner filter without a large IN list, even with >1000 rows', async () => {
    const rows = Array.from({ length: 1201 }, (_, i) => ({ id: String(i), created_at: '2026-10-30' }));
    const { contracts } = setup('vendedor', rows);
    expect(await ContractService.getContracts(USER, ORG)).toHaveLength(1201);
    expect(contracts.eq).toHaveBeenCalledWith('visible_deal.owner_id', USER);
    expect(contracts.eq).toHaveBeenCalledWith('visible_deal.organization_id', ORG);
    expect(contracts.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(contracts.order).toHaveBeenCalledWith('id', { ascending: false });
    expect((contracts as any).in).toBeUndefined();
  });
  it('admin sees tenant records without owner restriction', async () => {
    const { contracts } = setup('admin', []);
    await ContractService.getContracts(USER, ORG);
    expect(contracts.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(contracts.eq).not.toHaveBeenCalledWith('visible_deal.owner_id', USER);
  });
  it('rejects unknown role', async () => {
    setup('support');
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('negado');
  });
  it('rejects query errors instead of returning partial results', async () => {
    setup('vendedor', [{ id: 'partial' }], { message: 'timeout' });
    await expect(ContractService.getContracts(USER, ORG)).rejects.toThrow('carregar');
  });
  it('never trusts a caller-provided organization other than the server parameter', async () => {
    const { profile } = setup('vendedor');
    await ContractService.getContracts(USER, ORG);
    expect(profile.eq).toHaveBeenCalledWith('organization_id', ORG);
    expect(profile.eq).not.toHaveBeenCalledWith('organization_id', OTHER);
  });
});
