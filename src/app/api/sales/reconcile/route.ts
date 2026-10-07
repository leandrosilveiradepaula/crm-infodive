import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';
import { consumeRateLimit } from '@/lib/ai-rate-limit';

type InstallmentSalesOrder = {
    deal?: {
        title?: string;
        customer?: {
            name?: string;
        };
    };
};

export async function POST(req: NextRequest) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const body = await req.json();
        const { statementText } = body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
        
        if (!apiKey) throw new Error('Gemini API Key not configured');
        if (!statementText) {
            return NextResponse.json({ success: false, error: 'Statement text is required' }, { status: 400 });
        }
        if (typeof statementText !== 'string' || statementText.length > 100_000) {
            return NextResponse.json({ success: false, error: 'Statement text exceeds the allowed limit' }, { status: 413 });
        }

        const rateLimit = consumeRateLimit({ scope: 'sales-reconcile-ai', subject: `${organizationId}:${userId}`, limit: 5, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false, error: 'Muitas reconciliações em pouco tempo.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
        }

        const supabase = createAdminClient();
        
        // 1. Fetch pending installments with deal/customer info
        const { data: installments, error: instError } = await supabase
            .from('sales_order_installments')
            .select(`
                id,
                amount,
                due_date,
                status,
                sales_order:sales_orders (
                    id,
                    deal:deals (
                        title,
                        customer:accounts!deals_account_id_fkey(name)
                    )
                )
            `)
            .eq('organization_id', organizationId)
            .eq('sales_orders.billing_entity', 'infodive')
            .in('status', ['pending', 'overdue']);

        if (instError) throw instError;

        // 2. Call Gemini v1 API directly to avoid SDK v1beta issues
        const genAIUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `
            Você é um assistente financeiro especializado em reconciliação bancária.
            Sua tarefa é cruzar os dados de um extrato bancário com as parcelas pendentes no CRM.

            EXTRATO BANCÁRIO:
            """
            ${statementText}
            """

            PARCELAS PENDENTES NO CRM:
            ${JSON.stringify(installments.map(i => {
                const salesOrder = i.sales_order as InstallmentSalesOrder | null;

                return {
                    id: i.id,
                    amount: i.amount,
                    due_date: i.due_date,
                    customer: salesOrder?.deal?.customer?.name,
                    deal_title: salesOrder?.deal?.title
                };
            }))}

            REGRAS:
            1. Identifique correspondências entre as entradas do extrato e as parcelas.
            2. Uma correspondência pode ser baseada no valor EXATO e proximidade de nome.
            3. Retorne APENAS um JSON no formato:
            {
                "matches": [
                    {
                        "installment_id": "uuid",
                        "statement_entry": "texto da linha do extrato",
                        "confidence": 0.0 a 1.0,
                        "reason": "por que você acha que coincidem"
                    }
                ]
            }
        `;

        const aiRes = await fetch(genAIUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!aiRes.ok) {
            throw new Error('Gemini API Error');
        }

        const aiData = await aiRes.json();
        const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiText) throw new Error('Gemini did not return any text');

        // Robust JSON parsing
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[SalesReconcileRoute] reconciliation response parse failed');
            throw new Error('Could not parse AI response as JSON');
        }

        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ success: true, data: result });

    } catch {
        console.error('[SalesReconcileRoute] reconciliation failed');
        return NextResponse.json({ 
            success: false, 
            error: 'Erro ao reconciliar vendas'
        }, { status: 500 });
    }
}
