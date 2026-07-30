'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { type Integration, type ApiKey, type Webhook } from '@/types/integration';

export async function getIntegrations(): Promise<Integration[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('integrations').select('*')
        .eq('organization_id', organizationId)
        .order('name');

    if (error) { console.error('[IntegrationsActions] integrations fetch failed'); return []; }
    return data.map((item: any) => ({
        id: item.id, name: item.name, provider: item.provider,
        status: item.status, configJson: item.config_json, lastSync: item.last_sync
    }));
}

export async function toggleIntegrationStatus(id: string, currentStatus: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    try {
        const { error } = await supabase
            .from('integrations')
            .update({ status: newStatus })
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getApiKeys(): Promise<ApiKey[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data as ApiKey[];
}

export async function createApiKey(name: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const tokenPrefix = 'sk_' + Math.random().toString(36).substring(7);
    try {
        const { error } = await supabase.from('api_keys').insert([{
            name, token_prefix: tokenPrefix, status: 'active',
            organization_id: organizationId, created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function revokeApiKey(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('api_keys')
            .update({ status: 'revoked' })
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteApiKey(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getWebhooks(): Promise<Webhook[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data as Webhook[];
}

export async function createWebhook(data: { url: string; events: string[]; status: string }) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    try {
        const { error } = await supabase.from('webhooks').insert([{
            ...data, organization_id: organizationId, created_at: new Date().toISOString()
        }]);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteWebhook(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    try {
        const { error } = await supabase
            .from('webhooks')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw error;
        revalidatePath('/integrations');
        return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
}

