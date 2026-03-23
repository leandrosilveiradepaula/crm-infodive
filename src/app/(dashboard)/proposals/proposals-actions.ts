'use server';

import { PROPOSAL_STATUS } from '@/lib/constants';
import type { Proposal, ProposalStatus } from '@/types/proposal';
import { requireSessionContext } from '@/lib/auth-server';
import { ProposalService } from '@/services/ProposalService';
import { revalidatePath } from 'next/cache';

export async function getProposals(dealId: string): Promise<Proposal[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await ProposalService.fetchProposals(userId, dealId, organizationId);
}

export async function createProposalAction(proposalData: Partial<Proposal>) {
    const { userId, organizationId } = await requireSessionContext();

    try {
        const data = await ProposalService.createProposal(userId, organizationId, {
            deal_id: proposalData.dealId,
            account_id: proposalData.accountId,
            lead_id: proposalData.leadId,
            customer_id: proposalData.customerId || proposalData.accountId || proposalData.leadId,
            title: proposalData.title,
            company_name: proposalData.customerName || 'Cliente',
            template_id: proposalData.template || 'commercial',
            status: PROPOSAL_STATUS.DRAFT,
            content_json: { sections: proposalData.sections },
            products_json: proposalData.products,
            terms: proposalData.terms,
            subtotal: proposalData.subtotal,
            discount: proposalData.discount,
            total: proposalData.total,
            valid_until: proposalData.validUntil
        });

        const p = data;
        const mapped: Proposal = {
            id: p.id,
            deal_id: p.deal_id,
            number: p.number,
            title: p.title,
            content: p.content_json || {},
            dealId: p.deal_id,
            accountId: p.account_id,
            leadId: p.lead_id,
            customerId: p.customer_id || p.account_id || p.lead_id,
            customerName: p.company_name || 'Cliente',
            customerEmail: p.customer_email || '',
            status: p.status as ProposalStatus,
            template: (p.template_id as any) || 'commercial',
            version: p.version,
            sections: (p.content_json as any)?.sections || [],
            products: p.products_json || [],
            terms: p.terms || '',
            subtotal: Number(p.subtotal) || 0,
            discount: Number(p.discount) || 0,
            discountPercentage: 0,
            tax: 0,
            taxPercentage: 0,
            total: Number(p.total) || 0,
            validUntil: p.valid_until,
            createdBy: p.created_by,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            versions: [],
            includeTerms: true,
            includeLogo: true,
            includeSignature: true
        };

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error('Error creating proposal:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProposalAction(id: string, updates: Partial<Proposal>) {
    const { userId, organizationId } = await requireSessionContext();

    try {
        await ProposalService.updateProposal(userId, id, organizationId, {
            status: updates.status,
            sent_at: updates.sentAt,
            viewed_at: updates.viewedAt,
            signed_at: updates.signedAt,
        });

        revalidatePath(`/pipeline/${updates.dealId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating proposal:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteProposalAction(id: string, dealId?: string) {
    const { userId, organizationId } = await requireSessionContext();

    try {
        await ProposalService.deleteProposal(userId, id, organizationId);
        if (dealId) revalidatePath(`/pipeline/${dealId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting proposal:', error);
        return { success: false, error: error.message };
    }
}

