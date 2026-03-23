'use server';

import { AccountService } from '@/services/AccountService';
import { DocumentService } from '@/services/DocumentService';
import { Account } from '@/types/account';
import type { DocumentCategory } from '@/types/document';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';

export async function getAccounts() {
    const { userId, organizationId } = await requireSessionContext();
    return await AccountService.getAccounts(userId, organizationId);
}

export async function getSimpleAccounts() {
    const { userId, organizationId } = await requireSessionContext();
    return await AccountService.getSimpleAccounts(userId, organizationId);
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

// ============================================================
// Account Documents (using generic DocumentService)
// ============================================================

export async function getAccountDocuments(accountId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getDocuments(userId, organizationId, 'account', accountId);
}

export async function uploadAccountDocument(accountId: string, formData: FormData) {
    const { userId, organizationId } = await requireSessionContext();

    const file = formData.get('file') as File | null;
    if (!file) throw new Error('Nenhum arquivo enviado.');

    const category = (formData.get('category') as DocumentCategory) || 'outro';
    const description = (formData.get('description') as string) || '';

    const arrayBuffer = await file.arrayBuffer();

    const result = await DocumentService.uploadDocument(
        userId,
        organizationId,
        'account',
        accountId,
        {
            name: file.name,
            type: file.type,
            size: file.size,
            arrayBuffer,
        },
        { category, description }
    );

    revalidatePath('/customers');
    return result;
}

export async function getAccountDocumentSignedUrl(documentId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getSignedUrl(userId, organizationId, documentId);
}

export async function deleteAccountDocument(documentId: string) {
    const { userId, organizationId } = await requireSessionContext();
    await DocumentService.deleteDocument(userId, organizationId, documentId);
    revalidatePath('/customers');
    return true;
}

