import { createAdminClient } from '@/lib/supabase/admin';

export interface PipelineStage {
    id: string;
    name: string;
    color: string;
    order_index: number;
}

const DEFAULT_STAGES: PipelineStage[] = [
    { id: '1', name: 'Lead', color: '#3b82f6', order_index: 0 },
    { id: '2', name: 'Qualificação', color: '#eab308', order_index: 1 },
    { id: '3', name: 'Proposta', color: '#8b5cf6', order_index: 2 },
    { id: '4', name: 'Negociação', color: '#f97316', order_index: 3 },
    { id: '5', name: 'Fechado Ganho', color: '#10b981', order_index: 4 },
];

export interface OrgSettings {
    name: string;
    support_email: string;
    cnpj?: string;
    ie?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
}

export class SettingsService {
    static async getOrgSettings(organizationId: string): Promise<OrgSettings> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'organization')
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error || !data) return { name: '', support_email: '' };
        return data.value as OrgSettings;
    }

    static async saveOrgSettings(organizationId: string, settings: OrgSettings) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'organization',
                value: settings,
                organization_id: organizationId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organization_id,key' });

        if (error) return { success: false, error: error.message };
        return { success: true };
    }

    static async getPipelineStages(organizationId: string): Promise<PipelineStage[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('pipeline_stages')
            .select('*')
            .eq('organization_id', organizationId)
            .order('order_index');

        if (error || !data || data.length === 0) return DEFAULT_STAGES;
        return data as PipelineStage[];
    }

    static async savePipelineStages(organizationId: string, stages: Omit<PipelineStage, 'id' | 'order_index'>[] & { id?: string }[]) {
        const supabase = createAdminClient();

        // Delete all existing and re-insert ordered list
        await supabase
            .from('pipeline_stages')
            .delete()
            .eq('organization_id', organizationId);

        const toInsert = stages.map((s, idx) => ({
            name: s.name,
            color: s.color,
            order_index: idx,
            organization_id: organizationId
        }));

        const { error } = await supabase.from('pipeline_stages').insert(toInsert);
        if (error) return { success: false, error: error.message };
        return { success: true };
    }
}
