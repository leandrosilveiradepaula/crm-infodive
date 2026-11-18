'use server';

import { requireSessionContext } from '@/lib/auth-server';
import { roleAllowsPermission } from '@/lib/permission-matrix';
import { createAdminClient } from '@/lib/supabase/admin';
import { ContractService } from '@/services/ContractService';
import { revalidatePath } from 'next/cache';
import { type Contract } from '@/types/contract';

export async function getContracts(page = 0, pageSize = 100): Promise<Contract[]> {
    try {
        const { organizationId, userId } = await requireSessionContext();
        const admin = createAdminClient();
        const { data: profile, error } = await admin
            .from('profiles')
            .select('role,status,organization_id')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error || !profile || profile.status !== 'active') {
            throw new Error('Não foi possível validar o acesso aos contratos.');
        }

        const canViewAll = roleAllowsPermission(profile.role, 'deals:view_all');
        if (!canViewAll && profile.role !== 'vendedor') {
            throw new Error('Você não tem permissão para visualizar contratos.');
        }

        const data = await ContractService.getContracts(
            organizationId,
            canViewAll ? null : userId,
            canViewAll,
            page,
            pageSize,
        );

        return data.map((item: any) => ({
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
        throw new Error('Não foi possível carregar os contratos.');
    }
}

export async function createContract(contract: Partial<Contract>) {
    try {
        const { organizationId } = await requireSessionContext();
        const data = await ContractService.createContract(organizationId, contract);
        revalidatePath('/contracts');
        return { success: true, data };
    } catch {
        console.error('[ContractsActions] contract creation failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}

export async function updateContract(id: string, updates: Partial<Contract>) {
    try {
        const { organizationId } = await requireSessionContext();
        await ContractService.updateContract(organizationId, id, updates);
        revalidatePath('/contracts');
        return { success: true };
    } catch {
        console.error('[ContractsActions] contract update failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}

export async function deleteContract(id: string) {
    try {
        const { organizationId } = await requireSessionContext();
        await ContractService.deleteContract(organizationId, id);
        revalidatePath('/contracts');
        return { success: true };
    } catch {
        console.error('[ContractsActions] contract deletion failed');
        return { success: false, error: 'Não foi possível processar o contrato.' };
    }
}
