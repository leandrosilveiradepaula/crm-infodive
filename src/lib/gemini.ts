import { PRODUCT_CATEGORIES, DEAL_HEALTH_STATUS } from './constants';

export interface ProductExtraction {
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
}

/**
 * Extrai produtos de uma imagem usando a API interna do Gemini
 */
export const extractProductsFromImage = async (file: File): Promise<ProductExtraction[]> => {
    console.log('[GeminiLib] product extraction request preparation started');
    
    if (!file || file.size === 0) {
        throw new Error(`Arquivo vazio ou corrompido (tamanho = 0 bytes). Verifique se o arquivo não está corrompido.`);
    }

    // Converter arquivo para base64
    const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });

    const imageData = base64Data.split(',')[1]; // Remove prefixo data:image/...

    console.log('[GeminiLib] product extraction payload prepared');
    console.log('[GeminiLib] product extraction image data prepared');

    try {
        const payload = {
            imageData: imageData || "",
            mimeType: file.type || 'application/pdf'
        };

        const response = await fetch('/api/gemini/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            await response.json();
            throw new Error('Não foi possível concluir a operação com IA.');
        }

        const { products } = await response.json();
        return products;

    } catch {
        console.error('[GeminiLib] product extraction failed');
        throw new Error('Não foi possível concluir a operação com IA.');
    }
};

/**
 * Gera resumo executivo para proposta via API interna
 */
export const generateProposalSummary = async (request: any): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/proposal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            await response.json();
            throw new Error('Não foi possível concluir a operação com IA.');
        }

        const { summary } = await response.json();
        return summary;

    } catch {
        console.error('[GeminiLib] proposal summary generation failed');
        throw new Error('Não foi possível concluir a operação com IA.');
    }
};

/**
 * Cura especificações de hardware via API interna
 */
export const curateHardwareSpecs = async (request: any): Promise<any[]> => {
    try {
        const response = await fetch('/api/gemini/specs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            await response.json();
            throw new Error('Não foi possível concluir a operação com IA.');
        }

        const { specs } = await response.json();
        return specs;

    } catch (error: any) {
        console.error('[GeminiLib] hardware specs curation failed');
        return []; // Fallback para vazio em caso de erro de API
    }
};

/**
 * Interface definition for DealAnalysis
 */
export interface DealAnalysis {
    status: 'healthy' | 'at_risk' | 'urgent';
    healthScore: number; // 1-100
    trend: 'stable' | 'improving' | 'declining';
    riskFactors: string[];
    insights: string[];
    recommendations: string[];
    nextSteps: string[];
}

import type { Deal } from '@/types/deal';

/**
 * Analisa o deal e fornece insights de saúde e recomendações
 */
export const analyzeDeal = async (deal: Deal): Promise<DealAnalysis> => {
    try {
        const response = await fetch('/api/gemini/analyze-deal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deal: {
                    title: deal.title,
                    company_name: deal.company,
                    value: deal.value,
                    stage: deal.stage,
                    days_in_stage: deal.days_in_stage,
                    probability: deal.probability
                },
                activities: deal.deal_activities || []
            })
        });

        if (!response.ok) {
            await response.json().catch(() => ({}));
            throw new Error('Não foi possível concluir a operação com IA.');
        }

        const analysis = await response.json();

        return analysis;

    } catch {
        console.error('[GeminiLib] deal analysis fallback used');

        // Fallback para lógica local em caso de erro da API
        const activitiesCount = deal.deal_activities?.length || 0;
        // @ts-ignore
        const lastActivityDate = deal.deal_activities?.[0]?.created_at;
        const daysSinceLastActivity = lastActivityDate
            ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

        const daysInStage = deal.days_in_stage || 0;
        const status = daysInStage > 30 || daysSinceLastActivity > 14
            ? 'urgent'
            : daysInStage > 14 || daysSinceLastActivity > 7
                ? 'at_risk'
                : 'healthy';

        const healthScore = status === 'healthy' ? 8 : status === 'at_risk' ? 5 : 3;

        return {
            status,
            healthScore,
            trend: status === 'healthy' ? 'improving' : status === 'at_risk' ? 'stable' : 'declining',
            riskFactors: [
                'Análise offline (API indisponível)',
                'Dados podem estar desatualizados'
            ],
            insights: [
                `Deal está há ${daysInStage} dias no estágio "${deal.stage}"`,
                activitiesCount > 0 ? `${activitiesCount} atividades registradas` : 'Nenhuma atividade registrada',
                'Fallback: Análise offline (API indisponível)'
            ],
            recommendations: [
                'Verificar conexão com internet',
                'Tentar novamente em instantes',
                'Revisar dados manualmente'
            ],
            nextSteps: [
                'Contatar suporte se o erro persistir',
                'Atualizar status do deal'
            ]
        };
    }
};

export const generateFollowUpEmail = async (deal: Deal): Promise<string> => {
    // Mock implementation - TODO: migrate to backend API for full AI capabilities
    return `Olá ${deal.contact_name || 'equipe'},

Espero que estejam bem!

Gostaria de fazer um follow-up sobre nossa proposta de ${deal.title} no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}.

Estamos à disposição para esclarecer qualquer dúvida e ajustar a proposta conforme necessário.

Aguardo seu retorno.

Atenciosamente,
Equipe IBM/Lenovo`;
};

export const runCRMConsultantChat = async (history: { role: string, content: string }[], context: string): Promise<string> => {
    // Mock chat response - TODO: migrate to backend for full AI chat capabilities
    return "Olá! Sou o Watson AI. Para habilitar respostas inteligentes, configure a integração com o backend. Por enquanto, você pode usar o Command Bar (Ctrl+K) para buscar informações do CRM.";
};

/**
 * Faz o parse de uma assinatura de email usando a API do Gemini
 */
export const parseContactSignature = async (signature: string): Promise<any> => {
    try {
        const response = await fetch('/api/gemini/parse-signature', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ signature })
        });

        if (!response.ok) {
            await response.json();
            throw new Error('Não foi possível concluir a operação com IA.');
        }

        const { data } = await response.json();
        return data;

    } catch {
        console.error('[GeminiLib] signature processing failed');
        throw new Error('Não foi possível concluir a operação com IA.');
    }
};

