import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission, requireSessionContext } from '@/lib/auth-server';
import { consumeRateLimit } from '@/lib/ai-rate-limit';

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await requireSessionContext();
        const supabase = createAdminClient();

        // 1. Fetch active sales orders (not fully completed)
        // We exclude orders that reached 'comissao_paga' or 'distribuidor_pagou' (if applicable)
        const { data: orders, error } = await supabase
            .from('sales_orders')
            .select(`
                *,
                deal:deals(title, customer:accounts!deals_account_id_fkey(name)),
                installments:sales_order_installments(*)
            `)
            .eq('organization_id', organizationId)
            .not('status', 'eq', 'comissao_paga')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const now = new Date();
        const alerts: any[] = [];

        orders.forEach(order => {
            const updatedAt = order.updated_at ? new Date(order.updated_at) : new Date(order.created_at);
            const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

            // Rule 1: Stuck in 'pedido_gerado' (Missing Invoice)
            if (order.status === 'pedido_gerado' && daysSinceUpdate >= 3) {
                alerts.push({
                    id: `stuck-inv-${order.id}`,
                    orderId: order.id,
                    customer: order.deal?.customer?.name,
                    title: order.deal?.title,
                    type: 'faturamento_atrasado',
                    severity: daysSinceUpdate > 7 ? 'high' : 'medium',
                    message: `Pedido aguardando nota fiscal há ${daysSinceUpdate} dias.`,
                    days: daysSinceUpdate
                });
            }

            // Rule 2: Stuck in 'nf_emitida' (Missing Shipment/Delivery)
            if (order.status === 'nf_emitida' && daysSinceUpdate >= 5) {
                alerts.push({
                    id: `stuck-ship-${order.id}`,
                    orderId: order.id,
                    customer: order.deal?.customer?.name,
                    title: order.deal?.title,
                    type: 'entrega_pendente',
                    severity: 'medium',
                    message: `NF emitida há ${daysSinceUpdate} dias, mas sem confirmação de entrega.`,
                    days: daysSinceUpdate
                });
            }

            // Rule 3: Overdue Installments
            const hasOverdue = order.installments?.some((i: any) => i.status !== 'paid' && new Date(i.due_date) < now);
            if (hasOverdue) {
                const isDistributor = order.billing_entity === 'distributor';
                alerts.push({
                    id: `overdue-${order.id}`,
                    orderId: order.id,
                    customer: order.deal?.customer?.name,
                    title: order.deal?.title,
                    type: 'pagamento_atrasado',
                    severity: 'high',
                    message: isDistributor 
                        ? 'Parcela vencida com o Distribuidor. Verifique se o cliente já enviou o comprovante para liberação.'
                        : 'Parcela vencida com a Infodive. Realize a cobrança direta ou verifique o extrato.',
                    days: 0 // Not applicable here
                });
            }

            // Rule 4: Total Inactivity
            if (daysSinceUpdate >= 10) {
                 alerts.push({
                    id: `stale-${order.id}`,
                    orderId: order.id,
                    customer: order.deal?.customer?.name,
                    title: order.deal?.title,
                    type: 'inatividade',
                    severity: 'low',
                    message: `Nenhuma atualização neste pedido há ${daysSinceUpdate} dias.`,
                    days: daysSinceUpdate
                });
            }
        });

        return NextResponse.json({ success: true, alerts });

    } catch {
        console.error('[SalesAlertsRoute] risk alerts request failed');
        return NextResponse.json({ success: false, error: 'Não foi possível carregar os alertas de vendas.' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // This POST method will be used for "Deep Analysis" of a specific order
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { orderId, alertType } = await req.json();
        if (typeof orderId !== 'string' || orderId.length > 100 || typeof alertType !== 'string' || alertType.length > 100) {
            return NextResponse.json({ success: false, error: 'Parâmetros inválidos.' }, { status: 400 });
        }
        const rateLimit = consumeRateLimit({ scope: 'sales-alert-analysis-ai', subject: `${organizationId}:${userId}`, limit: 5, windowMs: 60_000 });
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false, error: 'Muitas análises em pouco tempo.' }, { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } });
        }
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
        if (!apiKey) throw new Error('Gemini API Key not configured');

        const supabase = createAdminClient();

        // Fetch detailed order data
        const { data: order, error } = await supabase
            .from('sales_orders')
            .select(`
                *,
                deal:deals(*, customer:accounts!deals_account_id_fkey(*)),
                items:sales_order_items(*),
                installments:sales_order_installments(*)
            `)
            .eq('id', orderId)
            .eq('organization_id', organizationId)
            .single();

        if (error || !order) throw new Error('Order not found');

        const genAIUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const prompt = `
            Você é um especialista em operações de vendas (SalesOps). 
            Analise o seguinte pedido que gerou um alerta de risco do tipo "${alertType}".
            O objetivo é fornecer uma análise técnica do porquê o pedido pode estar travado e sugerir a MELHOR ação para o vendedor.

            DADOS DO PEDIDO:
            - Cliente: ${order.deal?.customer?.name}
            - Negócio: ${order.deal?.title}
            - Valor Total: ${order.total_value}
            - Status Atual: ${order.status}
            - Billing Entity: ${order.billing_entity}
            - Itens: ${JSON.stringify(order.items.map((i: any) => i.product_name))}
            - Parcelas: ${JSON.stringify(order.installments.map((i: any) => ({ due: i.due_date, status: i.status })))}
            - Data de Criação/Atualização: ${order.updated_at || order.created_at}

            REGRAS:
            1. Seja direto e profissional.
            2. Se o billing_entity for 'distributor', enfatize que o pagamento é feito ao DISTRIBUIDOR e sugira contato com o parceiro para validar o recebimento.
            3. Se o billing_entity for 'infodive', a cobrança é direta.
            4. Se houver parcela vencida, sugira cobrança ou validação de comprovante conforme a entidade.
            5. Retorne APENAS um JSON:
            {
                "analysis": "Sua análise curta aqui",
                "suggestion": "Sua sugestão de ação aqui",
                "priority": "low | medium | high"
            }
        `;

        const aiRes = await fetch(genAIUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        // Some versions of Gemini v1 don't like responseMimeType in POST body if not using beta, 
        // fallback to standard if error
        let aiText = '';
        if (aiRes.ok) {
            const aiData = await aiRes.json();
            aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
             // Retry without responseMimeType if it was the error (like in reconcile/route.ts)
             const retryRes = await fetch(genAIUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            if (!retryRes.ok) throw new Error('Gemini API Error');
            const aiData = await retryRes.json();
            aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const analysisResult = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);

        return NextResponse.json({ success: true, data: analysisResult });

    } catch {
        return NextResponse.json({ success: false, error: 'Não foi possível carregar os alertas de vendas.' }, { status: 500 });
    }
}
