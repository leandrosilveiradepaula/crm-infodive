import { requireSessionContext } from '@/lib/auth-server';
import { GoogleGenAI } from '@google/genai';
import { guardPaidAiRequest } from '@/lib/paid-ai-guard';
import { createAiRouteContext } from '@/lib/ai-route-observability';

export async function POST(request: Request) {
    const telemetry = createAiRouteContext(request, 'gemini_enrich');
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        telemetry.record('unauthorized', 401);
        return telemetry.respond({ error: 'Unauthorized' }, 401);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        telemetry.record('not_configured', 503);
        return telemetry.respond({ error: 'Integração de IA não configurada.' }, 503);
    }

    try {
        const client = new GoogleGenAI({ apiKey });
        const { company, website } = await request.json();

        if (!company) {
            telemetry.record('invalid_request', 400);
            return telemetry.respond({ error: "O campo 'company' é obrigatório" }, 400);
        }
        if (typeof company !== 'string' || company.length > 500 || (website && (typeof website !== 'string' || website.length > 2_000))) {
            telemetry.record('payload_too_large', 413);
            return telemetry.respond({ error: 'Payload too large' }, 413);
        }

        const rateLimit = await guardPaidAiRequest({ scope: 'gemini-enrich', organizationId, userId, limit: 5, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            telemetry.record(rateLimit.reason, rateLimit.status);
            return telemetry.respond({ error: 'Muitas análises em pouco tempo.' }, rateLimit.status, { 'Retry-After': String(rateLimit.retryAfterSeconds) });
        }

        console.log('[GeminiEnrichRoute] enrichment started');

        const prompt = `Atue como um Especialista em Pesquisa de Vendas B2B (Sales Research Analyst).
Sua tarefa é enriquecer os dados de um lead potencial para que eu possa fazer uma abordagem comercial mais efetiva.

Empresa: ${company}
Website: ${website || 'Não informado (tente encontrar baseado no nome)'}

Use apenas informações que possam ser sustentadas pelo nome/website fornecidos ou por conhecimento geral não temporal do modelo. Não invente fatos recentes, clientes, projetos, tecnologias adotadas ou conquistas específicas. Quando não houver base suficiente, declare a limitação no resumo e retorne arrays vazios em vez de fabricar detalhes.

Gere um JSON estrito com as seguintes informações:

1. "summary": Um resumo executivo de 2 frases sobre o que a empresa faz. Foco no modelo de negócios.
2. "tags": Um array de strings com até 5 setores/tecnologias apenas quando houver base razoável; caso contrário, [].
3. "talking_points": Um array com até 2 hipóteses de conversa baseadas em desafios gerais do setor identificado, nunca alegações de fatos recentes ou conquistas específicas; caso contrário, [].

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

        telemetry.record('success', 200);
        return telemetry.respond(enrichedData);

    } catch {
        console.error('[GeminiEnrichRoute] enrichment failed');
        telemetry.record('failure', 502);
        return telemetry.respond({
            error: 'A integração de IA está indisponível no momento.',
            summary: 'Não foi possível gerar o resumo automático.',
            tags: [],
            talking_points: []
        }, 502);
    }
}
