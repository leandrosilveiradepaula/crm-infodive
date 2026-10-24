import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function functionBody(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = source.indexOf('export async function ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

describe('business mutation RBAC', () => {
  it('protects lead mutations with the existing permission matrix', () => {
    const source = readFileSync('src/app/(dashboard)/leads/actions.ts', 'utf8');
    expect(functionBody(source, 'createLead')).toContain("requirePermission('leads:create')");
    expect(functionBody(source, 'updateLead')).toContain("requirePermission('leads:edit')");
    expect(functionBody(source, 'deleteLead')).toContain("requirePermission('leads:delete')");
  });

  it('requires both lead edit and deal create to convert a lead', () => {
    const source = readFileSync('src/app/(dashboard)/leads/conversion-actions.ts', 'utf8');
    const body = functionBody(source, 'convertLeadToDeal');
    expect(body).toContain("requirePermission('leads:edit')");
    expect(body).toContain("requirePermission('deals:create')");
  });

  it('protects product mutations with create/edit/delete permissions', () => {
    const source = readFileSync('src/app/(dashboard)/products/actions.ts', 'utf8');
    expect(functionBody(source, 'createProduct')).toContain("requirePermission('products:create')");
    expect(functionBody(source, 'updateProduct')).toContain("requirePermission('products:edit')");
    expect(functionBody(source, 'deleteProduct')).toContain("requirePermission('products:delete')");
    expect(functionBody(source, 'duplicateProduct')).toContain("requirePermission('products:create')");
  });

  it('protects all pipeline mutations while leaving read paths unchanged', () => {
    const source = readFileSync('src/app/(dashboard)/pipeline/actions.ts', 'utf8');
    const expected: Record<string, string> = {
      updateDealStage: 'deals:edit',
      createDeal: 'deals:create',
      updateDeal: 'deals:edit',
      duplicateDealEntry: 'deals:create',
      addDealProduct: 'deals:edit',
      removeDealProduct: 'deals:edit',
      bulkRemoveDealProducts: 'deals:edit',
      updateDealProduct: 'deals:edit',
      reorderDealProducts: 'deals:edit',
      bulkAddDealProducts: 'deals:edit',
      deleteProposal: 'deals:edit',
      createProposal: 'deals:edit',
      updateProposal: 'deals:edit',
      getOrCreateRoom: 'deals:edit',
      uploadDealDocument: 'deals:edit',
      deleteDealDocument: 'deals:edit'
    };

    for (const [name, permission] of Object.entries(expected)) {
      expect(functionBody(source, name)).toContain(`requirePermission('${permission}')`);
    }

    expect(functionBody(source, 'getPipelineData')).toContain('requireSessionContext()');
    expect(functionBody(source, 'getDealDetails')).toContain('requireSessionContext()');
  });
});
