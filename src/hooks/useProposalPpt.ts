import { useState } from 'react';
import { toast } from 'sonner';
import pptxgen from 'pptxgenjs';
import type { Deal } from '@/types/deal';
import type { Account } from '@/types/account';
import { mapProposalToExportData, ExportProposalData } from '@/utils/proposalExportMapper';
import {
    buildCoverSlide,
    buildConfidentialitySlide,
    buildOverviewSlide,
    buildDifferentialsSlide,
    buildHardwareSlides,
    buildSoftwareSlides,
    buildInvestmentSlides,
    buildCustomNotesSlide,
    type CoverData,
    type OverviewData,
    type HardwareData,
    type SoftwareData,
    type InvestmentData,
} from '@/utils/pptSlideBuilders';

export function useProposalPpt() {
    const [generatingPpt, setGeneratingPpt] = useState(false);

    const handleDownloadPpt = async ({ proposal, deal, distributors, sellerName, clientLogo }: ExportProposalData) => {
        if (!proposal.content) {
            toast.error('Conteúdo da proposta não disponível para geração de PPT.');
            return;
        }

        setGeneratingPpt(true);
        const toastId = toast.loading('Gerando PowerPoint da proposta...');

        try {
            const pptx = new pptxgen();
            pptx.layout = 'LAYOUT_16x9';

            const exportData = mapProposalToExportData(proposal, deal, distributors || [], sellerName, clientLogo);

            const defaultOrder = ['cover', 'confidentiality', 'differentials', 'overview', 'hardware', 'software', 'custom_notes', 'investment'];
            
            const sectionsToRender = exportData.activeSections.length > 0 
                ? exportData.activeSections 
                : defaultOrder.filter(id => exportData.isSectionActive(id));

            sectionsToRender.forEach((sectionId: string) => {
                switch(sectionId) {
                    case 'cover':
                        const coverData: CoverData = {
                            dealTitle: exportData.title,
                            companyName: exportData.companyName,
                            date: exportData.date,
                            proposalTitle: proposal.title || 'Proposta de Solução',
                            proposalNumber: exportData.proposalNumber,
                            sellerName: exportData.sellerName,
                            clientLogo: exportData.clientLogo || undefined,
                            primaryColor: exportData.themePrimary,
                            accentColor: exportData.themeAccent,
                        };
                        buildCoverSlide(pptx, coverData);
                        break;
                    case 'confidentiality':
                        buildConfidentialitySlide(pptx, exportData.themePrimary, exportData.themeAccent);
                        break;
                    case 'overview':
                        const overviewData: OverviewData = {
                            dealTitle: exportData.title,
                            aiSummary: exportData.aiSummary,
                            objectives: exportData.objectives,
                            primaryColor: exportData.themePrimary,
                            accentColor: exportData.themeAccent,
                        };
                        buildOverviewSlide(pptx, overviewData);
                        break;
                    case 'differentials':
                        buildDifferentialsSlide(pptx, exportData.themePrimary, exportData.themeAccent);
                        break;
                    case 'hardware':
                        const hwData: HardwareData = {
                            deal: deal!,
                            primaryColor: exportData.themePrimary,
                            accentColor: exportData.themeAccent,
                        };
                        buildHardwareSlides(pptx, hwData);
                        break;
                    case 'software':
                        const swData: SoftwareData = {
                            deal: deal!,
                            primaryColor: exportData.themePrimary,
                            accentColor: exportData.themeAccent,
                        };
                        buildSoftwareSlides(pptx, swData);
                        break;
                    case 'custom_notes':
                        const editableTexts = proposal.content.editableTexts || {};
                        const notesTitle = editableTexts.customNotesTitle || 'Notas Adicionais';
                        const notesContent = editableTexts.customNotesContent || '';
                        buildCustomNotesSlide(pptx, notesTitle, notesContent, exportData.themePrimary, exportData.themeAccent);
                        break;
                    case 'investment':
                        const invData: InvestmentData = {
                            deal: deal!,
                            distributors: distributors || [],
                            billingOverrides: proposal.content?.billingOverrides || {},
                            primaryColor: exportData.themePrimary,
                            accentColor: exportData.themeAccent,
                            showBillingInfo: exportData.showBillingInfo,
                            quoteDisplayMode: exportData.quoteDisplayMode,
                        };
                        buildInvestmentSlides(pptx, invData);
                        break;
                }
            });

            const cleanNumber = (exportData.proposalNumber || 'Rascunho').replace(/[^a-zA-Z0-9-]/g, '');
            const cleanCompany = (exportData.companyName || 'Empresa').replace(/[^a-zA-Z0-9- ]/g, '').trim();
            const cleanTitle = (exportData.title || 'Solucao').replace(/[^a-zA-Z0-9- ]/g, '').trim();
            const filename = `Proposta_${cleanNumber}_${cleanCompany} - ${cleanTitle}.pptx`;
            await pptx.writeFile({ fileName: filename });

            toast.success('PowerPoint gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PPT:', error);
            toast.error('Falha ao gerar o PowerPoint. Tente novamente.', { id: toastId });
        } finally {
            setGeneratingPpt(false);
        }
    };

    return { generatingPpt, handleDownloadPpt };
}
