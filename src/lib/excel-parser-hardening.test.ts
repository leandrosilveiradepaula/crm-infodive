import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { worksheetToRows } from '../utils/excelParser';

describe('Excel import without SheetJS xlsx', () => {
  it('converts ExcelJS worksheet rows into the mapping shape', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Produtos');
    sheet.addRow(['SKU', 'Nome', 'Preço']);
    sheet.addRow(['ABC-1', 'Produto teste', 123.45]);

    expect(worksheetToRows(sheet)).toEqual([
      ['SKU', 'Nome', 'Preço'],
      ['ABC-1', 'Produto teste', 123.45],
    ]);
  });

  it('keeps customer import on the shared ExcelJS parser', () => {
    const source = readFileSync('src/components/customers/ImportCustomersModal.tsx', 'utf8');
    expect(source).toContain("import { parseExcel } from '@/utils/excelParser'");
    expect(source).not.toContain("from 'xlsx'");
    expect(source).not.toContain('XLSX.');
  });
});
