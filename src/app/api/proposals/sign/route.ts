import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient();
        const body = await request.json();

        const {
            token,
            signatureData,
            signatureType,
            signerName,
            signerEmail,
            signerCompany,
            signerTitle
        } = body;

        // Validation
        if (!token || !signatureData || !signatureType || !signerName || !signerEmail) {
            return NextResponse.json(
                { error: 'Dados obrigatórios faltando' },
                { status: 400 }
            );
        }

        // Capture IP and User-Agent
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        // Call RPC function to sign proposal
        const { data, error } = await supabase.rpc('sign_proposal', {
            token_input: token,
            signature_data_input: signatureData,
            signature_type_input: signatureType,
            signer_name_input: signerName,
            signer_email_input: signerEmail,
            signer_company_input: signerCompany || null,
            signer_title_input: signerTitle || null,
            signer_ip_input: ip,
            user_agent_input: userAgent
        });

        if (error) {
            console.error('Proposal signing failed', {
                operation: 'proposal.sign',
                provider: 'supabase',
                status: 'failed',
                errorCode: error.code || 'proposal_sign_failed',
            });
            return NextResponse.json(
                { error: 'Não foi possível assinar a proposta.' },
                { status: 400 }
            );
        }

        if (!data || !data.success) {
            return NextResponse.json(
                { error: 'Proposta inválida ou indisponível.' },
                { status: 400 }
            );
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        const signError = error as { code?: string; name?: string };
        console.error('Proposal signing failed', {
            operation: 'proposal.sign',
            provider: 'supabase',
            status: 'failed',
            errorCode: signError.code || signError.name || 'proposal_sign_unexpected_error',
        });
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
