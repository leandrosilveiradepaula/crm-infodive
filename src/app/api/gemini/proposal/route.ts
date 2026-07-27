import { requireSessionContext } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;

type ProposalProduct = {
    name: string;
    quantity: number;
    is_optional?: boolean;
    description?: string;
};

export async function POST(request: Request) {
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const { dealTitle, proposalTitle, company, products, dealValue, dealStage, probability, context } = await request.json();

        // Format currency for Brazilian Real
        const formatCurrency = (value: number) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        };

        // Parse and enrich product list including bundle details and optional flag
        const enrichedProductList = products.map((p: ProposalProduct) => {
            const productInfo = `📦 **${p.name}** (Qtd: ${p.quantity})${p.is_optional ? ' [ITEM OPCIONAL / ALTERNATIVA]' : ''}`;

            // Try to parse description
            if (p.description) {
                // ... (lines 32-46 preserved)
            }
            return productInfo;
        }).join('\n\n');

        const prompt = `
Você é um especialista em vendas corporativas B2B de tecnologia com mais de 15 anos de experiência, especializado em soluções de infraestrutura corporativa (Storage, Servidores e Software).

CONTEXTO DA PROPOSTA:
- Cliente: ${company}
- Título/Objetivo da Proposta: ${proposalTitle || dealTitle}
- Projeto Original: ${dealTitle}
${dealStage ? `- Estágio do Deal: ${dealStage}` : ''}
${context ? `- Contexto Adicional: ${context}` : ''}

LISTA DE PRODUTOS E CONFIGURAÇÕES:
${enrichedProductList}

TAREFA:
1. Escreva um resumo executivo profissional, persuasivo e CONCISO de até 800 caracteres.
2. Gere 4 "Objetivos do Projeto" estratégicos e personalizados para este cliente e solução.
3. Identifique o software principal e gere:
   - 2 "Destaques Técnicos" (Highlights).
   - 3 "Tiles de Benefícios" (Benefit Tiles).
4. Simplifique os nomes dos produtos listados (Hardware e Software) para que sejam amigáveis e compreensíveis por um cliente não técnico (ex: Traduzir "9846-AF8" ou codigos complexos para "IBM FlashSystem 5200" ou similar).

DIRETRIZES PARA OS DESTAQUES TÉCNICOS:
- Devem ser curtos e focados em valor técnico.
- Exemplo 1 (Spectrum Control): Titulo: "Gestão Unificada", Valor: "Visibilidade completa de storage heterogêneo em um único painel."

DIRETRIZES PARA OS TILES DE BENEFÍCIOS (CARTÕES):
- Devem ser 3 itens.
- Cada item deve ter um "value" (ex: "100%", "24/7", "∞", "Zero") e um "label" (ex: "Licenciamento Legal", "Suporte", "Latência").
- O terceiro item NÃO deve ser "VMs Ilimitadas" a menos que seja Windows Server Datacenter. Seja criativo para outros softwares (ex: para Spectrum Control use "Audit Ready" ou "ROI 100%").

SAÍDA DESEJADA (JSON):
Retorne APENAS um objeto JSON com esta estrutura:
{
  "summary": "Texto do resumo executivo aqui...",
  "objectives": [
    { "number": "01", "title": "Título Curto", "description": "Descrição de uma frase" },
    { "number": "02", "title": "Título Curto", "description": "Descrição de uma frase" },
    { "number": "03", "title": "Título Curto", "description": "Descrição de uma frase" },
    { "number": "04", "title": "Título Curto", "description": "Descrição de uma frase" }
  ],
  "softwareHighlights": [ ... ],
  "benefitTiles": [ ... ],
  "simplifiedProductNames": {
    "Nome Original Exato do Produto 1": "Nome Simplificado Amigável 1",
    "Nome Original Exato do Produto 2": "Nome Simplificado Amigável 2"
  }
}

IMPORTANTE:
- ESCREVA O RESUMO EXECUTIVO SEM QUEBRAS DE LINHA REAIS (raw line breaks). Se precisar separar parágrafos, utilize obrigatoriamente a notação de controle escapada '\\n'.
- Não use bullet points no resumo.
- É ESTIRAMENTE PROIBIDO mencionar valores financeiros (R$), preços, "margens de lucro", termos internos ou "probabilidade de fechamento" no texto gerado, pois este documento será entregue ao cliente e esta página é apenas um resumo executivo da solução.
- Seja técnico, objetivo e persuasivo.
- Retorne APENAS o JSON puro e válido, sem blocos de código ("\`\`\`json").
`;

        console.log('🤖 Gerando resumo e highlights de software com Gemini...');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao gerar resumo da proposta');
        }

        const data = await response.json();
        let contentText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!contentText) {
            throw new Error('A API retornou uma resposta vazia.');
        }

        // Removendo possíveis marcadores de markdown que quebram o parse
        contentText = contentText.replace(/^```json/i, '').replace(/```$/i, '').trim();

        // Em casos críticos onde o modelo retorna raw newlines dentro do JSON,
        // uma sanitização rápida para trocar novas linhas por espaços caso a quebra seja fatal,
        // mas tentaremos o parse limpo primeiro.
        let parsedContent;
        try {
            parsedContent = JSON.parse(contentText);
        } catch {
            console.error('Gemini proposal response parse failed', {
                operation: 'gemini.proposal.generate',
                provider: 'gemini',
                status: 'parse_failed',
                errorCode: 'gemini_response_parse_failed',
            });
            // Replace raw newlines and tabs which cause 'Bad control character'
            const sanitizedText = contentText
                .replace(/[\n\r]/g, ' ')
                .replace(/\t/g, ' ');
            parsedContent = JSON.parse(sanitizedText);
        }

        console.log('✅ Resumo e highlights gerados com sucesso');

        return NextResponse.json({
            summary: parsedContent.summary,
            objectives: parsedContent.objectives,
            softwareHighlights: parsedContent.softwareHighlights,
            benefitTiles: parsedContent.benefitTiles,
            simplifiedProductNames: parsedContent.simplifiedProductNames || {}
        });

    } catch (error: unknown) {
        const proposalError = error as { code?: string; name?: string; message?: string };
        console.error('Gemini proposal generation failed', {
            operation: 'gemini.proposal.generate',
            provider: 'gemini',
            status: 'failed',
            errorCode: proposalError.code || proposalError.name || 'gemini_proposal_generation_failed',
        });
        return NextResponse.json({ error: 'Erro ao gerar resumo da proposta' }, { status: 500 });
    }
}
