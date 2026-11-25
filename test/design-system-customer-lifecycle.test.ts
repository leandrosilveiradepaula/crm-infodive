import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  "src/components/activities/ActivityModal.tsx",
  "src/components/activities/AiSuggestionsPanel.tsx",
  "src/components/integrations/IntegrationKeys.tsx",
  "src/components/integrations/IntegrationWebhooks.tsx",
  "src/components/omnichannel/SmartTimeline.tsx",
  "src/components/gamification/SalesLeaderboard.tsx",
  "src/app/(dashboard)/integrations/client-page.tsx",
  "src/components/proposals/TemplateCard.tsx",
  "src/components/customers/CustomerFormModal.tsx",
  "src/components/customers/ViewAccountModal.tsx",
  "src/components/customers/CustomerAssetModal.tsx",
  "src/components/customers/CustomerBranchesSection.tsx",
  "src/components/customers/CustomerContactsSection.tsx",
  "src/components/customers/PostSalesTab.tsx",
  "src/components/customers/ServiceContractModal.tsx",
  "src/components/customers/CustomersTable.tsx",
  "src/components/customers/CustomerCard.tsx",
  "src/components/customers/CompanyParserModal.tsx",
  "src/components/customers/ImportCustomersModal.tsx",
  "src/components/contacts/ContactCard.tsx",
  "src/components/contacts/ContactFormModal.tsx",
  "src/components/contacts/ContactsTable.tsx",
  "src/components/contacts/SignatureParserModal.tsx",
  "src/components/leads/LeadCard.tsx",
  "src/components/leads/LeadConversionModal.tsx",
  "src/components/leads/LeadEnrichmentModal.tsx",
  "src/components/leads/LeadFormModal.tsx",
  "src/components/leads/LeadsTable.tsx",
  "src/components/email/ComposeEmailModal.tsx",
  "src/components/email/ContactSuggestionsWidget.tsx",
  "src/components/email/EmailClient.tsx",
  "src/components/email/EmailDetail.tsx"
] as const;
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const localUtilities = {
  palette: /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/g,
  fontSize: /\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/g,
  typeScale: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
  radius: /\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/g,
  shadow: /\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/g,
};

describe('Customer, CRM communication and integration families share semantic tokens', () => {
  it.each(files)('%s consumes the centralized visual roles', path => {
    const content = read(path);
    for (const [name, expression] of Object.entries(localUtilities)) {
      expect(content.match(expression), `${path}: ${name}`).toBeNull();
    }
  });
  it('does not replace real user and data actions with fake fixtures', () => {
    const leaderboard = read('src/components/gamification/SalesLeaderboard.tsx');
    const activities = read('src/components/activities/ActivityModal.tsx');
    expect(leaderboard).toContain('getLeaderboard()');
    expect(activities).toContain('useState');
  });
});
