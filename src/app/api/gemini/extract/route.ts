import { requireSessionContext } from '@/lib/auth-server';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: apiKey! });

// List of vision models to try (fallback strategy)
const VISION_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
];

export async function POST(request: Request) {
    // 1. Auth Guard (iron-session)
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validation
    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const payload = await request.json();
        const { imageData, mimeType } = payload;

        console.log(`📦 Payload recebido: chaves = ${Object.keys(payload).join(', ')}`);
        console.log(`- mimeType: ${mimeType}`);
        console.log(`- imageData size: ${(imageData?.length || 0)} bytes`);

        if (!imageData || !mimeType) {
            return NextResponse.json({ error: `Os campos 'imageData' e 'mimeType' são obrigatórios. (Recebido: mimeType=${mimeType}, imageData length=${imageData?.length || 0})` }, { status: 400 });
        }

        console.log(`📸 Processando arquivo (${mimeType})...`);

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

        let lastError: any;

        // Try models sequentially
        for (const modelName of VISION_MODELS) {
            try {
                console.log(`🤖 Tentando modelo: ${modelName}...`);

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

                console.log(`✅ Sucesso com modelo: ${modelName}`);

                // Match JSON array
                let parsedData;
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

                parsedData = parsedData.filter((item: any) => {
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

            } catch (error: any) {
                console.warn(`❌ Falha com modelo ${modelName}:`, error.message);
                lastError = error;
            }
        }

        throw lastError || new Error('Todos os modelos falharam');

    } catch (error: any) {
        console.error("💥 Erro na extração:", error);
        return NextResponse.json({ error: error.message || 'Erro ao processar imagem' }, { status: 500 });
    }
}
