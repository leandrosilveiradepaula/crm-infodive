import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = [
  "src/app/(dashboard)/activities/client-page.tsx",
  "src/app/(dashboard)/activities/components/ActivityModal.tsx",
  "src/app/(dashboard)/activities/components/CalendarView.tsx",
  "src/app/(dashboard)/integrations/client-page.tsx",
  "src/app/(dashboard)/sales/SalesList.tsx",
  "src/app/(dashboard)/sales/tabs/OrdersTab.tsx",
  "src/components/activities/ActivityModal.tsx",
  "src/components/pipeline/DealCard.tsx"
];

describe('secondary legibility baseline', () => {
  it('keeps secondary CRM surfaces at 12px or above', () => {
    for (const path of files) {
      const content = readFileSync(path, 'utf8');
      expect(content, path).not.toMatch(/text-\[(?:9|10|11)px\]/);
    }
  });

  it('removes Watson branding from integrations', () => {
    const content = readFileSync('src/app/(dashboard)/integrations/client-page.tsx', 'utf8');
    expect(content).not.toContain('Watson AI');
    expect(content).toContain('Assistente do CRM');
  });
});
