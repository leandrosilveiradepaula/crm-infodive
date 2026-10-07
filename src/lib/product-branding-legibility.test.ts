import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const criticalFiles = [
  "src/components/layout/CommandBar.tsx",
  "src/components/layout/Header.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/components/layout/StatsGrid.tsx",
  "src/app/(dashboard)/dashboard/client-page.tsx",
  "src/app/(dashboard)/reports/client-page.tsx",
  "src/app/(dashboard)/settings/client-page.tsx",
  "src/app/(dashboard)/pipeline/client-page.tsx",
  "src/components/pipeline/WonDealWizard.tsx",
  "src/components/pipeline/TechnicalDetailsEditor.tsx",
  "src/components/pipeline/ViewDealModal.tsx",
  "src/components/pipeline/ProductSearch.tsx",
  "src/components/pipeline/ProductDetailsTable.tsx"
];

describe('branding and legibility baseline', () => {
  it('removes obsolete product branding from primary navigation surfaces', () => {
    const content = [
      readFileSync('src/components/layout/CommandBar.tsx', 'utf8'),
      readFileSync('src/components/layout/Header.tsx', 'utf8'),
      readFileSync('src/components/layout/Sidebar.tsx', 'utf8')
    ].join('\n');

    expect(content).not.toContain('Watson AI');
    expect(content).not.toContain('Nexus CRM');
    expect(content).toContain('CRM Infodive');
    expect(content).toContain('Assistente do CRM');
  });

  it('keeps critical product surfaces at 12px or above', () => {
    for (const path of criticalFiles) {
      const content = readFileSync(path, 'utf8');
      expect(content, path).not.toMatch(/text-\[(?:9|10|11)px\]/);
    }
  });

  it('keeps the command palette localized in pt-BR', () => {
    const content = readFileSync('src/components/layout/CommandBar.tsx', 'utf8');
    expect(content).toContain('Ações rápidas');
    expect(content).toContain('Navegação');
    expect(content).toContain('Nenhum resultado encontrado.');
    expect(content).not.toContain('Quick Actions');
    expect(content).not.toContain('No results found.');
  });
});
