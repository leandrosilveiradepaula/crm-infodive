import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const files = [
  "src/components/pipeline/ai/AIDealSummaryHeader.tsx",
  "src/components/common/CalendarView.tsx",
  "src/components/charts/RevenueForecast.tsx",
  "src/components/charts/SalesPerformance.tsx",
  "src/components/charts/ConversionFunnel.tsx",
  "src/components/charts/ProductAnalysis.tsx",
  "src/components/charts/LossReasonChart.tsx",
  "src/app/login/page.tsx"
] as const;
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
describe('Login primary action consumes shared Button contrast in light and dark', () => {
  it('does not replace semantic primary foreground with local styling', () => {
    const src = read('src/app/login/page.tsx');
    const button = read('src/components/ui/button.tsx');
    expect(src).toContain('size="lg"');
    expect(src).toContain('className="w-full"');
    expect(src).not.toContain('shadow-primary/20 transition-all uppercase');
    expect(button).toContain('bg-primary text-primary-foreground');
    expect(button).toContain('hover:bg-primary/90');
  });
});

describe('Login readable metadata in both root themes', () => {
  it('does not fade user-facing invitation or copyright text', () => {
    const login = read('src/app/login/page.tsx');
    expect(login).not.toContain('text-muted-foreground/60');
    expect(login).not.toContain('opacity-30 select-none');
    expect(login).toContain('text-muted-foreground tracking-wide select-none');
  });
});

describe('Semantic colors and typography on charts, calendars, opportunity AI summary and login', () => {
  it.each(files)('%s does not hardcode Tailwind palettes, font scales or component geometry', path => {
    const s = read(path);
    expect(s).not.toMatch(/\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/);
    expect(s).not.toMatch(/\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/);
    expect(s).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/);
    expect(s).not.toMatch(/\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/);
    expect(s).not.toMatch(/\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/);
  });
  it('retains the existing login form instead of a synthetic replacement', () => {
    const login = read('src/app/login/page.tsx');
    expect(login).toContain('password');
    expect(login).toContain('email');
  });
});
