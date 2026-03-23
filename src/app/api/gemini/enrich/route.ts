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
        const { company, website } = await request.json();

        if (!company) {
            return NextResponse.json({ error: "O campo 'company' é obrigatório" }, { status: 400 });
        }

        console.log(`🤖 Enriquecendo lead: ${company} (${website || 'sem site'})...`);

        const prompt = `Atue como um Especialista em Pesquisa de Vendas B2B (Sales Research Analyst).
Sua tarefa é enriquecer os dados de um lead potencial para que eu possa fazer uma abordagem comercial mais efetiva.

Empresa: ${company}
Website: ${website || 'Não informado (tente encontrar baseado no nome)'}

Pesquise (usando seu conhecimento interno) e gere um JSON estrito com as seguintes informações:

1. "summary": Um resumo executivo de 2 frases sobre o que a empresa faz. Foco no modelo de negócios.
2. "tags": Um array de strings com as 3-5 principais tecnologias ou setores da empresa (ex: "SaaS", "AWS", "E-commerce", "Fintech").
3. "talking_points": Um array de strings com 2 "quebra-gelos" ou pontos de conversa para iniciar uma venda. Foco em desafios comuns do setor ou conquistas recentes típicas.

Formato de resposta esperado (JSON puro, sem markdown):
{
  "summary": "...",
  "tags": ["...", "..."],
  "talking_points": ["...", "..."]
}
`;

        const result = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = result.text;
        if (!text) throw new Error('Resposta vazia do modelo');

        const enrichedData = JSON.parse(text);

        return NextResponse.json(enrichedData);

    } catch (error: any) {
        console.error("💥 Erro no enriquecimento:", error);
        return NextResponse.json({
            error: error.message || 'Erro ao enriquecer lead',
            summary: "Não foi possível gerar o resumo automático.",
            tags: [],
            talking_points: []
        }, { status: 500 });
    }
}
