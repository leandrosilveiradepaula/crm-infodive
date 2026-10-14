'use server';

import { revalidatePath } from 'next/cache';
import { type Account } from '@/types/account';
import { AccountService } from '@/services/AccountService';
import { requirePermission } from '@/lib/auth-server';

export async function getAccounts(): Promise<Account[]> {
    const { userId, organizationId } = await requirePermission('clients:view_all');
    return await AccountService.getAccounts(userId, organizationId);
}

export async function createAccount(account: Partial<Account>) {
    const { userId, organizationId } = await requirePermission('clients:create');
    const result = await AccountService.createAccount(userId, organizationId, account);
    if (result.success) revalidatePath('/customers');
    return result;
}

export async function updateAccount(id: string, updates: Partial<Account>) {
    const { userId, organizationId } = await requirePermission('clients:edit');
    const result = await AccountService.updateAccount(userId, organizationId, id, updates);
    if (result.success) revalidatePath('/customers');
    return result;
}

export async function deleteAccount(id: string) {
    const { userId, organizationId } = await requirePermission('clients:delete');
    const result = await AccountService.deleteAccount(userId, organizationId, id);
    if (result.success) revalidatePath('/customers');
    return result;
}

export async function bulkCreateAccounts(accounts: any[]) {
    const { userId, organizationId } = await requirePermission('clients:import');
    const result = await AccountService.bulkCreateAccounts(userId, organizationId, accounts);
    revalidatePath('/customers');
    return result;
}
