import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('XLSX dependency hardening', () => {
  it('does not ship the vulnerable xlsx npm package', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));

    expect(pkg.dependencies?.xlsx).toBeUndefined();
    expect(lock.packages?.['node_modules/xlsx']).toBeUndefined();
  });

  it('uses ExcelJS for spreadsheet parsing and does not advertise legacy .xls', () => {
    const parser = readFileSync('src/utils/excelParser.ts', 'utf8');
    const customers = readFileSync('src/components/customers/ImportCustomersModal.tsx', 'utf8');
    const products = readFileSync('src/components/pipeline/ImportDealProductsModal.tsx', 'utf8');
    const helper = readFileSync('analyze_excel.js', 'utf8');

    expect(parser).toContain("import('exceljs')");
    expect(parser).not.toContain("import('xlsx')");
    expect(customers).not.toContain("from 'xlsx'");
    expect(customers).not.toContain('.xls"');
    expect(products).not.toContain('.xls,');
    expect(products).not.toMatch(/\(xlsx\|xls\)/);
    expect(helper).toContain("require('exceljs')");
    expect(helper).not.toContain("require('xlsx')");
  });
});
