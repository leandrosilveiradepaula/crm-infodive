import { createAdminClient } from '@/lib/supabase/admin';
import { type Automation, type AutomationExecution, type EmailTemplate } from '@/types/automation';

export class AutomationService {
    static async getAutomations(userId: string, organizationId: string): Promise<Automation[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('automations')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[AutomationService] automations fetch failed');
            return [];
        }

        return data.map((item: any) => ({
            ...item,
            enabled: Boolean(item.enabled),
            trigger: item.trigger || { type: 'deal_created', config: {} },
            conditions: item.conditions || [],
            actions: item.actions || [],
            executionCount: item.execution_count || 0,
            successCount: item.success_count || 0,
            failureCount: item.failure_count || 0
        }));
    }

    static async createAutomation(userId: string, organizationId: string, automation: Partial<Automation>) {
        const supabase = createAdminClient();

        try {
            const { data, error } = await supabase
                .from('automations')
                .insert([{
                    ...automation,
                    organization_id: organizationId,
                    execution_count: 0,
                    success_count: 0,
                    failure_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch {
            console.error('[AutomationService] automation creation failed');
            return { success: false, error: 'Não foi possível salvar a automação.' };
        }
    }

    static async toggleAutomation(userId: string, id: string, organizationId: string, enabled: boolean) {
        const supabase = createAdminClient();

        try {
            const { error } = await supabase
                .from('automations')
                .update({
                    enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;
            return { success: true };
        } catch {
            return { success: false, error: 'Não foi possível atualizar a automação.' };
        }
    }

    static async updateAutomation(userId: string, id: string, organizationId: string, automation: Partial<Automation>) {
        const supabase = createAdminClient();

        try {
            const { error } = await supabase
                .from('automations')
                .update({
                    ...automation,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;
            return { success: true };
        } catch {
            console.error('[AutomationService] automation update failed');
            return { success: false, error: 'Não foi possível atualizar a automação.' };
        }
    }

    static async deleteAutomation(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        try {
            const { error } = await supabase
                .from('automations')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;
            return { success: true };
        } catch {
            console.error('[AutomationService] automation deletion failed');
            return { success: false, error: 'Não foi possível excluir a automação.' };
        }
    }

    static async getTemplates(userId: string, organizationId: string): Promise<EmailTemplate[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) return [];
        return data || [];
    }

    static async getExecutionHistory(automationId: string, organizationId: string): Promise<AutomationExecution[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('automation_executions')
            .select('id, automation_id, started_at, completed_at, status, event_type, actions, error')
            .eq('organization_id', organizationId)
            .eq('automation_id', automationId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[AutomationService] execution history fetch failed');
            return [];
        }

        type AutomationExecutionRow = {
            id: string;
            automation_id: string;
            started_at: string;
            completed_at: string | null;
            status: 'running' | 'success' | 'failed' | 'skipped';
            event_type: string;
            actions: unknown;
            error: string | null;
        };

        return ((data || []) as AutomationExecutionRow[]).map((item) => ({
            id: String(item.id),
            automationId: String(item.automation_id),
            executedAt: String(item.completed_at || item.started_at),
            status: item.status,
            trigger: String(item.event_type),
            actions: Array.isArray(item.actions) ? item.actions.map((action: unknown) => String(action)) : [],
            error: item.error ? String(item.error) : undefined,
        }));
    }

}
