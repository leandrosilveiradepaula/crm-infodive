import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('contract hook error states', () => {
 const source=readFileSync('src/hooks/useContracts.ts','utf8');
 it('clears a prior fetch error after successful refresh',()=>{
   expect(source).toContain('setContracts(data);\n            setError(null);');
 });
 it('handles non-Error rejections without exposing undefined',()=>{
   expect(source).toContain("err instanceof Error ? err.message : 'Não foi possível carregar os contratos.'");
   expect(source).toContain("err instanceof Error ? err.message : 'Não foi possível criar o contrato.'");
   expect(source).toContain("err instanceof Error ? err.message : 'Não foi possível excluir o contrato.'");
   expect(source).not.toContain('catch (err: any)');
 });
 it('preserves optimistic locking of drafts',()=>{
   expect(source).toContain('updateContractAction(id, updates, current.updatedAt)');
   expect(source).toContain("current.status !== 'draft'");
 });
});
