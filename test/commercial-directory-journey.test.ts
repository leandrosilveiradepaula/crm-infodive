import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildCustomerCsv, csvCell } from '../src/components/customers/customer-csv';

const source = (path: string) => readFileSync(path, 'utf8');
describe('Commercial directory usability and honest actions', () => {
    it.each(['leads', 'contacts', 'customers'])('%s shares the compact directory summary and result recovery', route => {
        const page = source('src/app/(dashboard)/' + route + '/client-page.tsx');
        expect(page).toContain('<StatsGrid density="directory"');
        expect(page).toContain('<DirectoryResults shown=');
        expect(page).toContain('onReset={clearFilters}');
        expect(page).toContain("length > 0 && (view === 'cards'");
        expect(page).toContain('ViewToggle view={view}');
    });
    it('keeps fresh server-provided leads and contacts, including missing contact email', () => {
        const leads = source('src/app/(dashboard)/leads/client-page.tsx');
        const contacts = source('src/app/(dashboard)/contacts/client-page.tsx');
        expect(leads).toContain('const leads = initialLeads;');
        expect(contacts).toContain('const contacts = initialContacts;');
        expect(contacts).toContain("(contact.email || '').toLowerCase()");
    });
    it('keeps table actions independently accessible and table scrolling local', () => {
        for (const file of ['leads/LeadsTable', 'contacts/ContactsTable', 'customers/CustomersTable']) {
            const table = source('src/components/' + file + '.tsx');
            expect(table).toContain('tabIndex={0} data-qa-region="directory-table"');
            expect(table).toContain('overflow-x-auto');
            expect(table).toContain('min-w-[var(--ds-directory-table-min-width)]');
            expect(table).toContain('>Ações</th>');
        }
        const companies = source('src/components/customers/CustomersTable.tsx');
        expect(companies).not.toContain('onClick={() => onView?.(account)}');
        expect(companies).toContain('Abrir empresa');
    });
    it('escapes delimiters, quotes, newlines and spreadsheet formula prefixes', () => {
        expect(csvCell('Empresa "A"; Sul')).toBe('"Empresa ""A""; Sul"');
        expect(csvCell('linha\nseguinte')).toBe('"linha\nseguinte"');
        for (const value of ['=1+1', '  +1', '-10', '@SUM(A1)', '\tfoo', '\rfoo', '\nfoo', '＝1']) {
            expect(csvCell(value).startsWith('"\'')).toBe(true);
        }
        expect(csvCell(null)).toBe('""');
    });
    it('exports only selected company fields and no nested contact or internal tenant ID', () => {
        const account = { name: 'Empresa Aurora', cnpj: '00123', segment: 'Serviços', city: 'Cidade', state: 'SC', status: 'Ativo' as const, relationship_type: 'Cliente', contacts: [{ email: 'hidden@example.invalid' }], organization_id: 'tenant-secret' };
        const csv = buildCustomerCsv([account]);
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
        expect(csv).toContain('"Empresa Aurora";"00123";"Serviços";"Cidade";"SC";"Ativo";"Cliente"');
        expect(csv).not.toContain('hidden@example.invalid');
        expect(csv).not.toContain('tenant-secret');
    });
    it('does not simulate research persistence or call it verified internet research', () => {
        const lead = source('src/app/(dashboard)/leads/client-page.tsx');
        const modal = source('src/components/leads/LeadEnrichmentModal.tsx');
        expect(lead).not.toContain('onEnrichSubmit');
        expect(modal).not.toContain('Aplicar Dados');
        expect(modal).toContain('Nenhum dado é gravado no lead');
        expect(modal).toContain('não uma pesquisa verificada na internet');
        expect(modal).toContain("fetch('/api/gemini/enrich'");
        expect(modal).toContain('useDialogBackgroundInert(isOpen)');
    });
});
