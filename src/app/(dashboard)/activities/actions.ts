'use server';

import { Activity } from '@/types/activity';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';
import { ActivityService } from '@/services/ActivityService';

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
    const data = await ActivityService.createActivity(userId, organizationId, activity);
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
