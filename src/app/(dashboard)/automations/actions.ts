'use server';

import { revalidatePath } from 'next/cache';
import { type Automation, type EmailTemplate } from '@/types/automation';
import { requireSessionContext } from '@/lib/auth-server';
import { AutomationService } from '@/services/AutomationService';

export async function getAutomations(): Promise<Automation[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await AutomationService.getAutomations(userId, organizationId);
}

export async function createAutomation(automation: Partial<Automation>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AutomationService.createAutomation(userId, organizationId, automation);
    if (result.success) revalidatePath('/automations');
    return result;
}

export async function toggleAutomation(id: string, enabled: boolean) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AutomationService.toggleAutomation(userId, id, organizationId, enabled);
    if (result.success) revalidatePath('/automations');
    return result;
}

export async function updateAutomation(id: string, automation: Partial<Automation>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AutomationService.updateAutomation(userId, id, organizationId, automation);
    if (result.success) revalidatePath('/automations');
    return result;
}

export async function deleteAutomation(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await AutomationService.deleteAutomation(userId, id, organizationId);
    if (result.success) revalidatePath('/automations');
    return result;
}

export async function getTemplates(): Promise<EmailTemplate[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await AutomationService.getTemplates(userId, organizationId);
}


export async function getAutomationHistory(id: string) {
    const { organizationId } = await requireSessionContext();
    return await AutomationService.getExecutionHistory(id, organizationId);
}
