import { requireSessionContext } from '@/lib/auth-server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/ai-rate-limit';

// List of vision models to try (fallback strategy)
const VISION_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
];

type ExtractedProduct = {
    name?: string;
    sku?: string;
    quantity?: number;
};

export async function POST(request: Request) {
    // 1. Auth Guard (iron-session)
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const client = new GoogleGenAI({ apiKey });
        const payload = await request.json();
        const { imageData, mimeType } = payload;

        if (!imageData || !mimeType) {
            return NextResponse.json({ error: "Os campos 'imageData' e 'mimeType' são obrigatórios." }, { status: 400 });
        }
        if (typeof imageData !== 'string' || imageData.length > 12_000_000 || typeof mimeType !== 'string' || mimeType.length > 200) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }

        const rateLimit = consumeRateLimit({ scope: 'gemini-extract', subject: `${organizationId}:${userId}`, limit: 3, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Muitas extrações em pouco tempo.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
        }

        console.log('[GeminiExtractRoute] extraction started');

        const prompt = `Analise este arquivo (imagem ou PDF de planilha/lista de produtos).
Extraia os dados dos produtos em formato JSON.
Preciso de um array de objetos com estas chaves exatas:
- sku (string, se houver, senão vazio)
- name (string, o nome do produto)
- quantity (number, quantidade)
- unit_price (number, preço unitário. Converta para number. Ex: "R$ 1.200,00" -> 1200)
- total (number, total da linha)
- category (string, Categorize como 'Hardware', 'Software', 'Serviço' ou 'Suporte')
- subcategory (string, Categorize como 'Storage', 'Servidor', 'Licença', 'Instalação', etc)

REGRAS IMPORTANTES:
1. Ignore linhas de cabeçalho como "Infraestrutura de Hardware", "CONFIGURAÇÃO POR SERVIDOR", "Valor Total", etc. Não os extraia como produtos.
2. Se houver itens como "2.4TB 10K 2.5 Inch HDD" ou "Flash Drive", mantenha a descrição completa.
3. Se não houver cabeçalhos claros, infira pelo conteúdo. 
4. Apenas devolva o JSON, sem markdown.`;

        let lastError: unknown;

        // Try models sequentially
        for (const modelName of VISION_MODELS) {
            try {
                console.log('[GeminiExtractRoute] extraction model attempt started');

                const result = await client.models.generateContent({
                    model: modelName,
                    contents: [{
                        role: "user",
                        parts: [
                            { text: prompt },
                            { inlineData: { data: imageData, mimeType } }
                        ]
                    }]
                });

                const text = result.text;
                if (!text) throw new Error('Resposta vazia do modelo');

                console.log('[GeminiExtractRoute] extraction model succeeded');

                // Match JSON array
                let parsedData: ExtractedProduct[];
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    parsedData = JSON.parse(jsonMatch[0]);
                } else {
                    parsedData = JSON.parse(text);
                }

                // POST-PROCESSING blacklist
                const BLACKLIST_PATTERNS = [
                    /configura[çc][ãa]o por/i,
                    /infraestrutura/i,
                    /especifica[çc][ãa]o unit[áa]ria/i,
                    /valor total/i,
                    /total venda/i
                ];

                parsedData = parsedData.filter((item: ExtractedProduct) => {
                    const name = item.name || '';
                    if (BLACKLIST_PATTERNS.some(pattern => pattern.test(name))) {
                        return false;
                    }
                    // Remove if price/quantity/name are all effectively empty/zero
                    if (!item.name && !item.sku && (!item.quantity || item.quantity === 0)) {
                        return false;
                    }
                    return true;
                });

                return NextResponse.json({ products: parsedData });

            } catch (error: unknown) {
                console.warn('[GeminiExtractRoute] extraction model failed');
                lastError = error;
            }
        }

        throw lastError || new Error('Todos os modelos falharam');

    } catch {
        console.error('[GeminiExtractRoute] extraction failed');
        return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
    }
}
