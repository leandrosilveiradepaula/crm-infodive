import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { SectionId, EditableTexts, EditorConfig } from '@/hooks/useProposalEditorState';
import { PdfCoverPage } from './PdfCoverPage';
import { PdfConfidentialityPage } from './PdfConfidentialityPage';
import { PdfOverviewPage } from './PdfOverviewPage';
import { PdfHardwarePage } from './PdfHardwarePage';
import { PdfSoftwarePage } from './PdfSoftwarePage';
import { PdfInvestmentPage } from './PdfInvestmentPage';
import { PdfDifferentialsPage } from './PdfDifferentialsPage';
import { PdfCustomNotesPage } from './PdfCustomNotesPage';
import { sortProductsHierarchically } from '@/utils/productSorting';
import { getPdfColors, getPdfStyles } from './pdfStyles';

interface ProposalPdfDocumentProps {
    // Deal data
    dealTitle: string;
    companyName: string;
    products: any[];
    proposalNumber?: string;

    // Editor state
    activeSections: SectionId[];
    editableTexts: EditableTexts;
    config: EditorConfig;
    aiSummary?: string;
    objectives?: any[];
    simplifiedProductNames?: Record<string, string>;

    // AI content
    softwareHighlights?: Array<{ title: string; value: string }>;
    benefitTiles?: Array<{ value: string; label: string }>;

    // Billing
    distributors?: any[];

    // Theme
    themePrimary?: string;
    themeAccent?: string;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    }).format(value);
}

export function ProposalPdfDocument({
    dealTitle,
    companyName,
    products,
    proposalNumber,
    activeSections,
    editableTexts,
    config,
    aiSummary,
    softwareHighlights,
    benefitTiles,
    distributors,
    themePrimary,
    themeAccent,
    objectives,
    simplifiedProductNames,
}: ProposalPdfDocumentProps) {
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    const pdfColors = getPdfColors(themePrimary, themeAccent);
    const pdfStyles = getPdfStyles(pdfColors);

    const sortedProducts = sortProductsHierarchically(products);

    const sectionComponents: Record<SectionId, React.ReactNode> = {
        cover: (
            <PdfCoverPage
                dealTitle={dealTitle}
                companyName={companyName}
                date={today}
                proposalTitle={editableTexts.proposalTitle}
                proposalNumber={proposalNumber}
                clientLogo={config.clientLogo}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        confidentiality: (
            <PdfConfidentialityPage
                confidentialityText={editableTexts.confidentialityText}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        overview: (
            <PdfOverviewPage
                dealTitle={dealTitle}
                aiSummary={config.includeAISummary ? aiSummary : undefined}
                objectives={objectives}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        hardware: (
            <PdfHardwarePage 
                products={sortedProducts}
                simplifiedProductNames={simplifiedProductNames}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        software: (
            <PdfSoftwarePage
                products={sortedProducts}
                simplifiedProductNames={simplifiedProductNames}
                softwareHighlights={softwareHighlights}
                benefitTiles={benefitTiles}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        investment: (
            <PdfInvestmentPage
                products={sortedProducts}
                simplifiedProductNames={simplifiedProductNames}
                showBillingInfo={config.showBillingInfo}
                isPriceStudy={config.isPriceStudy}
                priceStudyValidity={editableTexts.priceStudyValidity}
                formatCurrency={formatCurrency}
                distributors={distributors}
                billingOverrides={config.billingOverrides || {}}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        differentials: (
            <PdfDifferentialsPage
                differentials={editableTexts.differentials}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
        custom_notes: (
            <PdfCustomNotesPage
                title={editableTexts.customNotesTitle}
                content={editableTexts.customNotesContent}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
            />
        ),
    };

    return (
        <Document>
            {activeSections.map(sectionId => (
                <React.Fragment key={sectionId}>
                    {sectionComponents[sectionId]}
                </React.Fragment>
            ))}
        </Document>
    );
}
