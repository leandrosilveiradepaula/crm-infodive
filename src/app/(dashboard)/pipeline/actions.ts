'use server';

import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';

import { DealService } from '@/services/DealService';
import { ProposalService } from '@/services/ProposalService';
import { AccountService } from '@/services/AccountService';
import { ContactService } from '@/services/ContactService';
import { ProductService } from '@/services/ProductService';
import { DocumentService } from '@/services/DocumentService';
import type { DocumentCategory } from '@/types/document';

export async function getPipelineData() {
    const { userId, organizationId } = await requireSessionContext();
    return await DealService.getPipelineData(userId, organizationId);
}

export async function getAccountContacts(accountId?: string | null) {
    const { userId, organizationId } = await requireSessionContext();
    return await ContactService.getAccountContacts(userId, organizationId, accountId);
}

export async function updateDealStage(dealId: string, newStage: string, probability?: number) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.updateDealStage(userId, dealId, organizationId, newStage, probability);
    revalidatePath('/pipeline');
}

export async function createDeal(deal: any) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.createDeal(userId, organizationId, deal);
    revalidatePath('/pipeline');
}

export async function getDealDetails(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    revalidatePath('/pipeline');
    return await DealService.getDealDetails(userId, dealId, organizationId);
}

export async function updateDeal(dealId: string, updates: any) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.updateDeal(userId, dealId, organizationId, updates);
    revalidatePath('/pipeline');
    return true;
}

export async function duplicateDealEntry(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
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
    const { userId, organizationId } = await requireSessionContext();
    const data = await DealService.addDealProduct(userId, dealId, organizationId, product);
    revalidatePath('/pipeline');
    return data;
}

export async function removeDealProduct(itemId: string) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.removeDealProduct(userId, itemId, organizationId);
    revalidatePath('/pipeline');
    return true;
}

export async function bulkRemoveDealProducts(itemIds: string[]) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.bulkRemoveDealProducts(userId, itemIds, organizationId);
    revalidatePath('/pipeline');
    return true;
}

export async function updateDealProduct(itemId: string, updates: any) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.updateDealProduct(userId, itemId, organizationId, updates);
    revalidatePath('/pipeline');
    return true;
}

export async function reorderDealProducts(items: { id: string, display_order: number }[]) {
    const { userId, organizationId } = await requireSessionContext();
    await DealService.reorderDealProducts(userId, organizationId, items);
    revalidatePath('/pipeline');
    return true;
}

export async function bulkAddDealProducts(dealId: string, products: any[]) {
    const { userId, organizationId } = await requireSessionContext();
    const data = await DealService.bulkAddDealProducts(userId, dealId, organizationId, products);
    revalidatePath('/pipeline');
    return data;
}

export async function fetchProposals(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await ProposalService.fetchProposals(userId, dealId, organizationId);
}

export async function deleteProposal(id: string, dealId?: string) {
    const { userId, organizationId } = await requireSessionContext();
    await ProposalService.deleteProposal(userId, id, organizationId);
    if (dealId) revalidatePath(`/pipeline/${dealId}`);
    revalidatePath('/pipeline');
    return true;
}

export async function createProposal(payload: any) {
    const { userId, organizationId } = await requireSessionContext();
    const data = await ProposalService.createProposal(userId, organizationId, payload);
    revalidatePath('/pipeline');
    return data;
}

export async function updateProposal(proposalId: string, updates: Partial<{
    status: string;
    sent_at: string;
    sentAt: string;
    viewed_at: string;
    viewedAt: string;
    signed_at: string;
    signedAt: string;
    public_token: string;
    allow_signature: boolean;
}>) {
    const { userId, organizationId } = await requireSessionContext();
    const data = await ProposalService.updateProposal(userId, proposalId, organizationId, updates);
    revalidatePath('/pipeline');
    return data;
}

export async function getOrCreateRoom(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
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
    const { userId, organizationId } = await requireSessionContext();

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
    const { userId, organizationId } = await requireSessionContext();
    await DocumentService.deleteDocument(userId, organizationId, documentId);
    revalidatePath('/pipeline');
    return true;
}
