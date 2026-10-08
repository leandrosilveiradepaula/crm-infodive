import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = [
  "src/app/(dashboard)/contracts/client-page.tsx",
  "src/app/(dashboard)/goals-commissions/page.tsx",
  "src/app/(dashboard)/sales/tabs/CommissionsTab.tsx",
  "src/app/(dashboard)/sales/tabs/DashboardTab.tsx",
  "src/app/(dashboard)/sales/tabs/InstallmentsTab.tsx",
  "src/components/dashboard/RecentDealsWidget.tsx",
  "src/components/dashboard/SalesChartWidget.tsx",
  "src/components/dashboard/TasksWidget.tsx",
  "src/components/dashboard/TopPerformersWidget.tsx",
  "src/components/pipeline/ImportDealProductsModal.tsx",
  "src/components/pipeline/DealProductsTab.tsx"
];

describe('tertiary legibility baseline', () => {
  it('keeps commercial and dashboard surfaces at 12px or above', () => {
    for (const path of files) {
      const content = readFileSync(path, 'utf8');
      expect(content, path).not.toMatch(/text-\[(?:9|10|11)px\]/);
    }
  });

  it('removes CRM Next branding from goals and commissions', () => {
    const content = readFileSync('src/app/(dashboard)/goals-commissions/page.tsx', 'utf8');
    expect(content).not.toContain('CRM Next');
    expect(content).toContain('CRM Infodive');
  });
});
