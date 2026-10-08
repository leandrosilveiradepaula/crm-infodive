import { requireSessionContext } from '@/lib/auth-server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { guardPaidAiRequest } from '@/lib/paid-ai-guard';

export async function POST(request: Request) {
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const client = new GoogleGenAI({ apiKey });
        const { products } = await request.json();
        if (!Array.isArray(products) || products.length > 100 || JSON.stringify(products).length > 100_000) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }
        const rateLimit = await guardPaidAiRequest({ scope: 'specs-ai', organizationId, userId, limit: 5, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Muitas análises em pouco tempo.' }, { status: rateLimit.status, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
        }

        // Prepare context for AI
        const productList = products.map((p: any) =>
            `Produto: ${p.name}\nDescrição Completa: ${p.description}`
        ).join('\n\n');

        const prompt = `
Tarefa: Atuar como Especialista em Hardware IBM/Lenovo.
Analise a lista de produtos abaixo e extraia/organize as especificações técnicas MAIS IMPORTANTES para uma proposta comercial.

PRODUTOS:
${productList}

SAÍDA DESEJADA (JSON):
Um array de objetos com "label" e "value".
Exemplo:
[
  { "label": "SR630 - Processamento", "value": "2x Intel Xeon Gold 6248R 24C 3.0GHz" },
  { "label": "Storage - Capacidade", "value": "50TB Raw (12x 3.84TB SSD SAS)" }
]

CATEGORIAS PARA EXTRAIR (Se disponível):
- Processador (CPU, Cores, GHz)
- Memória (RAM, Tecnologia)
- Armazenamento (Discos, SSDs, Capacidade Total)
- Conectividade (Placas de Rede, HBAs)
- Energia (Fontes Redundantes)
- Software/Licenciamento (Windows, VMware, XClarity)

Se a descrição for um bundle JSON, analise os itens internos.
Seja conciso. "value" deve ser direto.
`;

        console.log('__ Gerando specs curadas com Gemini...');

        const result = await client.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = result.text;
        if (!text) throw new Error('Resposta vazia');

        // Extract JSON
        let specs = [];
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            specs = JSON.parse(jsonMatch[0]);
        } else {
            specs = JSON.parse(text);
        }

        return NextResponse.json({ specs });

    } catch {
        console.error('[GeminiSpecsRoute] specs curation failed');
        // Fallback to empty array (client will handle or use local logic) or return error
        return NextResponse.json({ error: 'Não foi possível processar as especificações.' }, { status: 500 });
    }
}
