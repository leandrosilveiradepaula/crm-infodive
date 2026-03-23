'use server';

import { Lead } from '@/types/lead';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';

import { LeadService } from '@/services/LeadService';

export async function getLeads() {
    const { userId, organizationId } = await requireSessionContext();
    return await LeadService.getLeads(userId, organizationId);
}

export async function createLead(lead: Partial<Lead>) {
    const { userId, organizationId } = await requireSessionContext();
    const data = await LeadService.createLead(userId, organizationId, lead);
    revalidatePath('/leads');
    return data;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
    const { userId, organizationId } = await requireSessionContext();
    await LeadService.updateLead(userId, id, organizationId, updates);
    revalidatePath('/leads');
}

export async function deleteLead(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    await LeadService.deleteLead(userId, id, organizationId);
    revalidatePath('/leads');
}
