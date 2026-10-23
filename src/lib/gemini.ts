import { PRODUCT_CATEGORIES, DEAL_HEALTH_STATUS } from './constants';
import { parseDealDiagnosis } from './deal-diagnosis-validation';

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
    // Server-side authorization and tenant-scoped context are authoritative.
    // Never transmit client-supplied deal attributes or activities as AI context.
    let response: Response;
    try {
        response = await fetch('/api/gemini/analyze-deal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deal: { id: deal.id } }),
        });
    } catch {
        throw new Error('Não foi possível concluir o diagnóstico. Tente novamente.');
    }

    if (!response.ok) {
        // Do not display arbitrary error bodies or invent local health scores.
        throw new Error('Não foi possível concluir o diagnóstico. Tente novamente.');
    }

    let result: unknown;
    try {
        result = await response.json();
    } catch {
        throw new Error('A integração de IA retornou uma análise inválida.');
    }

    const validated = parseDealDiagnosis(result);
    if (!validated) {
        throw new Error('A integração de IA retornou uma análise inválida.');
    }
    return validated;
};

export const generateFollowUpEmail = async (deal: Deal): Promise<string> => {
    const response = await fetch('/api/gemini/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId: deal.id })
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Não foi possível gerar o e-mail de follow-up.');
    }

    const payload = await response.json();
    if (!payload.email || typeof payload.email !== 'string') {
        throw new Error('A integração de IA retornou uma resposta inválida.');
    }

    return payload.email;
};

export const runCRMConsultantChat = async (
    history: { role: string, content: string }[],
    signal?: AbortSignal
): Promise<string> => {
    const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
        signal,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Não foi possível consultar o assistente.');
    }

    const payload = await response.json();
    if (!payload.message || typeof payload.message !== 'string') {
        throw new Error('A integração de IA retornou uma resposta inválida.');
    }

    return payload.message;
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

