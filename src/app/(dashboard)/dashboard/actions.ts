'use server';

import { DashboardService } from '@/services/DashboardService';
import { ActivityService } from '@/services/ActivityService';
import { requireSessionContext } from '@/lib/auth-server';

export async function getDashboardMetrics() {
    const { userId, organizationId } = await requireSessionContext();
    return await DashboardService.getDashboardMetrics(userId, organizationId);
}

export async function getDashboardDeals() {
    const { userId, organizationId } = await requireSessionContext();
    return await DashboardService.getDashboardDeals(userId, organizationId);
}

export async function getRecentDeals() {
    const { userId, organizationId } = await requireSessionContext();
    return await DashboardService.getRecentDeals(userId, organizationId);
}

export async function getUpcomingTasks() {
    const { userId, organizationId } = await requireSessionContext();
    return await ActivityService.getUpcomingTasks(userId, organizationId);
}

export async function searchGlobal(query: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DashboardService.searchGlobal(userId, organizationId, query);
}
