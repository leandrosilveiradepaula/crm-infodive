import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('administrative server action RBAC', () => {
  it('requires integrations:manage across the aggregated integration actions', () => {
    const source = readFileSync('src/app/(dashboard)/integrations/actions.ts', 'utf8');
    expect(source).not.toContain('requireSessionContext');
    expect(source.match(/requirePermission\('integrations:manage'\)/g)?.length).toBe(9);
  });

  it('requires product edit permission for price-list mutations', () => {
    const source = readFileSync('src/app/(dashboard)/settings/price-lists-actions.ts', 'utf8');
    for (const fn of ['saveTemplateAction', 'importPriceListAction', 'deletePriceListAction']) {
      const start = source.indexOf(`export async function ${fn}`);
      expect(start).toBeGreaterThanOrEqual(0);
      const next = source.indexOf('export async function ', start + 1);
      const body = source.slice(start, next === -1 ? undefined : next);
      expect(body).toContain("requirePermission('products:edit')");
    }
  });
});
