'use server';

import { revalidatePath } from 'next/cache';
import { type Account } from '@/types/account';
import { AccountService } from '@/services/AccountService';
import { requireSessionContext } from '@/lib/auth-server';

export async function getAccounts(): Promise<Account[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await AccountService.getAccounts(userId, organizationId);
}

export async function createAccount(account: Partial<Account>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AccountService.createAccount(userId, organizationId, account);
    if (result.success) revalidatePath('/customers');
    return result;
}

export async function updateAccount(id: string, updates: Partial<Account>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AccountService.updateAccount(userId, organizationId, id, updates);
    if (result.success) revalidatePath('/customers');
    return result;
}

export async function deleteAccount(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AccountService.deleteAccount(userId, organizationId, id);
    if (result.success) revalidatePath('/customers');
    return result;
}
