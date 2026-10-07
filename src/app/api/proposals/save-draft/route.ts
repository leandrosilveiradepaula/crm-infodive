import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');

        const body = await request.json();
        const {
            dealId,
            activeSections,
            editableTexts,
            config,
            aiSummary,
            objectives,
            simplifiedProductNames,
            softwareHighlights,
            benefitTiles,
        } = body;

        // Validate required fields
        if (!dealId || !activeSections || !editableTexts || !config) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Fetch deal to verify existence and get company name
        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('*, deal_products(*)')
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found or access denied' }, { status: 404 });
        }

        // Auto-increment version for the deal
        const { data: latestProposal } = await supabase
            .from('proposals')
            .select('version')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextVersion = (latestProposal?.version || 0) + 1;

        // Generate proposal number
        const { data: proposalNumber } = await supabase
            .rpc('get_next_proposal_number', { p_organization_id: organizationId });

        // Save proposal record in database
        const proposalData = {
            deal_id: dealId,
            organization_id: organizationId,
            created_by: userId,
            title: editableTexts.proposalTitle || `Proposta: ${deal.title}`,
            number: proposalNumber || null,
            status: 'draft',
            version: nextVersion,
            total: (deal.deal_products || [])
                .filter((p: any) => !p.is_optional)
                .reduce((acc: number, p: any) => acc + (p.unit_price || 0) * (p.quantity || 1), 0),
            products_json: deal.deal_products || [],
            content_json: {
                activeSections,
                editableTexts,
                config,
                aiSummary,
                objectives,
                simplifiedProductNames,
                softwareHighlights,
                benefitTiles,
            },
            template_id: config.template,
            company_name: deal.company || 'Cliente',
        };

        const { data: savedProposal, error: saveError } = await supabase
            .from('proposals')
            .insert([proposalData])
            .select()
            .single();

        if (saveError) {
            console.error('[ProposalSaveDraftRoute] proposal draft save failed');
        const message = error instanceof Error ? error.message : '';
            return NextResponse.json({ 
                error: 'Error saving proposal draft',
                code: saveError.code 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            proposalId: savedProposal.id,
            version: savedProposal.version
        });
    } catch (error: unknown) {
        console.error('[ProposalSaveDraftRoute] proposal draft save failed');
        if (message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (message.includes('Unauthorized') || message.includes('session')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Não foi possível salvar o rascunho.' }, { status: 500 });
    }
}
