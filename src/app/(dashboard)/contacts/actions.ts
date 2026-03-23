'use server';

import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Contact } from '@/types/contact';
import { ContactService } from '@/services/ContactService';

export async function getContacts() {
    const { userId, organizationId } = await requireSessionContext();
    return await ContactService.getContacts(userId, organizationId);
}

export async function createContact(contact: Partial<Contact>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ContactService.createContact(userId, organizationId, contact);
    if (result.success) revalidatePath('/contacts');
    return result;
}

export async function updateContact(id: string, updates: Partial<Contact>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ContactService.updateContact(userId, id, organizationId, updates);
    if (result.success) revalidatePath('/contacts');
    return result;
}

export async function deleteContact(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ContactService.deleteContact(userId, id, organizationId);
    if (result.success) revalidatePath('/contacts');
    return result;
}

