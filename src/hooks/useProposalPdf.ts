import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { domToPng } from 'modern-screenshot';

export function useProposalPdf() {
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const handleDownload = async (
        proposal: any,
        refs: {
            coverRef: React.RefObject<HTMLDivElement | null>;
            overviewRef: React.RefObject<HTMLDivElement | null>;
            hardwareRef: React.RefObject<HTMLDivElement | null>;
            softwareRef: React.RefObject<HTMLDivElement | null>;
            investmentRef: React.RefObject<HTMLDivElement | null>;
            differentialsRef: React.RefObject<HTMLDivElement | null>;
            confidentialityRef: React.RefObject<HTMLDivElement | null>;
        }
    ) => {
        if (!proposal.content) {
            toast.error('Conteúdo da proposta não disponível para geração de PDF.');
            return;
        }

        setGeneratingPdf(true);
        const toastId = toast.loading('Gerando PDF da proposta...');

        try {
            await new Promise(r => setTimeout(r, 1000)); // Wait for render

            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();
            const config = proposal.content.config || {};
            const activeSections = proposal.content.activeSections || [];
            
            const isSectionActive = (id: string, legacyFlag?: boolean) => {
                if (activeSections.length > 0) return activeSections.includes(id);
                return !!legacyFlag;
            };

            let pageAdded = false;

            const processPage = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
                if (!ref.current) return;

                try {
                    const imgData = await domToPng(ref.current, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        style: { width: '210mm', height: '297mm' }
                    });

                    // Validate that domToPng actually generated a valid PNG base64 string
                    // Empty or 0x0 size elements can return "data:," which crashes jsPDF
                    if (!imgData || !imgData.startsWith('data:image/png;base64,')) {
                        console.warn(`[useProposalPdf] Capture for ${name} returned invalid image data (likely empty). Skipping.`);
                        return;
                    }

                    if (pageAdded) {
                        pdf.addPage();
                    }

                    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
                    pageAdded = true;
                } catch (e) {
                    console.error(`Failed to capture ${name}`, e);
                    toast.error(`Erro ao gerar página: ${name}`);
                }
            };

            const { coverRef, confidentialityRef, overviewRef, differentialsRef, hardwareRef, softwareRef, investmentRef } = refs;

            if (isSectionActive('cover', config.includeCover) && coverRef.current) await processPage(coverRef, 'cover');
            if (isSectionActive('confidentiality', config.includeConfidentiality) && confidentialityRef.current) await processPage(confidentialityRef, 'confidentiality');
            if (isSectionActive('overview', config.includeOverview) && overviewRef.current) await processPage(overviewRef, 'overview');
            if (isSectionActive('differentials', config.includeDifferentials) && differentialsRef.current) await processPage(differentialsRef, 'differentials');
            if (isSectionActive('hardware', config.includeHardware) && hardwareRef.current) await processPage(hardwareRef, 'hardware');
            if (isSectionActive('software', config.includeSoftware) && softwareRef.current) await processPage(softwareRef, 'software');
            if (isSectionActive('investment', config.includeInvestment) && investmentRef.current) await processPage(investmentRef, 'investment');

            const filename = `Proposta-${(proposal.company_name || proposal.title).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
            pdf.save(filename);
            toast.success('PDF gerado com sucesso!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Falha ao gerar o PDF. Tente novamente.', { id: toastId });
        } finally {
            setGeneratingPdf(false);
        }
    };

    return { generatingPdf, handleDownload };
}
