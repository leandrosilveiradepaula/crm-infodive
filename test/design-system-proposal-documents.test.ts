import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { proposalDocumentColors, proposalDocumentPrimitives } from '../src/design-system/proposal-document-colors';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const renderedDocuments = [
  'src/components/proposals/ProposalHardwareProduct.tsx',
  'src/components/proposals/ProposalInvestmentComponents.tsx',
  'src/components/proposals/ProposalInvestmentPage.tsx',
  'src/components/proposals/ProposalCoverPage.tsx',
  'src/components/proposals/ProposalHardwarePage.tsx',
  'src/components/proposals/pdf/pdfStyles.ts',
  'src/components/proposals/pdf/PdfInvestmentPage.tsx',
  'src/components/proposals/ProposalConfidentialityPage.tsx',
  'src/components/proposals/ProposalCustomNotesPage.tsx',
  'src/components/proposals/ProposalDifferentialsPage.tsx',
  'src/components/proposals/ProposalOverviewPage.tsx',
  'src/components/proposals/ProposalSoftwareComponents.tsx',
  'src/components/proposals/ProposalSoftwarePage.tsx',
  'src/components/proposals/pdf/PdfCoverPage.tsx',
  'src/components/proposals/pdf/PdfDifferentialsPage.tsx',
  'src/components/proposals/pdf/PdfHardwarePage.tsx',
  'src/components/proposals/pdf/PdfOverviewPage.tsx',
  'src/components/proposals/pdf/PdfSoftwarePage.tsx',
] as const;

describe('Commercial proposal paper and React PDF palette stays centrally configurable', () => {
  it.each(renderedDocuments)('%s imports one print-safe palette and does not redefine hex colors', path => {
    const code = source(path);
    expect(code).toContain("from '@/design-system/proposal-document-colors'");
    expect(code).toContain('proposalDocumentPrimitives');
    expect(code).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it('preserves the approved paper defaults and readable ink without browser dark mode', () => {
    expect(proposalDocumentColors).toEqual({
      primary: '#1e3a5f',
      accent: '#E31837',
      text: '#374151',
      textLight: '#64748b',
      textMuted: '#9ca3af',
      border: '#e5e7eb',
      borderLight: '#f1f5f9',
      bgLight: '#f8f9fa',
      bgLighter: '#f3f4f6',
      white: '#ffffff',
      black: '#111827',
      green: '#059669',
      emerald: '#16a34a',
      purple: '#7c3aed',
      cyan: '#0891b2',
      amber: '#b45309',
      yellowLight: '#fef3c7',
      yellowBorder: '#fde68a',
    });
    expect(proposalDocumentPrimitives.paperWhite).toBe('#ffffff');
  });

  it('retains organization primary/accent overrides in both preview and PDF export', () => {
    const pdf = source('src/components/proposals/pdf/pdfStyles.ts');
    expect(pdf).toContain('export const defaultColors = proposalDocumentColors;');
    expect(pdf).toContain('primary: themePrimary || defaultColors.primary');
    expect(pdf).toContain('accent: themeAccent || themePrimary || defaultColors.accent');
    const preview = source('src/components/proposals/ProposalInvestmentComponents.tsx');
    expect(preview).toContain('themePrimary || proposalDocumentPrimitives.defaultPrimary');
    expect(preview).toContain('themeAccent || proposalDocumentPrimitives.defaultAccent');
  });

  it('retains printed software/scope classification and PDF color-theme contracts', () => {
    const web = source('src/components/proposals/ProposalSoftwarePage.tsx');
    const software = source('src/components/proposals/ProposalSoftwareComponents.tsx');
    const pdf = source('src/components/proposals/pdf/PdfSoftwarePage.tsx');
    expect(web).toContain('themePrimary || proposalDocumentPrimitives.defaultPrimary');
    expect(software).toContain('themeAccent || proposalDocumentPrimitives.defaultAccent');
    expect(pdf).toContain('proposalDocumentPrimitives');
  });

  it('keeps financial proposal display and classification logic intact', () => {
    const preview = source('src/components/proposals/ProposalInvestmentComponents.tsx');
    expect(preview).toContain('buildProposalDisplayItem');
    expect(preview).toContain('formatProposalDisplayCurrency');
    const pdf = source('src/components/proposals/pdf/PdfInvestmentPage.tsx');
    expect(pdf).toContain('buildProposalDisplayGroups');
    expect(pdf).toContain('formatProposalDisplayCurrency');
  });
});
