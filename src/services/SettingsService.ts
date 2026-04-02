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

    static async savePipelineStages(organizationId: string, stages: PipelineStage[]) {
        const supabase = createAdminClient();

        // 1. Encontrar estágios atuais para saber quais deletar
        const { data: existingData } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('organization_id', organizationId);

        const existingIds = (existingData || []).map(r => r.id);
        const currentIds = stages.map(s => s.id);
        const toDeleteIds = existingIds.filter(id => !currentIds.includes(id));

        // 2. Tentar deletar os que foram removidos
        if (toDeleteIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('pipeline_stages')
                .delete()
                .in('id', toDeleteIds);
            
            if (deleteError) {
                return { 
                    success: false, 
                    error: `Não foi possível remover algumas etapas pois elas já possuem negócios vinculados. (${deleteError.message})` 
                };
            }
        }

        // 3. Fazer o UPSERT dos estágios que ficaram
        const toUpsert = stages.map((s, idx) => ({
            id: s.id, // O ID deve ser mantido se já existir ou criado se for UUID novo
            name: s.name,
            color: s.color,
            order_index: idx,
            organization_id: organizationId
        }));

        const { error: upsertError } = await supabase.from('pipeline_stages').upsert(toUpsert);
        
        if (upsertError) return { success: false, error: upsertError.message };
        return { success: true };
    }
}
