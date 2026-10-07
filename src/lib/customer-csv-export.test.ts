import { describe, expect, it } from 'vitest';
import { accountsToCsv, escapeCsvCell } from '../utils/customerCsv';

describe('customer CSV export', () => {
  it('quotes values and escapes embedded quotes', () => {
    expect(escapeCsvCell('ACME "Sul"')).toBe('"ACME ""Sul"""');
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCsvCell('=HYPERLINK("https://example.com")')).toBe('"\'=HYPERLINK(""https://example.com"")"');
    expect(escapeCsvCell('+CMD')).toBe('"\'+CMD"');
    expect(escapeCsvCell('-10+20')).toBe('"\'-10+20"');
    expect(escapeCsvCell('@SUM(A1:A2)')).toBe('"\'@SUM(A1:A2)"');
  });

  it('exports actual account data', () => {
    const csv = accountsToCsv([{
      id: '1',
      organization_id: 'org',
      name: 'Infodive',
      cnpj: '00',
      ie: '',
      segment: 'Tecnologia',
      status: 'Ativo',
      zip: '90000-000',
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'Porto Alegre',
      state: 'RS',
      contacts: [],
      branches: []
    }]);

    expect(csv).toContain('"Infodive"');
    expect(csv).toContain('"Tecnologia"');
    expect(csv).toContain('"Porto Alegre"');
    expect(csv).toContain('"RS"');
  });
});
