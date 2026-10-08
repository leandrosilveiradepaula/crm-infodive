'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission, requireSessionContext } from '@/lib/auth-server';

export interface DealRoom {
    id: string;
    deal_id: string;
    access_token: string;
    is_active: boolean;
    theme_color: string;
    last_accessed_at?: string;
    created_at: string;
}

export async function getOrCreateDealRoom(dealId: string) {
    const { organizationId } = await requirePermission('deals:edit');
    const supabase = createAdminClient();

    try {
        const { data: existing } = await supabase
            .from('deal_rooms')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (existing) {
            return { success: true, data: existing };
        }

        const { data: newRoom, error: createError } = await supabase
            .from('deal_rooms')
            .insert([{ deal_id: dealId, organization_id: organizationId }])
            .select()
            .single();

        if (createError) throw createError;
        return { success: true, data: newRoom };
    } catch (error: unknown) {
        const dealRoomError = error as { code?: string; name?: string; message?: string };
        console.error('Deal room creation failed', {
            operation: 'dealroom.get_or_create',
            status: 'failed',
            errorCode: dealRoomError?.code || dealRoomError?.name || 'dealroom_get_or_create_failed',
        });
        return { success: false, error: dealRoomError.message };
    }
}

export async function fetchPublicRoomData(token: string) {
    // We use Admin Client here because this is a public route protected by access_token.
    // Standard anon client might fail due to RLS or session context in Server Actions.
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

        return { success: true, data };
    } catch (error: unknown) {
        const publicRoomError = error as { code?: string; name?: string; message?: string };
        console.error('Public deal room fetch failed', {
            operation: 'dealroom.public.fetch',
            status: 'failed',
            errorCode: publicRoomError?.code || publicRoomError?.name || 'dealroom_public_fetch_failed',
        });
        return { success: false, error: publicRoomError.message || 'Erro interno ao recuperar dados da sala' };
    }
}
