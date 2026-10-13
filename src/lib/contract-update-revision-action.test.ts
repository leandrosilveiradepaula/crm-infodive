import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('all external contract update actions require revision', () => {
  const actions=readFileSync('src/app/(dashboard)/contracts/actions.ts','utf8');
  const service=readFileSync('src/services/ContractService.ts','utf8');
  it('requires the revision on generic updates as well as dedicated draft editor',()=>{
    const a=actions.slice(actions.indexOf('export async function updateContract('),actions.indexOf('/** Save an already-existing draft'));
    expect(a).toContain('expectedUpdatedAt: string');
    expect(a).toContain("typeof expectedUpdatedAt !== 'string'");
    expect(a).toContain('canViewAll ? undefined : userId, expectedUpdatedAt');
  });
  it('takes the revision from the fetched, editable draft rather than making a blind write',()=>{
    const hook=readFileSync('src/hooks/useContracts.ts','utf8');
    expect(hook).toContain("contracts.find(contract => contract.id === id)");
    expect(hook).toContain("current.status !== 'draft'");
    expect(hook).toContain("!current.updatedAt");
    expect(hook).toContain("updateContractAction(id, updates, current.updatedAt)");
    expect(hook).not.toContain("updateContractAction(id, updates);");
  });
  it('does not bypass tenant, owner, draft and revision comparisons',()=>{
    expect(service).toContain(".eq('organization_id', organizationId).eq('status', 'draft')");
    expect(service).toContain("query.eq('updated_at', expectedUpdatedAt)");
    expect(actions).toContain("requirePermission('deals:edit')");
  });
});
