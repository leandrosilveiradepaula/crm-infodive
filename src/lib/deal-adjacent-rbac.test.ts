import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function functionBody(source: string, name: string) {
  const start = source.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = source.indexOf('export async function ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

describe('deal-adjacent mutation RBAC', () => {
  it('protects deal room creation', () => {
    const source = readFileSync('src/app/(dashboard)/pipeline/dealroom-actions.ts', 'utf8');
    expect(functionBody(source, 'getOrCreateDealRoom')).toContain("requirePermission('deals:edit')");
  });

  it('protects handover mutations while leaving reads session-scoped', () => {
    const source = readFileSync('src/app/(dashboard)/pipeline/handover-actions.ts', 'utf8');
    expect(functionBody(source, 'getHandover')).toContain('requireSessionContext()');
    expect(functionBody(source, 'createHandover')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'updateHandover')).toContain("requirePermission('deals:edit')");
  });

  it('protects proposal mutations while leaving proposal reads session-scoped', () => {
    const source = readFileSync('src/app/(dashboard)/proposals/proposals-actions.ts', 'utf8');
    expect(functionBody(source, 'getProposals')).toContain('requireSessionContext()');
    expect(functionBody(source, 'createProposalAction')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'updateProposalAction')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'deleteProposalAction')).toContain("requirePermission('deals:edit')");
  });

  it('protects purchase order mutations while leaving reads session-scoped', () => {
    const source = readFileSync('src/app/(dashboard)/purchases/purchase-orders-actions.ts', 'utf8');
    expect(functionBody(source, 'getPurchaseOrders')).toContain('requireSessionContext()');
    expect(functionBody(source, 'createPurchaseOrder')).toContain("requirePermission('deals:create')");
    expect(functionBody(source, 'updatePurchaseOrder')).toContain("requirePermission('deals:edit')");
  });

  it('protects contract mutations while leaving reads session-scoped', () => {
    const source = readFileSync('src/app/(dashboard)/contracts/actions.ts', 'utf8');
    expect(functionBody(source, 'getContracts')).toContain('requireSessionContext()');
    expect(functionBody(source, 'createContract')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'updateContract')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'deleteContract')).toContain("requirePermission('deals:edit')");
  });

  it('protects sales mutations while preserving read-only access paths', () => {
    const source = readFileSync('src/app/(dashboard)/sales/actions.ts', 'utf8');
    expect(functionBody(source, 'getSalesOrders')).toContain('requireSessionContext()');
    expect(functionBody(source, 'getAllInstallmentsAction')).toContain('requireSessionContext()');
    expect(functionBody(source, 'getSalesOrderDocuments')).toContain('requireSessionContext()');
    expect(functionBody(source, 'getSalesDocumentSignedUrl')).toContain('requireSessionContext()');
    expect(functionBody(source, 'getSignedUrlForRawPath')).toContain('requireSessionContext()');
    expect(functionBody(source, 'downloadDistributorOrderAction')).toContain('requireSessionContext()');

    expect(functionBody(source, 'createSalesOrder')).toContain("requirePermission('deals:create')");
    expect(functionBody(source, 'updateSalesOrder')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'deleteSalesOrder')).toContain("requirePermission('deals:delete')");
    expect(functionBody(source, 'updateInstallmentStatusAction')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'processInvoiceAction')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'convertDealToSalesOrdersAction')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'uploadSalesOrderDocument')).toContain("requirePermission('deals:edit')");
    expect(functionBody(source, 'deleteSalesDocument')).toContain("requirePermission('deals:edit')");
  });
});
