import { NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { ProposalPdfDocument } from '@/components/proposals/pdf/ProposalPdfDocument';
import type { SectionId, EditableTexts, EditorConfig } from '@/hooks/useProposalEditorState';

export async function POST(request: Request) {
    try {
        const { userId, organizationId } = await requireSessionContext();

        const body = await request.json();
        const {
            dealId,
            activeSections,
            editableTexts,
            config,
            aiSummary,
            softwareHighlights,
            benefitTiles,
        } = body as {
            dealId: string;
            activeSections: SectionId[];
            editableTexts: EditableTexts;
            config: EditorConfig;
            aiSummary?: string;
            softwareHighlights?: Array<{ title: string; value: string }>;
            benefitTiles?: Array<{ value: string; label: string }>;
        };

        // Validate required fields
        if (!dealId || !activeSections || !editableTexts || !config) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch deal with organization isolation
        const supabase = createAdminClient();
        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('*, deal_products(*)')
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found or access denied' }, { status: 404 });
        }

        // Fetch organization theme
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('theme_primary, theme_accent')
            .eq('id', organizationId)
            .single();

        if (orgError) {
            console.warn('Error fetching organization theme:', orgError);
        }

        // Generate proposal number
        const { data: proposalNumber } = await supabase
            .rpc('get_next_proposal_number', { p_organization_id: organizationId });

        // Fetch distributors referenced by products
        // Distributors are stored in the 'accounts' table with relationship_type = 'Distribuidor'
        const distributorIds = [...new Set(
            (deal.deal_products || [])
                .map((p: any) => p.distributor_id)
                .filter(Boolean)
        )];
        let distributors: any[] = [];
        if (distributorIds.length > 0) {
            const { data: distData } = await supabase
                .from('accounts')
                .select('id, name, cnpj, payment_terms')
                .in('id', distributorIds)
                .eq('organization_id', organizationId);
            distributors = distData || [];
        }

        // Render PDF using @react-pdf/renderer
        const element = React.createElement(ProposalPdfDocument, {
            dealTitle: deal.title,
            companyName: deal.company || 'Cliente',
            products: deal.deal_products || [],
            proposalNumber: proposalNumber ? String(proposalNumber) : undefined,
            activeSections,
            editableTexts,
            config,
            aiSummary,
            softwareHighlights,
            benefitTiles,
            distributors,
            themePrimary: org?.theme_primary,
            themeAccent: org?.theme_accent,
        });
        const pdfBuffer = await renderToBuffer(element as any);

        // Calculate total value
        const totalValue = (deal.deal_products || [])
            .filter((p: any) => !p.is_optional)
            .reduce((acc: number, p: any) => acc + (p.unit_price || 0) * (p.quantity || 1), 0);

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

        // Save proposal record in database
        const proposalData = {
            deal_id: dealId,
            organization_id: organizationId,
            created_by: userId,
            title: editableTexts.proposalTitle || `Proposta: ${deal.title}`,
            number: proposalNumber || null,
            status: 'draft',
            version: nextVersion,
            total: totalValue,
            products_json: deal.deal_products || [],
            content_json: {
                activeSections,
                editableTexts,
                config,
                aiSummary,
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
            console.error('Error saving proposal:', saveError);
            // Still return PDF even if save fails
        }

        // Return PDF as Uint8Array (compatible with NextResponse)
        const pdfUint8 = new Uint8Array(pdfBuffer);
        return new NextResponse(pdfUint8, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="proposta-${proposalNumber || 'draft'}.pdf"`,
                'X-Proposal-Id': savedProposal?.id || '',
                'X-Proposal-Number': String(proposalNumber || ''),
            },
        });
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        if (error?.message?.includes('Unauthorized') || error?.message?.includes('session')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
