import { NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/proposals/generate-number
// Generates the next proposal number for the authenticated user's organization
export async function GET() {
    try {
        const { userId } = await requireSessionContext();
        const supabase = createAdminClient();

        // Get the user's organization_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', userId)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json({ error: 'User has no organization' }, { status: 403 });
        }

        // Call the DB function that generates the sequential number
        const { data: number, error } = await supabase
            .rpc('get_next_proposal_number', { p_organization_id: profile.organization_id });

        if (error) {
            console.error('[ProposalGenerateNumberRoute] proposal number generation failed');
            return NextResponse.json({ error: 'Não foi possível gerar o número da proposta.' }, { status: 500 });
        }

        return NextResponse.json({ number });
    } catch {
        console.error('[ProposalGenerateNumberRoute] proposal number generation failed');
        return NextResponse.json({ error: 'Não foi possível gerar o número da proposta.' }, { status: 500 });
    }
}
