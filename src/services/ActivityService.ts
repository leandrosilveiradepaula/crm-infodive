import { createAdminClient } from '@/lib/supabase/admin';
import { Activity } from '@/types/activity';
import { normalizeCasing } from '@/lib/string-utils';

export class ActivityService {
    static async getActivities(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data: activitiesData, error } = await supabase
            .from('activities')
            .select('*')
            .eq('organization_id', organizationId)
            .order('"dueDate"', { ascending: true });

        if (error) {
            console.error('Error fetching activities:', error);
            return [];
        }

        const dealIds = activitiesData.map((a: any) => a.deal_id).filter((id: any) => id);

        let dealsMap: Record<string, string> = {};
        if (dealIds.length > 0) {
            const { data: dealsData } = await supabase
                .from('deals')
                .select('id, title')
                .in('id', dealIds)
                .eq('organization_id', organizationId);

            if (dealsData) {
                dealsMap = dealsData.reduce((acc: any, deal: any) => {
                    acc[deal.id] = deal.title;
                    return acc;
                }, {});
            }
        }

        const accountIds = activitiesData.map((a: any) => a.account_id).filter((id: any) => id);

        let accountsMap: Record<string, string> = {};
        if (accountIds.length > 0) {
            const { data: accountsData } = await supabase
                .from('accounts')
                .select('id, name')
                .in('id', accountIds)
                .eq('organization_id', organizationId);

            if (accountsData) {
                accountsMap = accountsData.reduce((acc: any, account: any) => {
                    acc[account.id] = account.name;
                    return acc;
                }, {});
            }
        }

        return activitiesData.map((item: any) => ({
            ...item,
            dueDate: item.dueDate,
            dueTime: item.dueTime,
            assignedTo: item.assignedTo,
            dealId: item.deal_id,
            customerId: item.account_id,
            dealTitle: dealsMap[item.deal_id] || undefined,
            customerName: accountsMap[item.account_id] || undefined
        })) as Activity[];
    }

    static async getUpcomingTasks(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('organization_id', organizationId)
            .neq('status', 'completed')
            .order('dueDate', { ascending: true, nullsFirst: false })
            .limit(10);

        if (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }

        if (!data) return [];

        return data.map((t: any) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate, // Already camelCase in DB response if quoted col
            priority: t.priority,
            status: t.status // 'pending', 'in_progress' etc
        }));
    }

    static async createActivity(userId: string, organizationId: string, activity: Partial<Activity>) {
        const supabase = createAdminClient();

        const dbPayload = {
            title: normalizeCasing(activity.title, 'name'),
            description: activity.description,
            type: activity.type,
            status: activity.status || 'pending',
            priority: activity.priority || 'medium',
            deal_id: activity.dealId || null,
            account_id: activity.customerId || null,
            "dueDate": activity.dueDate,
            "dueTime": activity.dueTime,
            "assignedTo": activity.assignedTo,
            organization_id: organizationId,
            source: activity.source || 'manual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('activities')
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async updateActivity(userId: string, id: string, organizationId: string, updates: Partial<Activity>) {
        const supabase = createAdminClient();

        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.title !== undefined) dbUpdates.title = normalizeCasing(updates.title, 'name');
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.dealId !== undefined) dbUpdates.deal_id = updates.dealId;
        if (updates.customerId !== undefined) dbUpdates.account_id = updates.customerId;
        if (updates.dueDate !== undefined) dbUpdates["dueDate"] = updates.dueDate;
        if (updates.dueTime !== undefined) dbUpdates["dueTime"] = updates.dueTime;
        if (updates.assignedTo !== undefined) dbUpdates["assignedTo"] = updates.assignedTo;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

        const { error } = await supabase
            .from('activities')
            .update(dbUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error(error.message);
        return true;
    }

    static async deleteActivity(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error(error.message);
        return true;
    }

    static async getDealsDropdown(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('deals')
            .select('id, title, company')
            .eq('organization_id', organizationId)
            .order('title');

        if (error) throw error;
        return data || [];
    }

    static async getAccountsDropdown(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) throw error;
        return data || [];
    }
}
