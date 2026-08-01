import { requireSessionContext } from '@/lib/auth-server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: apiKey! });

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
        const { products } = await request.json();

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
