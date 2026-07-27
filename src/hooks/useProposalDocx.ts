import { useState } from 'react';
import { toast } from 'sonner';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { mapProposalToExportData, ExportProposalData } from '@/utils/proposalExportMapper';
import { PremiumDocxBuilder } from '@/utils/docxBuilder';

export function useProposalDocx() {
    const [generatingDocx, setGeneratingDocx] = useState(false);

    const handleDownloadDocx = async ({ proposal, deal, distributors, sellerName, clientLogo }: ExportProposalData) => {
        if (!proposal.content) {
            toast.error('Conteúdo da proposta não disponível para geração de DOCX.');
            return;
        }

        setGeneratingDocx(true);
        const toastId = toast.loading('Gerando Documento Word Premium...');

        try {
            // Use the unified mapper to extract and shape all data
            const exportData = mapProposalToExportData(proposal, deal, distributors, sellerName, clientLogo);
            const content = proposal.content || {};
            const config = content.config || {};

            // Helper to load images safely
            const loadImage = async (url: string): Promise<Uint8Array | null> => {
                try {
                    // Ensure absolute URL for relative paths if in browser
                    const isBrowser = typeof window !== 'undefined';
                    const requestUrl = (isBrowser && url.startsWith('/')) ? `${window.location.origin}${url}` : url;
                    
                    const response = await fetch(requestUrl);
                    if (!response.ok) throw new Error(`Status: ${response.status}`);
                    const buffer = await response.arrayBuffer();
                    return new Uint8Array(buffer);
                } catch (error) {
                    console.error(`[useProposalDocx] Failed to load image from ${url}:`, error);
                    return null;
                }
            };

            const logoBuffer = await loadImage('/assets/logo-infodive.png');
            const dataCenterBuffer = await loadImage('/assets/datacenter-corridor.jpg');
            const clientLogoBuffer = config.clientLogo ? await loadImage(config.clientLogo) : null;

            // Delegate building the document to the PremiumDocxBuilder
            const doc = PremiumDocxBuilder.build({
                exportData,
                proposal,
                logoBuffer,
                dataCenterBuffer,
                clientLogoBuffer
            });

            const buffer = await Packer.toBlob(doc);
            const filename = `Proposta-Infodive-${(proposal.company_name || proposal.title).replace(/[^a-zA-Z0-9]/g, '-')}.docx`;
            saveAs(buffer, filename);
            
            toast.success('Documento Word de Alta Fidelidade gerado!', { id: toastId });
        } catch (error) {
            console.error('Erro ao gerar DOCX Premium:', error);
            toast.error('Falha ao gerar o Word Premium.', { id: toastId });
        } finally {
            setGeneratingDocx(false);
        }
    };

    return { generatingDocx, handleDownloadDocx };
}
