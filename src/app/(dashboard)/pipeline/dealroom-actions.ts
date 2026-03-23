'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

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
    const { organizationId } = await requireSessionContext();
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
    } catch (error: any) {
        console.error('Error in getOrCreateDealRoom:', error);
        return { success: false, error: error.message };
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
            console.error('❌ RPC Error (Admin) fetching room:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }

        console.log('✅ RPC Success (Admin) for token:', token.substring(0, 8) + '...');
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Critical Error in fetchPublicRoomData:', error);
        return { success: false, error: error.message || 'Erro interno ao recuperar dados da sala' };
    }
}
