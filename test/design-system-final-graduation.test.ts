import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { inspectVisualSourceDebt, fullyMigratedModules } from '../scripts/check-design-token-policy.mjs';
import { proposalDocumentBand, proposalDocumentPrimitives } from '../src/design-system/proposal-document-colors';
import { organizationBrandDefaults, dealRoomDefaultThemeColor, pipelineStageDefaultColor } from '../src/design-system/domain-visual-defaults';

describe('DS12 final source graduation gate', () => {
  it('requires zero categorized local visual decisions across the full existing source inventory', () => {
    expect(inspectVisualSourceDebt()).toEqual([]);
  });
  it('protects every file from the final 180-decision inventory', () => {
    const newlyMigrated = [
  "src/components/pipeline/ai/DealDoctorFinal.tsx",
  "src/app/(dashboard)/dashboard/client-page.tsx",
  "src/components/pipeline/ViewDealModal.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/alert.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/badge.tsx",
  "src/components/ui/checkbox.tsx",
  "src/components/ui/label.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/tabs.tsx",
  "src/components/ui/textarea.tsx",
  "src/components/ui/tooltip.tsx",
  "src/app/(dashboard)/settings/client-page.tsx",
  "src/components/pipeline/ai/AIDealSummaryHeader.tsx",
  "src/components/ui/PremiumEmptyState.tsx",
  "src/app/portal/[id]/page.tsx",
  "src/app/proposals/public/[token]/page.tsx",
  "src/components/charts/AccessibleChart.tsx",
  "src/components/proposals/pdf/PdfCustomNotesPage.tsx",
  "src/components/layout/Header.tsx",
  "src/app/debug/page.tsx",
  "src/components/proposals/ProposalContentPage.tsx",
  "src/app/(dashboard)/activities/components/ActivityModal.tsx",
  "src/app/(dashboard)/integrations/client-page.tsx",
  "src/app/(dashboard)/reports/client-page.tsx",
  "src/app/login/page.tsx",
  "src/app/(dashboard)/service-desk/page.tsx",
  "src/components/activities/ActivityModal.tsx",
  "src/components/automations/NewAutomationModal.tsx",
  "src/components/charts/ProductAnalysis.tsx",
  "src/components/charts/RevenueForecast.tsx",
  "src/components/charts/SalesPerformance.tsx",
  "src/components/contacts/SignatureParserModal.tsx",
  "src/components/contracts/ContractBuilder.tsx",
  "src/components/contracts/SignaturePad.tsx",
  "src/components/customers/CompanyParserModal.tsx",
  "src/components/customers/ImportCustomersModal.tsx",
  "src/components/layout/NotificationCenter.tsx",
  "src/components/leads/LeadConversionModal.tsx",
  "src/components/leads/LeadEnrichmentModal.tsx",
  "src/components/omnichannel/SmartTimeline.tsx",
  "src/components/pipeline/ai/AIEmailDrafter.tsx",
  "src/components/portal/DealRoomPortal.tsx",
  "src/components/products/ProductFormModal.tsx",
  "src/components/proposals/TemplateCard.tsx",
  "src/components/settings/PipelineSettings.tsx",
  "src/components/proposals/ProposalConfidentialityPage.tsx",
  "src/components/proposals/ProposalCoverPage.tsx",
  "src/components/proposals/ProposalCustomNotesPage.tsx",
  "src/components/proposals/ProposalDifferentialsPage.tsx",
  "src/components/proposals/ProposalHardwarePage.tsx",
  "src/components/proposals/ProposalInvestmentPage.tsx",
  "src/components/proposals/ProposalOverviewPage.tsx",
  "src/components/proposals/ProposalSoftwarePage.tsx",
  "src/components/settings/ArchiveUserModal.tsx",
  "src/components/settings/SecurityTab.tsx",
  "src/app/(dashboard)/inbox/page.tsx"
];
    for (const file of newlyMigrated) expect(fullyMigratedModules).toContain(file);
  });
  it('preserves editable domain color defaults and print-specific exact color/gradient values', () => {
    expect(organizationBrandDefaults).toEqual({ primary: '#3b82f6', secondary: '#1e293b' });
    expect(dealRoomDefaultThemeColor).toBe('#0f62fe');
    expect(pipelineStageDefaultColor).toBe('#888888');
    expect(proposalDocumentPrimitives.paperWhite).toBe('#ffffff');
    expect(proposalDocumentPrimitives.trueBlack).toBe('#000000');
    expect(proposalDocumentBand('#E31837', '#1e3a5f')).toBe('linear-gradient(90deg, #E31837 0%, #1e3a5f 100%)');
    const source = (file: string) => readFileSync(file, 'utf8');
    expect(source('src/components/proposals/ProposalCoverPage.tsx')).toContain('proposalDocumentBand(accentColor, primaryColor)');
    expect(source('src/components/proposals/pdf/PdfCustomNotesPage.tsx')).toContain('proposalDocumentPrimitives.slate700');
    expect(source('src/components/contracts/SignaturePad.tsx')).toContain('proposalDocumentPrimitives.paperWhite : proposalDocumentPrimitives.trueBlack');
    expect(source('src/components/settings/PipelineSettings.tsx')).toContain('color: pipelineStageDefaultColor');
  });
});
