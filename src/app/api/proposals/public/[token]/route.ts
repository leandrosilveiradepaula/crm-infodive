import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const supabase = createAdminClient();
        const { token } = await params;

        if (!token) {
            return NextResponse.json(
                { error: 'Token não fornecido' },
                { status: 400 }
            );
        }

        // Call RPC function to get proposal by public token
        const { data, error } = await supabase
            .rpc('get_proposal_by_public_token', { token_input: token });

        if (error) {
            console.error('Error fetching proposal:', error);
            return NextResponse.json(
                { error: 'Erro ao buscar proposta' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Proposta não encontrada ou não disponível' },
                { status: 404 }
            );
        }

        console.log('📦 [API] Raw Proposal Data:', JSON.stringify(data, null, 2));

        // Map snake_case to camelCase for frontend
        const mappedData = {
            ...data,
            dealId: data.deal_id,
            accountId: data.account_id || data.customer_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            validUntil: data.valid_until,
            sentAt: data.sent_at,
            viewedAt: data.viewed_at,
            signedAt: data.signed_at,
            createdBy: data.created_by,
            dealTitle: data.deal_title, // If joined
            content: data.content || data.content_json, // Try both just in case
        };

        return NextResponse.json(mappedData);
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
