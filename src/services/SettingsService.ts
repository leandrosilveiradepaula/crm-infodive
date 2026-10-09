import { createAdminClient } from '../lib/supabase/admin';

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

        if (error) throw new Error('Não foi possível carregar as configurações da organização.');
        if (!data) return { name: '', support_email: '' };
        const value = data.value;
        if (!value || typeof value !== 'object' || Array.isArray(value) ||
            (value.name !== undefined && typeof value.name !== 'string') ||
            (value.support_email !== undefined && typeof value.support_email !== 'string')) {
            throw new Error('Configurações da organização inválidas.');
        }
        return { ...value, name: value.name || '', support_email: value.support_email || '' } as OrgSettings;
    }

    static async saveOrgSettings(organizationId: string, settings: OrgSettings) {
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
            return { success: false, error: 'Configurações da organização inválidas.' };
        }
        const allowed = new Set([
            'name', 'support_email', 'cnpj', 'ie', 'street', 'number', 'complement',
            'neighborhood', 'city', 'state', 'zip', 'logo_url',
            'primary_color', 'secondary_color',
        ]);
        const value: Record<string, string> = {};
        for (const [key, field] of Object.entries(settings)) {
            if (!allowed.has(key)) continue;
            if (typeof field !== 'string' || field.length > 4000 ||
                (key === 'name' && !field.trim())) {
                return { success: false, error: 'Configurações da organização inválidas.' };
            }
            value[key] = field;
        }
        if (!Object.keys(value).length) {
            return { success: false, error: 'Nenhuma configuração permitida.' };
        }
        const supabase = createAdminClient();
        const { data: persisted, error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'organization',
                value,
                organization_id: organizationId,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organization_id,key' })
            .select('key')
            .maybeSingle();
        if (error || !persisted) {
            return { success: false, error: 'Não foi possível salvar as configurações da organização.' };
        }
        return { success: true };
    }

    static async getPipelineStages(organizationId: string): Promise<PipelineStage[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('pipeline_stages')
            .select('*')
            .eq('organization_id', organizationId)
            .order('order_index');

        if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar as etapas do pipeline.');
        if (data.length === 0) return DEFAULT_STAGES;
        return data as PipelineStage[];
    }

    static async savePipelineStages(organizationId: string, stages: PipelineStage[]) {
        if (!Array.isArray(stages) || stages.length === 0 || stages.length > 30 ||
            stages.some(s => !s || typeof s.id !== 'string' || !s.id.trim() ||
                typeof s.name !== 'string' || !s.name.trim() || s.name.length > 100 ||
                typeof s.color !== 'string' || !s.color.trim() || s.color.length > 80) ||
            new Set(stages.map(s => s.id)).size !== stages.length) {
            return { success: false, error: 'Etapas de pipeline inválidas.' };
        }

        const supabase = createAdminClient();

        // 1. Encontrar estágios atuais para saber quais deletar
        const { data: existingData, error: existingError } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('organization_id', organizationId);

        if (existingError || !Array.isArray(existingData)) {
            return { success: false, error: 'Não foi possível consultar as etapas existentes.' };
        }
        const existingIds = existingData.map(r => r.id);
        const currentIds = stages.map(s => s.id);
        const toDeleteIds = existingIds.filter(id => !currentIds.includes(id));

        // 2. Tentar deletar os que foram removidos
        if (toDeleteIds.length > 0) {
            const { data: deleted, error: deleteError } = await supabase
                .from('pipeline_stages')
                .delete()
                .eq('organization_id', organizationId)
                .in('id', toDeleteIds)
                .select('id');

            if (deleteError || !Array.isArray(deleted) || deleted.length !== toDeleteIds.length) {
                return { 
                    success: false, 
                    error: 'Não foi possível remover algumas etapas pois elas já possuem negócios vinculados.'
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

        const { data: upserted, error: upsertError } = await supabase
            .from('pipeline_stages').upsert(toUpsert).select('id');

        if (upsertError || !Array.isArray(upserted) || upserted.length !== toUpsert.length) {
            return { success: false, error: 'Não foi possível salvar as etapas do pipeline.' };
        }
        return { success: true };
    }
}
