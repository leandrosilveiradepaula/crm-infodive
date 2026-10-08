'use server';

import { Activity } from '@/types/activity';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';
import { ActivityService } from '@/services/ActivityService';
import { ActivityAiService } from '@/services/ActivityAiService';

export async function getActivities() {
    const { userId, organizationId } = await requireSessionContext();
    return await ActivityService.getActivities(userId, organizationId);
}

export async function getDealsDropdown() {
    const { userId, organizationId } = await requireSessionContext();
    return await ActivityService.getDealsDropdown(userId, organizationId);
}

export async function getAccountsDropdown() {
    const { userId, organizationId } = await requireSessionContext();
    return await ActivityService.getAccountsDropdown(userId, organizationId);
}

export async function createActivity(activity: Partial<Activity>) {
    const { userId, organizationId } = await requireSessionContext();
    const data = await ActivityService.createActivity(userId, organizationId, { ...activity, source: 'manual' });
    revalidatePath('/activities');
    return data;
}

export async function updateActivity(id: string, updates: Partial<Activity>) {
    const { userId, organizationId } = await requireSessionContext();
    await ActivityService.updateActivity(userId, id, organizationId, updates);
    revalidatePath('/activities');
}

export async function deleteActivity(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    await ActivityService.deleteActivity(userId, id, organizationId);
    revalidatePath('/activities');
}

// ─── AI Suggestions ──────────────────────────────────────────

export async function getSuggestions(dealId?: string) {
    const { organizationId } = await requireSessionContext();
    return await ActivityAiService.getSuggestions(organizationId, dealId);
}

export async function acceptSuggestion(suggestionId: string) {
    const { userId, organizationId } = await requireSessionContext();
    const activity = await ActivityAiService.acceptSuggestion(userId, organizationId, suggestionId);
    revalidatePath('/activities');
    return activity;
}

export async function dismissSuggestion(suggestionId: string) {
    const { organizationId } = await requireSessionContext();
    await ActivityAiService.dismissSuggestion(organizationId, suggestionId);
    revalidatePath('/activities');
}

// ─── Automation ──────────────────────────────────────────────

export async function evaluateInactiveDeals() {
    const { userId, organizationId } = await requireSessionContext();
    await ActivityAiService.evaluateInactiveDeals(userId, organizationId);
    revalidatePath('/activities');
}
