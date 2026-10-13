'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';
import { DealService } from '@/services/DealService';

export interface DealRoom {
    id: string;
    deal_id: string;
    access_token: string;
    is_active: boolean;
    theme_color: string;
    last_accessed_at?: string;
    created_at: string;
}

/**
 * Reuse the canonical owner/tenant guard in DealService. Never duplicate
 * privileged lookups here: they can accidentally disclose access tokens.
 */
export async function getOrCreateDealRoom(dealId: string) {
    const { organizationId, userId } = await requirePermission('deals:edit');
    if (typeof dealId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealId)) {
        return { success: false, error: 'Identificador de oportunidade inválido.' };
    }
    try {
        const result = await DealService.getOrCreateRoom(userId, dealId, organizationId);
        if (!result.room || result.error) {
            return { success: false, error: 'Não foi possível acessar a sala desta oportunidade.' };
        }
        return { success: true, data: result.room };
    } catch {
        return { success: false, error: 'Não foi possível acessar a sala desta oportunidade.' };
    }
}

export async function fetchPublicRoomData(token: string) {
    // Bearer tokens are capabilities, never session credentials. Reject malformed
    // input before any privileged RPC and do not echo tokens into logs.
    if (typeof token !== 'string' || token.length < 16 || token.length > 256 ||
        !/^[A-Za-z0-9_.~-]+$/.test(token)) {
        return { success: false, error: 'Sala não encontrada.' };
    }
    const supabase = createAdminClient();
    try {
        const { data, error } = await supabase.rpc('get_deal_room_by_token', {
            token_input: token
        });

        if (error) {
            console.error('Public deal room fetch failed', {
                operation: 'dealroom.public.fetch',
                provider: 'supabase',
                status: 'failed',
                errorCode: error.code || 'dealroom_public_fetch_failed',
            });
            throw error;
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
            return { success: false, error: 'Sala não encontrada.' };
        }
        return { success: true, data };
    } catch (error: unknown) {
        const publicRoomError = error as { code?: string; name?: string; message?: string };
        console.error('Public deal room fetch failed', {
            operation: 'dealroom.public.fetch',
            status: 'failed',
            errorCode: publicRoomError?.code || publicRoomError?.name || 'dealroom_public_fetch_failed',
        });
        return { success: false, error: 'Não foi possível recuperar dados da sala.' };
    }
}
