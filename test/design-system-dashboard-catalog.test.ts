import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const modules = [
  "src/components/dashboard/AiActionsWidget.tsx",
  "src/components/dashboard/FunnelWidget.tsx",
  "src/components/dashboard/HealthWidget.tsx",
  "src/components/dashboard/RecentDealsWidget.tsx",
  "src/components/dashboard/SalesChartWidget.tsx",
  "src/components/dashboard/StatsWidget.tsx",
  "src/components/dashboard/TasksWidget.tsx",
  "src/components/dashboard/TopPerformersWidget.tsx",
  "src/components/products/ProductCard.tsx",
  "src/components/products/ProductFormModal.tsx",
  "src/components/products/ProductsTable.tsx",
  "src/components/email/EmailList.tsx",
  "src/components/email/EmailSidebar.tsx",
  "src/components/layout/CommandBar.tsx",
  "src/components/layout/NotificationCenter.tsx",
  "src/components/handover/TechnicalHandoverModal.tsx"
] as const;
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Dashboard, catalog, email and global command UI centralization', () => {
  it.each(modules)('%s uses tokenized styling, not private palette or scale classes', path => {
    const code = read(path);
    expect(code).not.toMatch(/\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/);
    expect(code).not.toMatch(/\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/);
    expect(code).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/);
    expect(code).not.toMatch(/\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/);
    expect(code).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl|3xl)\b/);
  });
});
