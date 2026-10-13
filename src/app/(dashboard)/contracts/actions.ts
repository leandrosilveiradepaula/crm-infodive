'use server';

import { requirePermission } from '@/lib/auth-server';
import { getAiDealScope } from '@/lib/ai-deal-scope';
import { ContractService } from '@/services/ContractService';
import { revalidatePath } from 'next/cache';
import { type Contract } from '@/types/contract';

export async function getContracts(): Promise<Contract[]> {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { canViewAll } = await getAiDealScope(userId, organizationId);
        const data = await ContractService.getContracts(organizationId, canViewAll ? undefined : userId);
        return data.map((item) => ({
            id: item.id,
            title: item.title,
            company: item.company_name,
            value: item.value || 0,
            status: item.status,
            type: item.type,
            signerName: item.signer_name,
            signerRole: item.signer_role,
            dealId: item.deal_id,
            proposalId: item.proposal_id,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            content_json: item.content_json,
            signature_image: item.signature_image
        }));
    } catch {
        console.error('[ContractsActions] contracts fetch failed');
        throw new Error('Não foi possível carregar os contratos. Tente novamente.');
    }
}

export async function getContractCreationDeals(): Promise<{ requiresDeal: boolean; deals: { id: string; title: string; company: string }[] }> {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const { canViewAll } = await getAiDealScope(userId, organizationId);
    if (canViewAll) return { requiresDeal: false, deals: [] };
    const deals = await ContractService.getOwnedContractDealOptions(organizationId, userId);
    return { requiresDeal: true, deals };
}

export async function createContract(contract: Partial<Contract>) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { canViewAll } = await getAiDealScope(userId, organizationId);
        const data = await ContractService.createContract(organizationId, contract, canViewAll ? undefined : userId);
        revalidatePath('/contracts');
        return { success: true, data };
    } catch {
        console.error('[ContractsActions] contract creation failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}

export async function updateContract(id: string, updates: Partial<Contract>) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { canViewAll } = await getAiDealScope(userId, organizationId);
        await ContractService.updateContract(organizationId, id, updates, canViewAll ? undefined : userId);
        revalidatePath('/contracts');
        return { success: true };
    } catch {
        console.error('[ContractsActions] contract update failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}

/** Save an already-existing draft using the exact revision observed by the editor. */
export async function saveContractDraft(id: string, title: string, text: string, expectedUpdatedAt: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (typeof id !== 'string' || !id.trim() || typeof title !== 'string' ||
            typeof text !== 'string' || typeof expectedUpdatedAt !== 'string' || !expectedUpdatedAt) {
            throw new Error('Rascunho inválido.');
        }
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { canViewAll } = await getAiDealScope(userId, organizationId);
        await ContractService.updateContract(
            organizationId, id,
            { title: title.trim(), content_json: { text }, status: 'draft' },
            canViewAll ? undefined : userId,
            expectedUpdatedAt
        );
        revalidatePath('/contracts');
        return { success: true };
    } catch {
        console.error('[ContractsActions] draft save failed');
        return { success: false, error: 'Não foi possível salvar. Recarregue a lista; o rascunho pode ter sido alterado.' };
    }
}

export async function deleteContract(id: string) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        const { canViewAll } = await getAiDealScope(userId, organizationId);
        await ContractService.deleteContract(organizationId, id, canViewAll ? undefined : userId);
        revalidatePath('/contracts');
        return { success: true };
    } catch {
        console.error('[ContractsActions] contract deletion failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}

