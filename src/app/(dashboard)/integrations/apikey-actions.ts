'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getApiKeys() {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching api keys:', error);
        return [];
    }
    return data;
}

export async function createApiKey(name: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const prefix = `ak_${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase
        .from('api_keys')
        .insert([{ name, token_prefix: prefix, status: 'active', organization_id: organizationId }])
        .select();

    if (error) throw new Error(error.message);
    revalidatePath('/integrations');
    return data[0];
}

export async function revokeApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
    revalidatePath('/integrations');
    return true;
}

export async function removeApiKey(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
    revalidatePath('/integrations');
    return true;
}

