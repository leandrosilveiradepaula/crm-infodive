import React from 'react';
import { fetchDealForEditor, fetchDistributorsForEditor } from '../actions';
import { ProposalEditorClient } from '@/components/proposals/editor/ProposalEditorClient';
import { getProposals } from '@/app/(dashboard)/proposals/proposals-actions';

interface PageProps {
    params: Promise<{ dealId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProposalEditorPage({ params, searchParams }: PageProps) {
    const { dealId } = await params;
    const resolvedSearchParams = await searchParams;
    const sourceProposalId = resolvedSearchParams?.sourceProposalId as string | undefined;

    const [deal, distributors] = await Promise.all([
        fetchDealForEditor(dealId),
        fetchDistributorsForEditor(),
    ]);

    let initialData = null;
    const proposals = await getProposals(dealId);

    if (sourceProposalId) {
        const sourceProp = proposals.find(p => p.id === sourceProposalId);
        if (sourceProp && sourceProp.content) {
            initialData = sourceProp.content;
        }
    } else if (proposals.length > 0) {
        // If no specific source, load the latest one automatically
        const latestProp = proposals[0]; // Already sorted by created_at desc in fetchProposals
        if (latestProp.content) {
            initialData = latestProp.content;
        }
    }

    return (
        <ProposalEditorClient
            deal={deal}
            distributors={distributors}
            initialData={initialData}
        />
    );
}
