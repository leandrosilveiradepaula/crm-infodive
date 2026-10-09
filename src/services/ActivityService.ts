import { createAdminClient } from '../lib/supabase/admin';
import { Activity } from '../types/activity';
import { normalizeCasing } from '../lib/string-utils';

export class ActivityService {
    private static async assertRelatedRecords(
        supabase: ReturnType<typeof createAdminClient>,
        organizationId: string,
        dealId?: string | null,
        accountId?: string | null,
    ) {
        for (const relation of [
            { table: 'deals', id: dealId },
            { table: 'accounts', id: accountId },
        ]) {
            if (relation.id === undefined || relation.id === null) continue;
            if (typeof relation.id !== 'string' || !relation.id.trim()) throw new Error('Referência de atividade inválida.');
            const { data, error } = await supabase
                .from(relation.table)
                .select('id')
                .eq('id', relation.id)
                .eq('organization_id', organizationId)
                .maybeSingle();
            if (error || !data) throw new Error('Referência de atividade não encontrada nesta organização.');
        }
    }

    static async getActivities(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data: activitiesData, error } = await supabase
            .from('activities')
            .select('*')
            .eq('organization_id', organizationId)
            .order('dueDate', { ascending: true, nullsFirst: false });

        if (error || !activitiesData) {
            console.error('[ActivityService] activities fetch failed');
            throw new Error('Não foi possível carregar as atividades.');
        }

        const dealIds = (activitiesData || []).map((a) => a.deal_id).filter(Boolean);

        let dealsMap: Record<string, string> = {};
        if (dealIds.length > 0) {
            const { data: dealsData, error: dealsError } = await supabase
                .from('deals')
                .select('id, title')
                .in('id', dealIds)
                .eq('organization_id', organizationId);

            if (dealsError) throw new Error('Não foi possível carregar os vínculos das oportunidades.');
            if (dealsData) {
                dealsMap = dealsData.reduce((acc: Record<string, string>, deal) => {
                    acc[deal.id] = deal.title;
                    return acc;
                }, {});
            }
        }

        const accountIds = activitiesData.map((a) => a.account_id).filter(Boolean);

        let accountsMap: Record<string, string> = {};
        if (accountIds.length > 0) {
            const { data: accountsData, error: accountsError } = await supabase
                .from('accounts')
                .select('id, name')
                .in('id', accountIds)
                .eq('organization_id', organizationId);

            if (accountsError) throw new Error('Não foi possível carregar os vínculos dos clientes.');
            if (accountsData) {
                accountsMap = accountsData.reduce((acc: Record<string, string>, account) => {
                    acc[account.id] = account.name;
                    return acc;
                }, {});
            }
        }

        return (activitiesData || []).map((item) => ({
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
            console.error('[ActivityService] tasks fetch failed');
            throw new Error('Não foi possível carregar as tarefas próximas.');
        }

        if (!data) throw new Error('Não foi possível carregar as tarefas próximas.');

        return data.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate, // Already camelCase in DB response if quoted col
            priority: t.priority,
            status: t.status // 'pending', 'in_progress' etc
        }));
    }

    static async createActivity(userId: string, organizationId: string, activity: Partial<Activity>) {
        const supabase = createAdminClient();
        if (typeof activity.title !== 'string' || !activity.title.trim() || activity.title.length > 250) {
            throw new Error('Título de atividade inválido.');
        }
        await this.assertRelatedRecords(supabase, organizationId, activity.dealId, activity.customerId);

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

        if (error || !data) throw new Error('Não foi possível salvar a atividade.');
        return data;
    }

    static async updateActivity(userId: string, id: string, organizationId: string, updates: Partial<Activity>) {
        const supabase = createAdminClient();
        if (updates.title !== undefined &&
            (typeof updates.title !== 'string' || !updates.title.trim() || updates.title.length > 250)) {
            throw new Error('Título de atividade inválido.');
        }
        await this.assertRelatedRecords(supabase, organizationId, updates.dealId, updates.customerId);

        const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        if (updates.title !== undefined) dbUpdates.title = normalizeCasing(updates.title, 'name');
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.dealId !== undefined) dbUpdates.deal_id = updates.dealId || null;
        if (updates.customerId !== undefined) dbUpdates.account_id = updates.customerId || null;
        if (updates.dueDate !== undefined) dbUpdates["dueDate"] = updates.dueDate;
        if (updates.dueTime !== undefined) dbUpdates["dueTime"] = updates.dueTime;
        if (updates.assignedTo !== undefined) dbUpdates["assignedTo"] = updates.assignedTo;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

        const { data: updated, error } = await supabase
            .from('activities')
            .update(dbUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (error || !updated) throw new Error('Não foi possível atualizar a atividade.');
        return true;
    }

    static async deleteActivity(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data: deleted, error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (error || !deleted) throw new Error('Não foi possível excluir a atividade.');
        return true;
    }

    static async getDealsDropdown(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('deals')
            .select('id, title, company')
            .eq('organization_id', organizationId)
            .order('title');

        if (error) throw new Error('Não foi possível carregar as atividades.');
        return data || [];
    }

    static async getAccountsDropdown(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) throw new Error('Não foi possível carregar as atividades.');
        return data || [];
    }
}
