'use server';

import { DashboardService } from '@/services/DashboardService';
import { ActivityService } from '@/services/ActivityService';
import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getDashboardMetrics() {
    const { userId, organizationId } = await requireSessionContext();
    return await DashboardService.getDashboardMetrics(userId, organizationId);
}

export async function getDashboardDeals() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('deals')
        .select('id, title, company, stage, value, probability, expected_close_date, won_at, created_at, owner_id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
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
