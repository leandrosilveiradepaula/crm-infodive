import { randomUUID } from 'node:crypto';
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
        // The value is replaced as a whole by upsert: require the complete
        // minimum organization identity to avoid silently erasing saved fields.
        if (!value.name?.trim() || typeof value.support_email !== 'string') {
            return { success: false, error: 'Configurações da organização incompletas.' };
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

    // One stable database snapshot avoids publishing a stale UI revision.
    static async getPipelineStageSnapshot(userId: string, organizationId: string):
        Promise<{ revision: number; stages: PipelineStage[] }> {
        if (!this.isUuid(userId) || !this.isUuid(organizationId)) {
            throw new Error('Não foi possível identificar a organização.');
        }
        const { data, error } = await createAdminClient().rpc('get_pipeline_stage_snapshot_atomic', {
            p_actor_id: userId,
            p_org_id: organizationId,
        });
        if (error || !Array.isArray(data) || data.length !== 1 ||
            !Number.isSafeInteger(data[0]?.revision) || data[0].revision < 0 ||
            !Array.isArray(data[0]?.stages) ||
            data[0].stages.some((stage: unknown) => !this.isPipelineStage(stage))) {
            throw new Error('Não foi possível verificar a versão das etapas do pipeline.');
        }
        return {
            revision: data[0].revision as number,
            stages: data[0].stages.length ? data[0].stages as PipelineStage[] : DEFAULT_STAGES,
        };
    }

    private static isPipelineStage(value: unknown): value is PipelineStage {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const stage = value as PipelineStage;
        return this.isUuid(stage.id) &&
            typeof stage.name === 'string' && !!stage.name.trim() && stage.name.length <= 100 &&
            typeof stage.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(stage.color) &&
            Number.isSafeInteger(stage.order_index) && stage.order_index >= 0;
    }

    private static isUuid(value: unknown): value is string {
        return typeof value === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }

    static async savePipelineStages(
        organizationId: string,
        stages: PipelineStage[],
        expectedRevision?: number | null,
        userId?: string,
    ) {
        if (!this.isUuid(userId) || !this.isUuid(organizationId) ||
            !Number.isSafeInteger(expectedRevision) || (expectedRevision ?? -1) < 0 ||
            !Array.isArray(stages) || stages.length === 0 || stages.length > 30 ||
            stages.some(stage => !stage || typeof stage.id !== 'string' ||
                typeof stage.name !== 'string' || !stage.name.trim() ||
                stage.name.length > 100 ||
                typeof stage.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(stage.color)) ||
            new Set(stages.map(s => s.id)).size !== stages.length ||
            new Set(stages.map(s => s.name.trim().toLocaleLowerCase('pt-BR'))).size !== stages.length) {
            return { success: false, error: 'Etapas inválidas ou revisão ausente. Recarregue a tela.' };
        }

        // The default-stage IDs are presentation-only. All persisted IDs are UUID.
        const defaultIds = new Set(DEFAULT_STAGES.map(stage => stage.id));
        if (stages.some(stage => !defaultIds.has(stage.id) && !this.isUuid(stage.id))) {
            return { success: false, error: 'Identificador de etapa inválido. Recarregue a tela.' };
        }
        const prepared = stages.map(stage => ({
            id: defaultIds.has(stage.id) ? randomUUID() : stage.id,
            name: stage.name.trim(),
            color: stage.color,
        }));
        try {
            const { data, error } = await createAdminClient().rpc('replace_pipeline_stages_atomic', {
                p_actor_id: userId,
                p_org_id: organizationId,
                p_expected_revision: expectedRevision,
                p_stages: prepared,
            });
            if (error?.code === '40001') {
                return {
                    success: false, conflict: true,
                    error: 'As etapas foram alteradas em outra sessão. Recarregue antes de salvar.',
                };
            }
            if (error?.code === '23503') {
                return {
                    success: false,
                    error: 'Não é possível remover ou renomear etapas com negócios existentes. Preserve o histórico.',
                };
            }
            if (error || !Array.isArray(data) || data.length !== 1 ||
                !Number.isSafeInteger(data[0]?.revision) ||
                data[0].revision !== (expectedRevision as number) + 1) {
                return { success: false, error: 'O banco não confirmou a gravação das etapas.' };
            }
            return { success: true, revision: data[0].revision as number };
        } catch {
            return { success: false, error: 'Não foi possível salvar as etapas do pipeline.' };
        }
    }
}
