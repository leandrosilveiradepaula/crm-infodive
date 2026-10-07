import { NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

const apiKey = process.env.GEMINI_API_KEY;

type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

export async function POST(request: Request) {
    let organizationId: string;
    try {
        const ctx = await requireSessionContext();
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Integração de IA não configurada.' }, { status: 503 });
    }

    let history: ChatMessage[];
    try {
        const body = await request.json();
        history = Array.isArray(body?.history)
            ? body.history
                .filter((item: unknown): item is ChatMessage => {
                    if (!item || typeof item !== 'object') return false;
                    const candidate = item as ChatMessage;
                    return (candidate.role === 'user' || candidate.role === 'assistant')
                        && typeof candidate.content === 'string';
                })
                .slice(-10)
                .map(item => ({ role: item.role, content: item.content.slice(0, 4000) }))
            : [];
    } catch {
        history = [];
    }

    if (!history.some(item => item.role === 'user' && item.content.trim())) {
        return NextResponse.json({ error: 'Pergunta inválida.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: deals, error } = await supabase
        .from('deals')
        .select('title, company, value, stage, probability, days_in_stage, expected_close_date, next_step')
        .eq('organization_id', organizationId)
        .not('stage', 'in', '("won","lost")')
        .order('value', { ascending: false })
        .limit(30);

    if (error) {
        console.error('[GeminiChatRoute] deal context fetch failed');
        return NextResponse.json({ error: 'Não foi possível carregar o contexto do CRM.' }, { status: 503 });
    }

    const pipelineContext = (deals || []).map(deal =>
        [
            `Deal: ${deal.title}`,
            `Cliente: ${deal.company || 'N/I'}`,
            `Valor: ${Number(deal.value || 0).toFixed(2)}`,
            `Estágio: ${deal.stage}`,
            `Probabilidade: ${deal.probability ?? 'N/I'}%`,
            `Dias no estágio: ${deal.days_in_stage ?? 'N/I'}`,
            `Fechamento previsto: ${deal.expected_close_date || 'N/I'}`,
            `Próximo passo: ${deal.next_step || 'N/I'}`
        ].join(' | ')
    ).join('\n');

    const conversation = history
        .map(item => `${item.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}: ${item.content}`)
        .join('\n');

    const prompt = `Você é o assistente comercial do CRM da Infodive.
Responda em português do Brasil, com objetividade.
Use somente os dados fornecidos no contexto do CRM para afirmações factuais sobre oportunidades.
Se a informação não estiver no contexto, diga explicitamente que não há dados suficientes.
Não invente clientes, valores, probabilidades, reuniões ou próximos passos.

CONTEXTO DO PIPELINE:
${pipelineContext || 'Nenhuma oportunidade ativa encontrada.'}

CONVERSA:
${conversation}

Responda apenas à última pergunta do usuário.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2 }
                })
            }
        );

        if (!response.ok) {
            console.error('[GeminiChatRoute] provider request failed');
            return NextResponse.json({ error: 'A integração de IA está indisponível no momento.' }, { status: 502 });
        }

        const data = await response.json();
        const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!message) {
            return NextResponse.json({ error: 'A integração de IA retornou uma resposta vazia.' }, { status: 502 });
        }

        return NextResponse.json({ message });
    } catch {
        console.error('[GeminiChatRoute] provider request failed');
        return NextResponse.json({ error: 'A integração de IA está indisponível no momento.' }, { status: 502 });
    }
}
