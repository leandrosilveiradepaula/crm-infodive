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

import { UnifiedExportData } from '@/utils/proposalExportMapper';

interface ProposalPdfDocumentProps {
    exportData: UnifiedExportData;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    }).format(value);
}

export function ProposalPdfDocument({
    exportData
}: ProposalPdfDocumentProps) {
    const today = exportData.date;

    const pdfColors = getPdfColors(exportData.themePrimary, exportData.themeAccent);
    const pdfStyles = getPdfStyles(pdfColors);

    const sectionComponents: Record<SectionId, React.ReactNode> = {
        cover: (
            <PdfCoverPage
                dealTitle={exportData.title}
                companyName={exportData.companyName}
                date={today}
                proposalTitle={exportData.title}
                proposalNumber={exportData.proposalNumber}
                clientLogo={exportData.clientLogo || undefined}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        confidentiality: (
            <PdfConfidentialityPage
                confidentialityText={exportData.confidentialityText || ''}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        overview: (
            <PdfOverviewPage
                dealTitle={exportData.title}
                aiSummary={exportData.aiSummary}
                objectives={exportData.objectives}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        hardware: (
            <PdfHardwarePage 
                products={exportData.allProducts}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        software: (
            <PdfSoftwarePage
                products={exportData.allProducts}
                softwareHighlights={exportData.softwareHighlights}
                benefitTiles={exportData.benefitTiles}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        investment: (
            <PdfInvestmentPage
                exportData={exportData}
                formatCurrency={formatCurrency}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        differentials: (
            <PdfDifferentialsPage
                differentials={exportData.differentials || []}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
        custom_notes: (
            <PdfCustomNotesPage
                title={exportData.customNotesTitle || 'Notas Adicionais'}
                content={exportData.customNotesContent || ''}
                pdfColors={pdfColors}
                pdfStyles={pdfStyles}
                layout={exportData.layout}
            />
        ),
    };

    return (
        <Document>
            {exportData.activeSections.map(sectionId => (
                <React.Fragment key={sectionId}>
                    {sectionComponents[sectionId as SectionId]}
                </React.Fragment>
            ))}
        </Document>
    );
}
