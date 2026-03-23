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
            
            // Use standard Widescreen 16:9 layout for PPT
            pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
            
            const config = proposal.content.config || {};
            const editableTexts = proposal.content.editableTexts || {};
            const activeSections = proposal.content.activeSections || [];
            
            const isSectionActive = (id: string, legacyFlag?: boolean) => {
                if (activeSections.length > 0) return activeSections.includes(id);
                return !!legacyFlag;
            };
            const { coverRef, confidentialityRef, overviewRef, differentialsRef, hardwareRef, softwareRef, investmentRef } = refs;

            const processSlide = async (ref: React.RefObject<HTMLDivElement | null>, name: string, addOverlays?: (slide: pptxgen.Slide) => void) => {
                if (!ref.current) return;

                try {
                    const imgData = await domToPng(ref.current, {
                        scale: 2,
                        backgroundColor: '#ffffff'
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
                        w: 10, 
                        h: 5.625
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
            if (isSectionActive('cover', config.includeCover) && coverRef.current) {
                await processSlide(coverRef, 'cover', (slide) => {
                    // Main Title Overlay (approximate position for Cover)
                    slide.addText(editableTexts.proposalTitle || "Proposta de Solução", {
                        x: 0.44,
                        y: 1.35,
                        w: 6.0,
                        fontSize: 22,
                        bold: true,
                        color: '000000',
                        fontFace: 'Arial',
                        margin: 0,
                    });

                    // Metadata Overlays
                    const metadataStyle: pptxgen.TextPropsOptions = { fontSize: 10, color: '64748B', fontFace: 'Arial', margin: 0 };
                    
                    // Project Title (Row 1)
                    slide.addText(proposal.title || '', { x: 2.15, y: 3.04, w: 6, ...metadataStyle });
                    
                    // Company Name (Row 2)
                    slide.addText(proposal.company_name || 'Cliente', { x: 2.15, y: 3.38, w: 6, ...metadataStyle });
                    
                    // Date (Row 4)
                    slide.addText(new Date(proposal.createdAt).toLocaleDateString('pt-BR'), { x: 2.15, y: 4.06, w: 6, ...metadataStyle });

                    // Proposal Number (Row 5 - Optional)
                    if (proposal.number) {
                        slide.addText(proposal.number, { x: 2.15, y: 4.40, w: 6, fontSize: 11, color: 'E31837', bold: true, fontFace: 'Arial', margin: 0 });
                    }
                });
            }

            // Other pages as pure images (to maintain complex layouts)
            if (isSectionActive('confidentiality', config.includeConfidentiality) && confidentialityRef.current) await processSlide(confidentialityRef, 'confidentiality');
            if (isSectionActive('overview', config.includeOverview) && overviewRef.current) await processSlide(overviewRef, 'overview');
            if (isSectionActive('differentials', config.includeDifferentials) && differentialsRef.current) await processSlide(differentialsRef, 'differentials');
            if (isSectionActive('hardware', config.includeHardware) && hardwareRef.current) await processSlide(hardwareRef, 'hardware');
            if (isSectionActive('software', config.includeSoftware) && softwareRef.current) await processSlide(softwareRef, 'software');
            if (isSectionActive('investment', config.includeInvestment) && investmentRef.current) await processSlide(investmentRef, 'investment');

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
