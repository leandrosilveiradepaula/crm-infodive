import { createAdminClient } from '@/lib/supabase/admin';
import { type Automation, type EmailTemplate } from '@/types/automation';

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
            enabled: false,
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
                    enabled: false,
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
        if (enabled) {
            return {
                success: false,
                error: 'A execução automática está bloqueada até o runtime de automações estar disponível.'
            };
        }

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
                    enabled: false,
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
}
