import { useState } from 'react';
import { flushSync } from 'react-dom';
import jsPDF from 'jspdf';
import { domToJpeg } from 'modern-screenshot';
import { toast } from 'sonner';
import { createProposal } from '@/app/(dashboard)/pipeline/actions';
import type { Deal } from '@/types/deal';
import type { ProposalConfig } from '@/hooks/useProposalIntelligence';

interface UseProposalGeneratorProps {
    deal: Deal;
    config: ProposalConfig;
    selectedTemplate: string;
    onSuccess?: () => void;
    refs: {
        coverRef: React.RefObject<HTMLDivElement | null>;
        overviewRef: React.RefObject<HTMLDivElement | null>;
        hardwareRef: React.RefObject<HTMLDivElement | null>;
        softwareRef: React.RefObject<HTMLDivElement | null>;
        investmentRef: React.RefObject<HTMLDivElement | null>;
        differentialsRef: React.RefObject<HTMLDivElement | null>;
        confidentialityRef: React.RefObject<HTMLDivElement | null>;
    };
}

export function useProposalGenerator({ deal, config, selectedTemplate, onSuccess, refs }: UseProposalGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, analyzing_ai, capturing_pages, done
    const [aiSummary, setAiSummary] = useState('');
    const [objectives, setObjectives] = useState<any[]>([]);
    const [softwareHighlights, setSoftwareHighlights] = useState<any[]>([]);
    const [benefitTiles, setBenefitTiles] = useState<any[]>([]);
    const [proposalNumber, setProposalNumber] = useState<string>('');
    const [simplifiedProductNames, setSimplifiedProductNames] = useState<Record<string, string>>({});

    const handleAnalyzeAI = async () => {
        setLoading(true);
        setStatus('analyzing_ai');

        try {
            const aiRes = await fetch('/api/gemini/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealTitle: deal.title,
                    proposalTitle: config.customTitle,
                    company: deal.company,
                    dealValue: deal.value,
                    dealStage: deal.stage,
                    probability: deal.probability,
                    products: deal.deal_products || []
                })
            });

            if (!aiRes.ok) {
                const errData = await aiRes.json().catch(() => ({}));
                throw new Error(`Falha ao gerar conteúdo com IA: ${errData.error || aiRes.statusText}`);
            }

            const data = await aiRes.json();
            setAiSummary(data.summary || '');
            setObjectives(data.objectives || []);
            setSoftwareHighlights(data.softwareHighlights || []);
            setBenefitTiles(data.benefitTiles || []);
            setSimplifiedProductNames(data.simplifiedProductNames || {});

            // Also pre-generate proposal number
            try {
                const numRes = await fetch('/api/proposals/generate-number');
                if (numRes.ok) {
                    const { number } = await numRes.json();
                    setProposalNumber(number || '');
                }
            } catch (numErr) {
                console.warn('Could not generate proposal number:', numErr);
            }

            setStatus('idle');
            return true;
        } catch (error) {
            console.error('❌ AI Analysis error:', error);
            toast.error(error instanceof Error ? error.message : 'Erro na análise da IA');
            setStatus('idle');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePdf = async (customContent?: { aiSummary?: string; objectives?: any[] }) => {
        setLoading(true);
        setStatus('capturing_pages');

        try {
            // Apply custom/edited content if provided
            if (customContent?.aiSummary) setAiSummary(customContent.aiSummary);
            if (customContent?.objectives) setObjectives(customContent.objectives);

            // FORCE synchronous DOM update
            flushSync(() => {
                setStatus('capturing_pages');
            });

            // Gentle delay for images/fonts to settle after the forced DOM text update
            await new Promise(r => setTimeout(r, 1000));

            // 2. Capture Pages
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();

            let pageCount = 0;

            const captureAndAddVisualPage = async (element: HTMLElement, pageName: string) => {
                // Pre-check visibility and dimensions
                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    console.warn(`⚠️ Skipping capture for ${pageName}: Element has no dimensions.`);
                    return;
                }

                try {
                    const imgData = await domToJpeg(element, {
                        scale: 2,
                        quality: 0.95,
                        backgroundColor: '#ffffff',
                        style: { width: '210mm', height: '297mm' }
                    });

                    if (!imgData || !imgData.startsWith('data:image/')) {
                        console.error(`❌ Capture failed for ${pageName}: Invalid image data returned.`);
                        // Instead of throwing, we skip to avoid breaking the whole process
                        return;
                    }

                    if (pageCount > 0) pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, 0, width, height, undefined, 'FAST');
                    pageCount++;
                    console.log(`✅ Page added: ${pageName} (Total: ${pageCount})`);
                } catch (captureErr) {
                    console.error(`❌ Capture error on ${pageName}:`, captureErr);
                    // Continue with next page/component
                }
            };

            const captureComponent = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
                if (!ref.current) return;

                // Check if component actually rendered anything (to handle 'return null' in components)
                if (ref.current.children.length === 0) {
                    console.log(`ℹ️ Component ${name} has no content (rendered null), skipping...`);
                    return;
                }

                console.log(`📸 Processing component: ${name}...`);
                const subPages = ref.current.querySelectorAll('[data-proposal-page="true"]');

                if (subPages.length > 0) {
                    console.log(`📄 Found ${subPages.length} sub-pages in ${name}`);
                    for (let i = 0; i < subPages.length; i++) {
                        await captureAndAddVisualPage(subPages[i] as HTMLElement, `${name}_p${i + 1}`);
                    }
                } else {
                    await captureAndAddVisualPage(ref.current, name);
                }
            };

            const { coverRef, confidentialityRef, differentialsRef, overviewRef, hardwareRef, softwareRef, investmentRef } = refs;

            if (config.includeCover && coverRef.current) await captureComponent(coverRef, 'cover');
            if (config.includeConfidentiality && confidentialityRef.current) await captureComponent(confidentialityRef, 'confidentiality');
            if (config.includeDifferentials && differentialsRef.current) await captureComponent(differentialsRef, 'differentials');
            if (config.includeOverview && overviewRef.current) await captureComponent(overviewRef, 'overview');
            if (config.includeHardware && hardwareRef.current) await captureComponent(hardwareRef, 'hardware');
            if (config.includeSoftware && softwareRef.current) await captureComponent(softwareRef, 'software');
            if (config.includeInvestment && investmentRef.current) await captureComponent(investmentRef, 'investment');

            const filename = `Proposta-${deal.company.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
            pdf.save(filename);

            // 3. Save to Database
            console.log('💾 Saving proposal to database...');

            const proposalResult = await createProposal({
                deal_id: deal.id,
                title: config.customTitle || `Proposta: ${deal.title}`,
                total: deal.value,
                subtotal: deal.value,
                template_id: selectedTemplate,
                status: 'draft',
                account_id: deal.account_id,
                company_name: deal.company,
                number: proposalNumber || undefined, // already generated before capture; DB RPC as fallback
                products_json: deal.deal_products,
                version: 1,
                content_json: {
                    aiSummary: customContent?.aiSummary || aiSummary,
                    objectives: customContent?.objectives || objectives,
                    config,
                    generatedAt: new Date().toISOString(),
                    products: deal.deal_products,
                    dealProbability: deal.probability
                }
            });

            console.log('✅ Proposal saved successfully:', proposalResult.id, 'number:', proposalResult.number);
            // Sync number from DB result in case it was generated server-side as fallback
            if (proposalResult.number && !proposalNumber) {
                setProposalNumber(proposalResult.number);
            }
            toast.success('Proposta gerada e salva com sucesso!');
            setStatus('done');
            if (onSuccess) onSuccess();

            return true;
        } catch (error) {
            console.error('❌ PDF Generation error:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao gerar PDF');
            setStatus('idle');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        handleAnalyzeAI,
        handleGeneratePdf,
        loading,
        status,
        setStatus,
        aiSummary,
        setAiSummary,
        objectives,
        setObjectives,
        softwareHighlights,
        setSoftwareHighlights,
        benefitTiles,
        setBenefitTiles,
        simplifiedProductNames,
        proposalNumber,
        setProposalNumber
    };
}
