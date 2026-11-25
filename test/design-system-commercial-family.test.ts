import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const modules = [
  "src/components/sales/SalesOrderList.tsx",
  "src/components/sales/SalesOrderDetails.tsx",
  "src/app/(dashboard)/sales/SalesList.tsx",
  "src/app/(dashboard)/sales/tabs/CommissionsTab.tsx",
  "src/app/(dashboard)/products/client-page.tsx",
  "src/components/portal/DealRoomPortal.tsx",
  "src/app/proposals/public/[token]/page.tsx",
  "src/components/proposals/editor/ProposalEditorClient.tsx",
  "src/components/pipeline/ProductSearch.tsx",
  "src/components/pipeline/DealProductsTab.tsx",
  "src/components/pipeline/ImportDealProductsModal.tsx",
  "src/components/pipeline/TechnicalDetailsEditor.tsx",
  "src/components/pipeline/SortableProductRow.tsx",
  "src/components/pipeline/DealProductMapper.tsx",
  "src/components/pipeline/product-row/ProductRowHeader.tsx",
  "src/components/pipeline/ai/AIEmailDrafter.tsx",
  "src/components/proposals/ProposalHardwareProduct.tsx",
  "src/components/proposals/ProposalVersionHistory.tsx",
  "src/components/proposals/ProposalTemplateSelector.tsx",
  "src/components/proposals/ProposalsTab.tsx",
  "src/components/proposals/ProposalRow.tsx",
  "src/components/proposals/editor/ClientLogoUpload.tsx",
  "src/components/proposals/ProposalInvestmentComponents.tsx",
  "src/components/proposals/ProposalSoftwareComponents.tsx"
] as const;
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const prohibited = {
  palette: /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/g,
  fontSize: /\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/g,
  typeScale: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
  radius: /\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/g,
  shadow: /\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/g,
};
describe('Original commercial modules consume semantic design tokens', () => {
  it.each(modules)('%s does not introduce private palette/typography/geometry', path => {
    const source = read(path);
    for (const [name, pattern] of Object.entries(prohibited)) {
      expect(source.match(pattern), `${path}: ${name}`).toBeNull();
    }
  });
  it('preserves real user-facing product and order actions', () => {
    const deals = read('src/components/pipeline/DealProductsTab.tsx');
    const productSearch = read('src/components/pipeline/ProductSearch.tsx');
    expect(deals).toContain('updateDeal(');
    expect(productSearch).toContain('ProductSearch');
    expect(read('src/components/sales/SalesOrderList.tsx')).toContain('SalesOrderList');
  });
});
