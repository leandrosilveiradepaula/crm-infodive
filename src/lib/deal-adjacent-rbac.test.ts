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
});
