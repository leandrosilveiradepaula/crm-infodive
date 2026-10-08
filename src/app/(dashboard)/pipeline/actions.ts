'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireSessionContext } from '@/lib/auth-server';

import { DealService } from '@/services/DealService';
import { ProposalService } from '@/services/ProposalService';
import { AccountService } from '@/services/AccountService';
import { ContactService } from '@/services/ContactService';
import { ProductService } from '@/services/ProductService';
import { ActivityAiService } from '@/services/ActivityAiService';
import { AutomationRuntimeService } from '@/services/AutomationRuntimeService';
import { DocumentService } from '@/services/DocumentService';
import type { DocumentCategory } from '@/types/document';
import { Deal } from '@/types/deal';
import { Account } from '@/types/account';
import { Contact } from '@/types/contact';
import { Proposal } from '@/types/proposal';
import { PipelineData } from '@/services/DealService';

export async function getPipelineData(): Promise<PipelineData> {
    const { userId, organizationId } = await requireSessionContext();
    return await DealService.getPipelineData(userId, organizationId);
}

export async function getAccountContacts(accountId?: string | null): Promise<Contact[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await ContactService.getAccountContacts(userId, organizationId, accountId) as unknown as Contact[];
}

export async function updateDealStage(dealId: string, newStage: string, probability?: number, dealTitle?: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DealService.updateDealStage(userId, dealId, organizationId, newStage, probability);
    const automationEventId = randomUUID();
    await AutomationRuntimeService.executeEvent(userId, organizationId, {
        eventId: automationEventId,
        type: 'deal_moved',
        organizationId,
        entityId: dealId,
        data: { stage: newStage, title: dealTitle || '' },
    }).catch(() => {
        console.error('[PipelineActions] configurable stage automation failed');
    });
    // Trigger legacy deterministic activity rule on stage change
    if (dealTitle) {
        ActivityAiService.onStageChange(userId, organizationId, dealId, newStage, dealTitle).catch(() => {
            console.error('[PipelineActions] stage change automation failed');
        });
    }
    revalidatePath('/pipeline');
}

export async function createDeal(deal: Partial<Deal>): Promise<Deal> {
    const { userId, organizationId } = await requirePermission('deals:create');
    const result = await DealService.createDeal(userId, organizationId, deal);
    const automationEventId = randomUUID();
    await AutomationRuntimeService.executeEvent(userId, organizationId, {
        eventId: automationEventId,
        type: 'deal_created',
        organizationId,
        entityId: result.id,
        data: { title: result.title, stage: result.stage || '', value: result.value || 0 },
    }).catch(() => {
        console.error('[PipelineActions] configurable deal automation failed');
    });
    // Trigger legacy deterministic activity rule on deal creation
    ActivityAiService.onDealCreated(userId, organizationId, result.id, result.title).catch(() => {
        console.error('[PipelineActions] deal creation automation failed');
    });
    revalidatePath('/pipeline');
    return result;
}

export async function getDealDetails(dealId: string): Promise<Deal | null> {
    const { userId, organizationId } = await requireSessionContext();
    revalidatePath('/pipeline');
    return await DealService.getDealDetails(userId, dealId, organizationId);
}

export async function updateDeal(dealId: string, updates: Partial<Deal>): Promise<boolean> {
    const changesOwner = Object.prototype.hasOwnProperty.call(updates, 'owner_id');
    const { userId, organizationId } = await requirePermission(
        changesOwner ? 'deals:change_owner' : 'deals:edit'
    );
    await DealService.updateDeal(userId, dealId, organizationId, updates);
    revalidatePath('/pipeline');
    return true;
}

export async function duplicateDealEntry(dealId: string) {
    const { userId, organizationId } = await requirePermission('deals:create');
    const result = await DealService.duplicateDeal(userId, dealId, organizationId);
    revalidatePath('/pipeline');
    return result;
}

export async function fetchProducts() {
    const { userId, organizationId } = await requireSessionContext();
    return await ProductService.getProducts(userId, organizationId);
}

export async function getAccounts() {
    const { userId, organizationId } = await requireSessionContext();
    return await AccountService.getSimpleAccounts(userId, organizationId);
}

export async function addDealProduct(dealId: string, product: any) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const data = await DealService.addDealProduct(userId, dealId, organizationId, product);
    revalidatePath('/pipeline');
    return data;
}

export async function removeDealProduct(itemId: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DealService.removeDealProduct(userId, itemId, organizationId);
    revalidatePath('/pipeline');
    return true;
}

export async function bulkRemoveDealProducts(itemIds: string[]) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DealService.bulkRemoveDealProducts(userId, itemIds, organizationId);
    revalidatePath('/pipeline');
    return true;
}

export async function updateDealProduct(itemId: string, updates: any) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DealService.updateDealProduct(userId, itemId, organizationId, updates);
    revalidatePath('/pipeline');
    return true;
}

export async function reorderDealProducts(items: { id: string, display_order: number }[]) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DealService.reorderDealProducts(userId, organizationId, items);
    revalidatePath('/pipeline');
    return true;
}

export async function bulkAddDealProducts(dealId: string, products: any[]) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const data = await DealService.bulkAddDealProducts(userId, dealId, organizationId, products);
    revalidatePath('/pipeline');
    return data;
}

export async function fetchProposals(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await ProposalService.fetchProposals(userId, dealId, organizationId);
}

export async function deleteProposal(id: string, dealId?: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await ProposalService.deleteProposal(userId, id, organizationId);
    if (dealId) revalidatePath(`/pipeline/${dealId}`);
    revalidatePath('/pipeline');
    return true;
}

export async function createProposal(payload: any) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const data = await ProposalService.createProposal(userId, organizationId, payload);
    revalidatePath('/pipeline');
    return data;
}

export async function updateProposal(proposalId: string, updates: Partial<Proposal>) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const data = await ProposalService.updateProposal(userId, proposalId, organizationId, updates);
    revalidatePath('/pipeline');
    return data;
}

export async function getOrCreateRoom(dealId: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    return await DealService.getOrCreateRoom(userId, dealId, organizationId);
}

// ============================================================
// Deal Documents (using generic DocumentService)
// ============================================================

export async function getDealDocuments(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getDocuments(userId, organizationId, 'deal', dealId);
}

export async function uploadDealDocument(dealId: string, formData: FormData) {
    const { userId, organizationId } = await requirePermission('deals:edit');

    const file = formData.get('file') as File | null;
    if (!file) throw new Error('Nenhum arquivo enviado.');

    const category = (formData.get('category') as DocumentCategory) || 'outro';
    const description = (formData.get('description') as string) || '';

    const arrayBuffer = await file.arrayBuffer();

    const result = await DocumentService.uploadDocument(
        userId,
        organizationId,
        'deal',
        dealId,
        {
            name: file.name,
            type: file.type,
            size: file.size,
            arrayBuffer,
        },
        { category, description }
    );

    revalidatePath('/pipeline');
    return result;
}

export async function getDealDocumentSignedUrl(documentId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getSignedUrl(userId, organizationId, documentId);
}

export async function deleteDealDocument(documentId: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DocumentService.deleteDocument(userId, organizationId, documentId);
    revalidatePath('/pipeline');
    return true;
}
