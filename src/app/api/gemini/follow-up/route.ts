import { requirePermission } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardPaidAiRequest } from '@/lib/paid-ai-guard';
import { createAiRouteContext } from '@/lib/ai-route-observability';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
    const telemetry = createAiRouteContext(request, 'gemini_follow_up');
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requirePermission('deals:edit');
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        telemetry.record('unauthorized', 401);
        return telemetry.respond({ error: 'Unauthorized' }, 401);
    }

    if (!apiKey) {
        telemetry.record('not_configured', 503);
        return telemetry.respond({ error: 'Integração de IA não configurada.' }, 503);
    }

    let dealId = '';
    try {
        const body = await request.json();
        dealId = typeof body?.dealId === 'string' ? body.dealId : '';
    } catch {
        // handled below
    }

    if (!dealId) {
        telemetry.record('invalid_request', 400);
        return telemetry.respond({ error: 'Oportunidade inválida.' }, 400);
    }

    const rateLimit = await guardPaidAiRequest({ scope: 'gemini-follow-up', organizationId, userId, limit: 5, windowMs: 60_000 });
    if (!rateLimit.allowed) {
        telemetry.record(rateLimit.reason, rateLimit.status);
        return telemetry.respond({ error: 'Muitas gerações em pouco tempo.' }, rateLimit.status, { 'Retry-After': String(rateLimit.retryAfterSeconds) });
    }

    const supabase = createAdminClient();
    const { data: deal, error } = await supabase
        .from('deals')
        .select('id, title, company, value, stage, probability, days_in_stage, expected_close_date, contact_name, next_step')
        .eq('id', dealId)
        .eq('organization_id', organizationId)
        .single();

    if (error || !deal) {
        telemetry.record('deal_not_found', 404);
        return telemetry.respond({ error: 'Oportunidade não encontrada.' }, 404);
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
            telemetry.record('provider_failure', 502);
            return telemetry.respond({ error: 'A integração de IA está indisponível no momento.' }, 502);
        }

        const data = await response.json();
        const email = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!email) {
            telemetry.record('provider_empty', 502);
            return telemetry.respond({ error: 'A integração de IA retornou uma resposta vazia.' }, 502);
        }

        telemetry.record('success', 200);
        return telemetry.respond({ email });
    } catch {
        console.error('[GeminiFollowUpRoute] provider request failed');
        telemetry.record('provider_failure', 502);
            return telemetry.respond({ error: 'A integração de IA está indisponível no momento.' }, 502);
    }
}
