import { requirePermission } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { guardPaidAiRequest } from '@/lib/paid-ai-guard';

const apiKey = process.env.GEMINI_API_KEY;

type DealActivity = {
    created_at: string;
    type: string;
    title?: string;
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

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: GEMINI_API_KEY missing' }, { status: 500 });
    }

    try {
        const { deal, activities } = await request.json();
        if (JSON.stringify({ deal, activities }).length > 100_000) {
            return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
        }

        const rateLimit = await guardPaidAiRequest({ scope: 'analyze-deal-ai', organizationId, userId, limit: 5, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Muitas análises em pouco tempo.' }, { status: rateLimit.status, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
        }

        // Format currency for Brazilian Real
        const formatCurrency = (value: number) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        };

        const today = new Date().toLocaleDateString('pt-BR');

        const prompt = `
Você é um Diretor Comercial Sênior da IBM/Lenovo com 20 anos de experiência em vendas consultivas B2B de alta tecnologia.
Sua missão é atuar como um "Deal Doctor" (Médico de Oportunidades), analisando friamente a saúde deste negócio e fornecendo recomendações cirúrgicas para acelerar o fechamento.

DADOS DA OPORTUNIDADE:
- Título: ${deal.title}
- Cliente: ${deal.company_name || 'Não informado'}
- Valor: ${formatCurrency(deal.value)}
- Estágio Atual: ${deal.stage}
- Dias totais no Pipeline: ${deal.days_in_stage || 0} dias
- Probabilidade: ${deal.probability}%
- Data de Hoje: ${today}

HISTÓRICO RECENTE (Resumo):
${activities && activities.length > 0 ? activities.map((a: DealActivity) => `- [${new Date(a.created_at).toLocaleDateString()}] ${a.type}: ${a.title || 'Sem título'}`).join('\n') : 'Nenhuma atividade recente registrada.'}

TAREFA:
Analise os dados acima e retorne um objeto JSON ESTRITAMENTE com a seguinte estrutura (sem markdown, apenas o JSON cru):

{
  "status": "healthy" | "at_risk" | "urgent",
  "healthScore": number, // 1 a 100 (seja rigoroso)
  "trend": "stable" | "improving" | "declining",
  "riskFactors": [
    "string" // Fatores de risco específicos (máx 3)
  ],
  "insights": [
    "string", // Fato positivo ou negativo relevante (máx 3)
  ],
  "recommendations": [
    "string", // Ação estratégica recomendada (máx 3)
  ],
  "nextSteps": [
    "string" // Próximos passos táticos imediatos (máx 3)
  ]
}

CRITÉRIOS DE ANÁLISE:
1. STATUS:
   - "urgent": Se parado há >30 dias, sem atividades recentes, ou valor alto em risco.
   - "at_risk": Se estagnado, sem próximos passos claros, ou engajamento baixo.
   - "healthy": Se há atividades recentes (<7 dias), evolução clara e contato constante.

2. HEALTH SCORE:
   - 1-30: Crítico (UTI). Requer intervenção imediata ou descarte.
   - 31-60: Atenção. Oportunidade morna ou travada.
   - 61-89: Saudável. Em ritmo de fechamento.
   - 90-100: Perfeito. Fechamento iminente garantido.

3. TREND (Tendência):
   - "improving": Atividades recentes positivas, avanço de estágio.
   - "declining": Sem atividade há tempo, perda de contato.
   - "stable": Ritmo normal, sem grandes mudanças.

4. RECOMENDAÇÕES:
   - Seja específico. Não diga "faça follow-up". Diga "Ligue para o decisor financeiro para destravar a aprovação".
   - Use terminologia de vendas (BANT, MEDDIC, Stakeholders).
   - Se o deal é de valor baixo e está travado, sugira desqualificar.

IMPORTANT: Responda APENAS com o JSON. Não adicione texto antes ou depois.
`;

        console.log('[GeminiAnalyzeDealRoute] deal analysis started');

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            await response.json().catch(() => ({}));
            throw new Error('Não foi possível analisar o negócio.');
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!textResponse) {
            throw new Error('A API retornou uma resposta vazia.');
        }

        let diagnosis;
        try {
            diagnosis = JSON.parse(textResponse);
        } catch {
            // Fallback parsing if JSON is wrapped in markdown code blocks
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                diagnosis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Falha ao processar resposta JSON do Gemini');
            }
        }

        // Persist analysis to database
        if (diagnosis && deal.id) {
            console.log('[GeminiAnalyzeDealRoute] deal analysis persistence started');
            const supabase = createAdminClient();
            const { error: updateError } = await supabase
                .from('deals')
                .update({
                    health_score: diagnosis.healthScore,
                    health_trend: diagnosis.trend,
                    risk_factors: diagnosis.riskFactors,
                    last_analysis_at: new Date().toISOString()
                })
                .eq('id', deal.id)
                .eq('organization_id', organizationId);

            if (updateError) {
                console.error('[GeminiAnalyzeDealRoute] deal analysis persistence failed');
            } else {
                console.log('[GeminiAnalyzeDealRoute] deal analysis persistence succeeded');
            }
        }

        return NextResponse.json(diagnosis);

    } catch {
        console.error('[GeminiAnalyzeDealRoute] deal analysis failed');
        return NextResponse.json({ error: 'Não foi possível analisar o negócio.' }, { status: 500 });
    }
}
