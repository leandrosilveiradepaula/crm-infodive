import { requirePermission } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/ai-rate-limit';
import { consumeDurableAiQuota } from '@/lib/ai-durable-quota';

const apiKey = process.env.GEMINI_API_KEY;

type ActivityRecord = {
    deal_id: string;
    title?: string;
    type?: string;
    status?: string;
    created_at: string;
    dueDate?: string;
};

type ActivitySuggestion = {
    dealId?: string;
    type?: string;
    title?: string;
    description?: string;
    priority?: string;
    dueDaysFromNow?: number;
    reasoning?: string;
};

export async function POST(request: Request) {
    let userId: string;
    let organizationId: string;
    try {
        const ctx = await requirePermission('deals:edit');
        userId = ctx.userId;
        organizationId = ctx.organizationId;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = consumeRateLimit({ scope: 'activity-suggestions-ai', subject: `${organizationId}:${userId}`, limit: 3, windowMs: 60_000 });
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Muitas atualizações em pouco tempo.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
    }

    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const supabase = createAdminClient();

        // Check if force refresh is requested
        let force = false;
        try {
            const body = await request.json();
            force = body?.force === true;
        } catch {
            // body might be empty or missing
        }

        // Check cache (24h)
        if (!force) {
            const { count: cacheCount } = await supabase
                .from('ai_activity_suggestions')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('status', 'pending')
                .gt('expires_at', new Date().toISOString());

            if ((cacheCount || 0) > 0) {
                // Return cached suggestions
                const { data: cached } = await supabase
                    .from('ai_activity_suggestions')
                    .select('*, deals(title, company)')
                    .eq('organization_id', organizationId)
                    .eq('status', 'pending')
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false });

                return NextResponse.json({ suggestions: cached || [], fromCache: true });
            }
        }

        // Fetch all active deals with recent activities
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select(`
                id, title, company, value, stage, probability,
                days_in_stage, expected_close_date, contact_name,
                created_at
            `)
            .eq('organization_id', organizationId)
            .not('stage', 'in', '("won","lost")')
            .order('value', { ascending: false });

        if (dealsError || !deals || deals.length === 0) {
            if (dealsError) {
                console.error('[GeminiSuggestActivitiesRoute] suggestion deals fetch failed');
            }
            return NextResponse.json({ suggestions: [], fromCache: false });
        }

        // Get last activity per deal
        const dealIds = deals.map(d => d.id);
        const { data: allActivities } = await supabase
            .from('activities')
            .select('deal_id, title, type, status, created_at, "dueDate"')
            .eq('organization_id', organizationId)
            .in('deal_id', dealIds)
            .order('created_at', { ascending: false });

        const activitiesByDeal: Record<string, ActivityRecord[]> = {};
        (allActivities || []).forEach((a: ActivityRecord) => {
            if (!activitiesByDeal[a.deal_id]) activitiesByDeal[a.deal_id] = [];
            if (activitiesByDeal[a.deal_id].length < 3) {
                activitiesByDeal[a.deal_id].push(a);
            }
        });

        const formatCurrency = (v: number) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

        const today = new Date().toLocaleDateString('pt-BR');

        const dealsContext = deals.slice(0, 30).map(d => {
            const acts = activitiesByDeal[d.id] || [];
            const lastAct = acts[0];
            const daysSinceLastAct = lastAct
                ? Math.floor((Date.now() - new Date(lastAct.created_at).getTime()) / 86400000)
                : 999;

            return `DEAL: "${d.title}" | Cliente: ${d.company || 'N/I'} | Valor: ${formatCurrency(d.value)} | Estágio: ${d.stage} | Probabilidade: ${d.probability}% | Dias no estágio: ${d.days_in_stage} | Contato: ${d.contact_name || 'N/I'} | Última atividade: ${daysSinceLastAct === 999 ? 'Nunca' : `${daysSinceLastAct} dias atrás (${lastAct?.type}: ${lastAct?.title})`} | ID: ${d.id}`;
        }).join('\n');

        const prompt = `
Você é um Diretor Comercial Sênior com 20 anos de experiência em vendas B2B consultivas de alta tecnologia (IBM, Lenovo, Dell).
Sua missão: analisar TODOS os deals abaixo e sugerir as ações mais impactantes para cada um.

DATA DE HOJE: ${today}
TOTAL DE DEALS ATIVOS: ${deals.length}

${dealsContext}

TAREFA:
Para CADA deal acima, sugira 1 a 2 ações concretas e específicas. Retorne um array JSON com a seguinte estrutura:

[
  {
    "dealId": "uuid-do-deal",
    "type": "call" | "email" | "meeting" | "task",
    "title": "Título curto e acionável da atividade",
    "description": "Descrição detalhada do que fazer e por quê",
    "priority": "low" | "medium" | "high" | "urgent",
    "dueDaysFromNow": number,
    "reasoning": "Explicação de porque esta ação é importante agora"
  }
]

REGRAS:
1. Seja ESPECÍFICO. Não diga "fazer follow-up". Diga "Ligar para [contato] para verificar aprovação do orçamento".
2. PRIORIZE deals de alto valor ou em risco (parados, sem atividade recente).
3. Deals sem atividade há 7+ dias = prioridade URGENTE.
4. Use terminologia de vendas (BANT, MEDDIC, Champions, Economic Buyers).
5. Para deals em estágio inicial: foque em qualificação. Para avançados: foque em fechamento.
6. Máximo de 2 sugestões por deal. Foque em qualidade.
7. Retorne APENAS o JSON. Sem markdown, sem texto extra.
`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const durableQuota = await consumeDurableAiQuota({
            organizationId,
            scope: 'activity-suggestions-ai',
            limit: 3,
            windowSeconds: 60,
        });
        if (!durableQuota.allowed) {
            return NextResponse.json(
                { error: durableQuota.reason === 'quota_unavailable' ? 'Controle de uso da IA indisponível.' : 'Limite de IA atingido.' },
                { status: durableQuota.reason === 'quota_unavailable' ? 503 : 429, headers: { 'Retry-After': String(durableQuota.retryAfterSeconds) } }
            );
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            await response.json().catch(() => ({}));
            throw new Error('Não foi possível gerar sugestões de atividades.');
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!textResponse) {
            throw new Error('Empty response from Gemini');
        }

        let suggestions: ActivitySuggestion[];
        try {
            suggestions = JSON.parse(textResponse);
        } catch {
            const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse Gemini JSON response');
            }
        }

        if (!Array.isArray(suggestions)) {
            suggestions = [suggestions];
        }

        // Clear old suggestions
        await supabase
            .from('ai_activity_suggestions')
            .delete()
            .eq('organization_id', organizationId)
            .lt('expires_at', new Date().toISOString());

        // Also clear old pending ones to replace with fresh
        await supabase
            .from('ai_activity_suggestions')
            .delete()
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        // Persist new suggestions
        const validDealIds = new Set(deals.map(d => d.id));
        const rows = suggestions
            .filter(s => s.dealId && validDealIds.has(s.dealId))
            .map(s => ({
                organization_id: organizationId,
                deal_id: s.dealId,
                type: s.type || 'task',
                title: s.title,
                description: s.description || '',
                priority: s.priority || 'medium',
                suggested_due_date: new Date(
                    Date.now() + (s.dueDaysFromNow || 1) * 86400000
                ).toISOString().split('T')[0],
                reasoning: s.reasoning || '',
                status: 'pending',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }));

        if (rows.length > 0) {
            const { error: insertError } = await supabase.from('ai_activity_suggestions').insert(rows);
            if (insertError) {
                console.error('[GeminiSuggestActivitiesRoute] activity suggestions insert failed');
                throw new Error('Não foi possível gerar sugestões de atividades.');
            }
        }

        // Return with deal data
        const { data: result, error: fetchError } = await supabase
            .from('ai_activity_suggestions')
            .select('*, deals(title, company)')
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('[GeminiSuggestActivitiesRoute] activity suggestions fetch after insert failed');
            throw new Error('Não foi possível gerar sugestões de atividades.');
        }

        return NextResponse.json({
            suggestions: result || [],
            fromCache: false,
            totalGenerated: rows.length
        });

    } catch {
        console.error('[GeminiSuggestActivitiesRoute] activity suggestions failed');
        return NextResponse.json(
            { error: 'Não foi possível gerar sugestões de atividades.' },
            { status: 500 }
        );
    }
}
