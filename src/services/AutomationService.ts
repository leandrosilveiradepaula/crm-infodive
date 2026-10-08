import { createAdminClient } from '@/lib/supabase/admin';
import { type Automation, type AutomationExecution, type EmailTemplate } from '@/types/automation';
import { sanitizeAutomationWrite, assertSupportedAutomation } from './automationMutationPolicy';

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
            throw new Error('Não foi possível carregar as automações.');
        }

        return (data || []).map((item) => ({
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
            const fields = sanitizeAutomationWrite(automation);
            assertSupportedAutomation({ trigger: fields.trigger!, conditions: fields.conditions || [], actions: fields.actions || [] });
            const { data, error } = await supabase
                .from('automations')
                .insert([{
                    ...fields,
                    enabled: fields.enabled === true,
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
            if (typeof enabled !== 'boolean') throw new Error('Invalid enablement');
            if (enabled) {
                const { data: current, error: readError } = await supabase
                    .from('automations')
                    .select('trigger, conditions, actions')
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .maybeSingle();
                if (readError || !current) throw new Error('Automation missing');
                assertSupportedAutomation({
                    trigger: current.trigger,
                    conditions: current.conditions || [],
                    actions: current.actions || [],
                });
            }
            const { data: updated, error } = await supabase
                .from('automations')
                .update({
                    enabled,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle();

            if (error || !updated) throw new Error('Automation not updated');
            return { success: true };
        } catch {
            return { success: false, error: 'Não foi possível atualizar a automação.' };
        }
    }

    static async updateAutomation(userId: string, id: string, organizationId: string, automation: Partial<Automation>) {
        const supabase = createAdminClient();

        try {
            const fields = sanitizeAutomationWrite(automation);
            const { data: current, error: readError } = await supabase
                .from('automations')
                .select('trigger, conditions, actions, enabled')
                .eq('id', id)
                .eq('organization_id', organizationId)
                .maybeSingle();
            if (readError || !current) throw new Error('Automation missing');
            const merged = {
                trigger: fields.trigger ?? current.trigger,
                conditions: fields.conditions ?? current.conditions ?? [],
                actions: fields.actions ?? current.actions ?? [],
            };
            if (fields.enabled === true || (current.enabled && fields.enabled !== false)) assertSupportedAutomation(merged);
            const { data: updated, error } = await supabase
                .from('automations')
                .update({
                    ...fields,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle();

            if (error || !updated) throw new Error('Automation not updated');
            return { success: true };
        } catch {
            console.error('[AutomationService] automation update failed');
            return { success: false, error: 'Não foi possível atualizar a automação.' };
        }
    }

    static async deleteAutomation(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        try {
            const { data: deleted, error } = await supabase
                .from('automations')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle();

            if (error || !deleted) throw new Error('Automation not deleted');
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

        if (error) throw new Error('Não foi possível carregar os modelos de email.');
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
            throw new Error('Não foi possível carregar o histórico de execuções.');
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
