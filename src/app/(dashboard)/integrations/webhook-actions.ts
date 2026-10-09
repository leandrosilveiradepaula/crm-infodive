'use server';

import { createAdminClient } from '../../../lib/supabase/admin';
import { Webhook } from '../../../hooks/useWebhooks';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '../../../lib/auth-server';

function assertWebhookId(id: string): string {
    if (typeof id !== 'string' || !id.trim()) {
        throw new Error('Webhook inválido.');
    }
    return id.trim();
}

function normalizeWebhook(
    webhook: Omit<Webhook, 'id' | 'created_at' | 'last_triggered'>
): Pick<Webhook, 'url' | 'events' | 'status'> {
    if (
        !webhook ||
        typeof webhook.url !== 'string' ||
        !webhook.url.trim() ||
        webhook.url.trim().length > 2048 ||
        !Array.isArray(webhook.events) ||
        webhook.events.length === 0 ||
        webhook.events.length > 50 ||
        webhook.events.some(event => typeof event !== 'string' || !event.trim() || event.trim().length > 120) ||
        !['active', 'inactive', 'error'].includes(webhook.status)
    ) {
        throw new Error('Configuração de webhook inválida.');
    }

    return {
        url: webhook.url.trim(),
        events: webhook.events.map(event => event.trim()),
        status: webhook.status,
    };
}

export async function getWebhooks() {
    const { organizationId } = await requirePermission('integrations:manage');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) {
        console.error('[WebhookActions] webhook fetch failed');
        throw new Error('Não foi possível carregar os webhooks.');
    }
    return data;
}

export async function createWebhook(webhook: Omit<Webhook, 'id' | 'created_at' | 'last_triggered'>) {
    const { organizationId } = await requirePermission('integrations:manage');
    const normalized = normalizeWebhook(webhook);
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks')
        .insert([{ ...normalized, organization_id: organizationId }])
        .select('*')
        .maybeSingle();

    if (error || !data) {
        console.error('[WebhookActions] webhook creation failed');
        throw new Error('Não foi possível criar o webhook.');
    }
    revalidatePath('/integrations');
    return data;
}

export async function removeWebhook(id: string) {
    const { organizationId } = await requirePermission('integrations:manage');
    const webhookId = assertWebhookId(id);
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('organization_id', organizationId)
        .select('id')
        .maybeSingle();

    if (error || !data) {
        console.error('[WebhookActions] webhook deletion failed');
        throw new Error('Não foi possível excluir o webhook.');
    }
    revalidatePath('/integrations');
    return true;
}
