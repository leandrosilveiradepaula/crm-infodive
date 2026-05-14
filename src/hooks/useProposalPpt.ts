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
        const { proposal, deal, sellerName, clientLogo, distributors } = data;

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

            const defaultOrder = ['cover', 'confidentiality', 'differentials', 'overview', 'hardware', 'software', 'custom_notes', 'investment'];
            
            const sectionsToRender = activeSections.length > 0 
                ? activeSections 
                : defaultOrder.filter(id => {
                    if (id === 'cover') return config.includeCover !== false;
                    if (id === 'confidentiality') return config.includeConfidentiality;
                    if (id === 'differentials') return config.includeDifferentials;
                    if (id === 'overview') return config.includeOverview;
                    if (id === 'hardware') return config.includeHardware;
                    if (id === 'software') return config.includeSoftware;
                    if (id === 'investment') return config.includeInvestment;
                    return false;
                });

            sectionsToRender.forEach((sectionId: string) => {
                switch(sectionId) {
                    case 'cover':
                        const coverData: CoverData = {
                            dealTitle: proposal.title || deal.title || '',
                            companyName: proposal.company_name || '',
                            date,
                            proposalTitle: proposal.title || 'Proposta de Solução',
                            proposalNumber: proposal.number,
                            sellerName: sellerName || '',
                            clientLogo,
                            primaryColor,
                            accentColor,
                        };
                        buildCoverSlide(pptx, coverData);
                        break;
                    case 'confidentiality':
                        buildConfidentialitySlide(pptx, primaryColor, accentColor);
                        break;
                    case 'overview':
                        const overviewData: OverviewData = {
                            dealTitle: proposal.title || deal.title || '',
                            aiSummary: editableTexts.aiSummary || proposal.content.aiSummary,
                            objectives: proposal.content.objectives,
                            primaryColor,
                            accentColor,
                        };
                        buildOverviewSlide(pptx, overviewData);
                        break;
                    case 'differentials':
                        buildDifferentialsSlide(pptx, primaryColor, accentColor);
                        break;
                    case 'hardware':
                        const hwData: HardwareData = { deal, simplifiedProductNames, primaryColor, accentColor };
                        buildHardwareSlides(pptx, hwData);
                        break;
                    case 'software':
                        const swData: SoftwareData = { deal, simplifiedProductNames, primaryColor, accentColor };
                        buildSoftwareSlides(pptx, swData);
                        break;
                    case 'custom_notes':
                        const notesTitle = editableTexts.customNotesTitle || 'Notas Adicionais';
                        const notesContent = editableTexts.customNotesContent || '';
                        buildCustomNotesSlide(pptx, notesTitle, notesContent, primaryColor, accentColor);
                        break;
                    case 'investment':
                        const invData: InvestmentData = {
                            deal,
                            simplifiedProductNames,
                            primaryColor,
                            accentColor,
                            showBillingInfo: config.showBillingInfo !== false,
                            quoteDisplayMode: config.quoteDisplayMode,
                            dealQuotes: deal.deal_quotes,
                            distributors: distributors,
                            billingOverrides: config.billingOverrides,
                        };
                        buildInvestmentSlides(pptx, invData);
                        break;
                }
            });

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
