import { useState } from 'react';
import { toast } from 'sonner';
import pptxgen from 'pptxgenjs';
import { domToPng } from 'modern-screenshot';

export function useProposalPpt() {
    const [generatingPpt, setGeneratingPpt] = useState(false);

    const handleDownloadPpt = async (
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
            toast.error('Conteúdo da proposta não disponível para geração de PPT.');
            return;
        }

        setGeneratingPpt(true);
        const toastId = toast.loading('Gerando PowerPoint da proposta...');

        try {
            await new Promise(r => setTimeout(r, 1000)); // Wait for render

            const pptx = new pptxgen();
            
            // Define custom A4 Portrait layout to match the PDF/HTML design
            pptx.defineLayout({ name: 'A4', width: 8.27, height: 11.69 });
            pptx.layout = 'A4';
            
            const config = proposal.content.config || {};
            const editableTexts = proposal.content.editableTexts || {};
            const { coverRef, confidentialityRef, overviewRef, differentialsRef, hardwareRef, softwareRef, investmentRef } = refs;

            const processSlide = async (ref: React.RefObject<HTMLDivElement | null>, name: string, addOverlays?: (slide: pptxgen.Slide) => void) => {
                if (!ref.current) return;

                try {
                    const imgData = await domToPng(ref.current, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                        style: { width: '210mm', height: '297mm' }
                    });

                    if (!imgData || !imgData.startsWith('data:image/png;base64,')) {
                        console.warn(`[useProposalPpt] Capture for ${name} returned invalid image data.`);
                        return;
                    }

                    const slide = pptx.addSlide();
                    
                    // Add the captured image as the background/main content
                    // Since the capture is A4 (portrait) and PPT is 16:9 (landscape), 
                    // we'll center it or fit it depending on the page type.
                    // For now, let's fit it to the left or center.
                    slide.addImage({ 
                        data: imgData, 
                        x: 0, 
                        y: 0, 
                        w: 8.27, 
                        h: 11.69
                    });

                    // Add hybrid overlays if provided
                    if (addOverlays) {
                        addOverlays(slide);
                    }
                } catch (e) {
                    console.error(`Failed to capture ${name} for PPT`, e);
                }
            };

            // CAPA - Com textos editáveis sobrepostos
            if (config.includeCover && coverRef.current) {
                await processSlide(coverRef, 'cover', (slide) => {
                    // Main Title Overlay (approximate position for Cover)
                    slide.addText(editableTexts.proposalTitle || "Proposta de Solução", {
                        x: 1.0,
                        y: 3.2,
                        w: 5.0,
                        fontSize: 24,
                        bold: true,
                        color: '000000',
                        fontFace: 'Arial'
                    });

                    // Metadata Overlays
                    const metadataStyle = { fontSize: 11, color: '64748B', fontFace: 'Arial' };
                    
                    // Project Title
                    slide.addText(proposal.title || '', { x: 3.5, y: 4.85, w: 3, ...metadataStyle });
                    
                    // Company Name
                    slide.addText(proposal.company_name || 'Cliente', { x: 3.5, y: 5.35, w: 3, ...metadataStyle });
                    
                    // Date
                    slide.addText(new Date(proposal.createdAt).toLocaleDateString('pt-BR'), { x: 3.5, y: 6.35, w: 3, ...metadataStyle });

                    // Proposal Number
                    if (proposal.number) {
                        slide.addText(proposal.number, { x: 3.5, y: 6.9, w: 3, fontSize: 11, color: 'E31837', bold: true, fontFace: 'Arial' });
                    }
                });
            }

            // Other pages as pure images (to maintain complex layouts)
            if (config.includeConfidentiality && confidentialityRef.current) await processSlide(confidentialityRef, 'confidentiality');
            if (config.includeOverview && overviewRef.current) await processSlide(overviewRef, 'overview');
            if (config.includeDifferentials && differentialsRef.current) await processSlide(differentialsRef, 'differentials');
            if (config.includeHardware && hardwareRef.current) await processSlide(hardwareRef, 'hardware');
            if (config.includeSoftware && softwareRef.current) await processSlide(softwareRef, 'software');
            if (config.includeInvestment && investmentRef.current) await processSlide(investmentRef, 'investment');

            const filename = `Proposta-${(proposal.company_name || proposal.title).replace(/[^a-zA-Z0-9]/g, '-')}.pptx`;
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
