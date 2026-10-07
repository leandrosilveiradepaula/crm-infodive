import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
    let organizationId: string;
    try {
        const ctx = await requirePermission('deals:edit');
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'Integração de IA não configurada.' }, { status: 503 });
    }

    let dealId = '';
    try {
        const body = await request.json();
        dealId = typeof body?.dealId === 'string' ? body.dealId : '';
    } catch {
        // handled below
    }

    if (!dealId) {
        return NextResponse.json({ error: 'Oportunidade inválida.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: deal, error } = await supabase
        .from('deals')
        .select('id, title, company, value, stage, probability, days_in_stage, expected_close_date, contact_name, next_step')
        .eq('id', dealId)
        .eq('organization_id', organizationId)
        .single();

    if (error || !deal) {
        return NextResponse.json({ error: 'Oportunidade não encontrada.' }, { status: 404 });
    }

    const prompt = `Escreva um e-mail comercial de follow-up em português do Brasil.
Use exclusivamente os dados abaixo e não invente fatos.
Tom profissional, direto e cordial. Sem markdown. Não inclua assinatura de fabricante ou parceiro que não esteja nos dados.

Oportunidade: ${deal.title}
Cliente: ${deal.company || 'N/I'}
Contato: ${deal.contact_name || 'equipe'}
Valor: R$ ${Number(deal.value || 0).toFixed(2)}
Estágio: ${deal.stage}
Probabilidade: ${deal.probability ?? 'N/I'}%
Dias no estágio: ${deal.days_in_stage ?? 'N/I'}
Fechamento previsto: ${deal.expected_close_date || 'N/I'}
Próximo passo: ${deal.next_step || 'N/I'}

Retorne apenas o corpo completo do e-mail.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3 }
                })
            }
        );

        if (!response.ok) {
            console.error('[GeminiFollowUpRoute] provider request failed');
            return NextResponse.json({ error: 'A integração de IA está indisponível no momento.' }, { status: 502 });
        }

        const data = await response.json();
        const email = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!email) {
            return NextResponse.json({ error: 'A integração de IA retornou uma resposta vazia.' }, { status: 502 });
        }

        return NextResponse.json({ email });
    } catch {
        console.error('[GeminiFollowUpRoute] provider request failed');
        return NextResponse.json({ error: 'A integração de IA está indisponível no momento.' }, { status: 502 });
    }
}
