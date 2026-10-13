import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
describe('contract delete revision gate',()=>{
 const service=readFileSync('src/services/ContractService.ts','utf8');
 const action=readFileSync('src/app/(dashboard)/contracts/actions.ts','utf8');
 const hook=readFileSync('src/hooks/useContracts.ts','utf8');
 it('requires observed revision for deletion',()=>{
  expect(action).toContain('deleteContract(id: string, expectedUpdatedAt: string)');
  expect(action).toContain('canViewAll ? undefined : userId, expectedUpdatedAt');
  expect(hook).toContain('deleteContractAction(id, current.updatedAt)');
 });
 it('refuses stale deletes in the database predicate',()=>{
  expect(service).toContain("throw new Error('Versão obrigatória para exclusão.')");
  expect(service).toContain(".eq('status', 'draft').eq('updated_at', expectedUpdatedAt)");
  expect(service).toContain("if (ownerId) query = query.eq('deal_id', current.deal_id)");
 });
});
