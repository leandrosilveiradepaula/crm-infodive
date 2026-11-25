import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Actual customer overview uses the shared semantic StatsGrid contract', () => {
  it('defines all four KPI roles by tone, never ignored local color/gradient props', () => {
    const route = read('src/app/(dashboard)/customers/client-page.tsx');
    for(const tone of ['primary', 'info', 'success', 'warning'])expect(route).toContain(`tone: '${tone}'`);
    expect(route).not.toMatch(/\b(?:color|gradient|border): "(?:text|from|border)-/);
    const shared = read('src/components/layout/StatsGrid.tsx');
    expect(shared).toContain("const tone = stat.tone ?? 'neutral';");
    expect(shared).toContain('statToneClasses[tone]');
  });
  it('preserves real filters, customer CRUD and sales calculations', () => {
    const page = read('src/app/(dashboard)/customers/client-page.tsx');
    expect(page).toContain('initialAccounts.filter(c => c.status');
    expect(page).toContain('initialAccounts.reduce(');
    expect(page).toContain('handleCreate');
    expect(page).toContain('handleDelete');
    expect(page).toContain('clearFilters');
    expect(page).toContain('onReset={clearFilters} resetLabel="Limpar filtros de empresas"');
    const reset = read('src/components/layout/DirectoryResults.tsx');
    expect(reset).toContain('aria-label={resetLabel} onClick={onReset}');
    expect(reset).toContain('variant="outline"');
    expect(reset).not.toContain('text-destructive');
  });
});
