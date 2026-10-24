'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { type Integration, type ApiKey, type Webhook } from '@/types/integration';

export async function getIntegrations(): Promise<Integration[]> {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('integrations').select('*')
        .eq('organization_id', organizationId)
        .order('name');

    if (error || !Array.isArray(data)) {
        console.error('[IntegrationsActions] integrations fetch failed');
        throw new Error('Não foi possível carregar as integrações.');
    }
    return data.map((item: { id: string; name: string; provider: string; status: Integration['status']; config_json: unknown; last_sync: string | null }) => ({
        id: item.id, name: item.name, provider: item.provider,
        status: item.status, configJson: item.config_json, lastSync: item.last_sync
    }));
}

export async function toggleIntegrationStatus(id: string, currentStatus: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    if (typeof id !== 'string' || !id.trim() || !['connected', 'disconnected', 'error'].includes(currentStatus)) {
        return { success: false, error: 'Integração inválida.' };
    }
    const supabase = createAdminClient();
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    try {
        const { data: updated, error } = await supabase
            .from('integrations')
            .update({ status: newStatus })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !updated) throw error || new Error('No integration row updated');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

export async function getApiKeys(): Promise<ApiKey[]> {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar as chaves de integração.');
    return data as ApiKey[];
}

export async function createApiKey(name: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    if (typeof name !== 'string' || !name.trim() || name.length > 120) {
        return { success: false, error: 'Nome da chave inválido.' };
    }
    const supabase = createAdminClient();
    const tokenPrefix = 'sk_' + Math.random().toString(36).substring(7);
    try {
        const { data: inserted, error } = await supabase.from('api_keys').insert([{
            name: name.trim(), token_prefix: tokenPrefix, status: 'active',
            organization_id: organizationId, created_at: new Date().toISOString()
        }]).select('id').maybeSingle();
        if (error || !inserted) throw error || new Error('No API key row inserted');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

export async function revokeApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    try {
        const { data: updated, error } = await supabase
            .from('api_keys')
            .update({ status: 'revoked' })
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !updated) throw error || new Error('No API key row revoked');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

export async function deleteApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    try {
        const { data: deleted, error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !deleted) throw error || new Error('No API key row deleted');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

export async function getWebhooks(): Promise<Webhook[]> {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar os webhooks.');
    return data as Webhook[];
}

export async function createWebhook(data: { url: string; events: string[]; status: string }) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    try {
        const { data: inserted, error } = await supabase.from('webhooks').insert([{
            ...data, organization_id: organizationId, created_at: new Date().toISOString()
        }]).select('id').maybeSingle();
        if (error || !inserted) throw error || new Error('No webhook row inserted');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

export async function deleteWebhook(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    try {
        const { data: deleted, error } = await supabase
            .from('webhooks')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !deleted) throw error || new Error('No webhook row deleted');
        revalidatePath('/integrations');
        return { success: true };
    } catch { return { success: false, error: 'Não foi possível processar a integração.' }; }
}

