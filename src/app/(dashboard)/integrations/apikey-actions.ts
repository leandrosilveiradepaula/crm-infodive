'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

function assertApiKeyId(id: string): string {
    if (typeof id !== 'string' || !id.trim()) {
        throw new Error('Chave de integração inválida.');
    }
    return id.trim();
}

export async function getApiKeys() {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
        console.error('[ApiKeyActions] api key fetch failed');
        throw new Error('Não foi possível carregar as chaves de integração.');
    }
    return data;
}

export async function createApiKey(name: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
        throw new Error('Nome da chave inválido.');
    }

    const supabase = createAdminClient();
    const prefix = `ak_${Math.random().toString(36).substring(2, 8)}`;
    const { data, error } = await supabase
        .from('api_keys')
        .insert([{
            name: name.trim(),
            token_prefix: prefix,
            status: 'active',
            organization_id: organizationId
        }])
        .select('*')
        .maybeSingle();

    if (error || !data) {
        console.error('[ApiKeyActions] api key creation failed');
        throw new Error('Não foi possível criar a chave de integração.');
    }
    revalidatePath('/integrations');
    return data;
}

export async function revokeApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const keyId = assertApiKeyId(id);
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId)
        .eq('organization_id', organizationId)
        .select('id')
        .maybeSingle();

    if (error || !data) {
        console.error('[ApiKeyActions] api key revocation failed');
        throw new Error('Não foi possível revogar a chave de integração.');
    }
    revalidatePath('/integrations');
    return true;
}

export async function removeApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const keyId = assertApiKeyId(id);
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('organization_id', organizationId)
        .select('id')
        .maybeSingle();

    if (error || !data) {
        console.error('[ApiKeyActions] api key deletion failed');
        throw new Error('Não foi possível excluir a chave de integração.');
    }
    revalidatePath('/integrations');
    return true;
}
