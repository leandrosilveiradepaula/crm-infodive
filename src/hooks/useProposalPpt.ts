import { useState } from 'react';
import { toast } from 'sonner';
import pptxgen from 'pptxgenjs';
import type { Deal } from '@/types/deal';
import type { Account } from '@/types/account';
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

export interface PptProposalData {
    proposal: any;
    deal: Deal;
    distributors?: Account[];
    sellerName?: string;
    clientLogo?: string;
}

export function useProposalPpt() {
    const [generatingPpt, setGeneratingPpt] = useState(false);

    const handleDownloadPpt = async (data: PptProposalData) => {
        const { proposal, deal, sellerName, clientLogo } = data;

        if (!proposal.content) {
            toast.error('Conteúdo da proposta não disponível para geração de PPT.');
            return;
        }

        setGeneratingPpt(true);
        const toastId = toast.loading('Gerando PowerPoint da proposta...');

        try {
            const pptx = new pptxgen();
            pptx.layout = 'LAYOUT_16x9';

            const config = proposal.content.config || {};
            const editableTexts = proposal.content.editableTexts || {};
            const activeSections = proposal.content.activeSections || [];
            const simplifiedProductNames = proposal.content.simplifiedProductNames || {};
            const primaryColor = config.themePrimary;
            const accentColor = config.themeAccent;

            const isSectionActive = (id: string, legacyFlag?: boolean) => {
                if (activeSections.length > 0) return activeSections.includes(id);
                return !!legacyFlag;
            };

            const date = new Date().toLocaleDateString('pt-BR');

            // 1. Cover
            if (isSectionActive('cover', config.includeCover)) {
                const coverData: CoverData = {
                    dealTitle: proposal.title || deal.title || '',
                    companyName: proposal.company_name || '',
                    date,
                    proposalTitle: config.customTitle || proposal.title || 'Proposta de Solução',
                    proposalNumber: proposal.number,
                    sellerName: sellerName || '',
                    clientLogo,
                    primaryColor,
                    accentColor,
                };
                buildCoverSlide(pptx, coverData);
            }

            // 2. Confidentiality
            if (isSectionActive('confidentiality', config.includeConfidentiality)) {
                buildConfidentialitySlide(pptx, primaryColor, accentColor);
            }

            // 3. Overview
            if (isSectionActive('overview', config.includeOverview)) {
                const overviewData: OverviewData = {
                    dealTitle: proposal.title || deal.title || '',
                    aiSummary: editableTexts.aiSummary || proposal.content.aiSummary,
                    objectives: proposal.content.objectives,
                    primaryColor,
                    accentColor,
                };
                buildOverviewSlide(pptx, overviewData);
            }

            // 4. Differentials
            if (isSectionActive('differentials', config.includeDifferentials)) {
                buildDifferentialsSlide(pptx, primaryColor, accentColor);
            }

            // 5. Hardware
            if (isSectionActive('hardware', config.includeHardware)) {
                const hwData: HardwareData = { deal, simplifiedProductNames, primaryColor, accentColor };
                buildHardwareSlides(pptx, hwData);
            }

            // 6. Software
            if (isSectionActive('software', config.includeSoftware)) {
                const swData: SoftwareData = { deal, simplifiedProductNames, primaryColor, accentColor };
                buildSoftwareSlides(pptx, swData);
            }

            // 7. Custom Notes
            if (isSectionActive('custom_notes')) {
                const notesTitle = editableTexts.customNotesTitle || 'Notas Adicionais';
                const notesContent = editableTexts.customNotesContent || '';
                buildCustomNotesSlide(pptx, notesTitle, notesContent, primaryColor, accentColor);
            }

            // 8. Investment
            if (isSectionActive('investment', config.includeInvestment)) {
                const invData: InvestmentData = {
                    deal,
                    simplifiedProductNames,
                    primaryColor,
                    accentColor,
                    showBillingInfo: config.showBillingInfo !== false,
                    quoteDisplayMode: config.quoteDisplayMode,
                    dealQuotes: deal.deal_quotes,
                };
                buildInvestmentSlides(pptx, invData);
            }

            const filename = `Proposta-${(proposal.company_name || proposal.title || 'Proposta').replace(/[^a-zA-Z0-9]/g, '-')}.pptx`;
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
