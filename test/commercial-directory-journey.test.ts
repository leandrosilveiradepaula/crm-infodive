import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

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
    it('retains the existing data and mutation contracts without adding business features', () => {
        const leads = source('src/app/(dashboard)/leads/client-page.tsx');
        const contacts = source('src/app/(dashboard)/contacts/client-page.tsx');
        const companies = source('src/app/(dashboard)/customers/client-page.tsx');
        expect(leads).toContain('const [leads] = useState<Lead[]>(initialLeads)');
        expect(leads).toContain('await deleteLead(lead.id)');
        expect(contacts).toContain('setContacts(initialContacts)');
        expect(contacts).toContain('await deleteContact(id)');
        expect(companies).toContain('await deleteAccount(id)');
        expect(companies).toContain('disabled aria-label="Exportação CSV indisponível"');
        expect(companies).not.toContain('buildCustomerCsv');
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
    it('does not simulate research persistence or call it verified internet research', () => {
        const lead = source('src/app/(dashboard)/leads/client-page.tsx');
        const modal = source('src/components/leads/LeadEnrichmentModal.tsx');
        expect(lead).toContain('onEnrich={onEnrichSubmit}');
        expect(modal).not.toContain('Aplicar Dados');
        expect(modal).toContain('Nenhum dado é gravado no lead');
        expect(modal).toContain('Não é uma pesquisa verificada na internet.');
        expect(modal).toContain("fetch('/api/gemini/enrich'");
        expect(modal).toContain('useDialogBackgroundInert(isOpen)');
        expect(modal).toContain('onEnrich(result)');
        expect(modal).toContain('JSON.stringify({ company, website })');
        expect(modal).toContain('Concluir consulta');
    });
});
