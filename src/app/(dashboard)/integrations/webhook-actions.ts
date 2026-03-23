'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { Webhook } from '@/hooks/useWebhooks';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';

export async function getWebhooks() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching webhooks:', error);
        return [];
    }
    return data;
}

export async function createWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'last_triggered'>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks')
        .insert([{ ...webhook, organization_id: organizationId }])
        .select();

    if (error) throw new Error(error.message);
    revalidatePath('/integrations');
    return data[0];
}

export async function removeWebhook(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
    revalidatePath('/integrations');
    return true;
}

