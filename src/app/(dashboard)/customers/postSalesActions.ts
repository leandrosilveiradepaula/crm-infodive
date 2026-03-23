'use server';

import { requireSessionContext } from '@/lib/auth-server';
import { AssetService } from '@/services/AssetService';
import { ServiceContractService } from '@/services/ServiceContractService';
import { CustomerAsset, ServiceContract } from '@/types/postSales';
import { revalidatePath } from 'next/cache';

// Assets
export async function getAccountAssets(accountId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await AssetService.getAssets(userId, organizationId, accountId);
}

export async function createAccountAsset(payload: Partial<CustomerAsset>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AssetService.createAsset(userId, organizationId, payload);
    revalidatePath('/customers');
    return result;
}

export async function updateAccountAsset(assetId: string, updates: Partial<CustomerAsset>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AssetService.updateAsset(userId, organizationId, assetId, updates);
    revalidatePath('/customers');
    return result;
}

export async function deleteAccountAsset(assetId: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AssetService.deleteAsset(userId, organizationId, assetId);
    revalidatePath('/customers');
    return result;
}

// Service Contracts
export async function getAccountContracts(accountId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await ServiceContractService.getContracts(userId, organizationId, accountId);
}

export async function createAccountContract(payload: Partial<ServiceContract>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ServiceContractService.createContract(userId, organizationId, payload);
    revalidatePath('/customers');
    return result;
}

export async function updateAccountContract(contractId: string, updates: Partial<ServiceContract>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ServiceContractService.updateContract(userId, organizationId, contractId, updates);
    revalidatePath('/customers');
    return result;
}

export async function deleteAccountContract(contractId: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ServiceContractService.deleteContract(userId, organizationId, contractId);
    revalidatePath('/customers');
    return result;
}
