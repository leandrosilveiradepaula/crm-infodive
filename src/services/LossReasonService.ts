import { createAdminClient } from '@/lib/supabase/admin';

export interface LossReason {
    id: string;
    organization_id: string | null;
    name: string;
    is_active: boolean;
}

export class LossReasonService {
    /**
     * Get all active loss reasons (global and organization-specific)
     */
    static async getActiveLossReasons(organizationId: string): Promise<LossReason[]> {
        const supabase = createAdminClient();
        
        // Fetch both global reasons (org id is null) and tenant-specific reasons
        const { data, error } = await supabase
            .from('loss_reasons')
            .select('*')
            .eq('is_active', true)
            .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
            .order('name');
            
        if (error) {
            console.error('[LossReasonService] loss reasons fetch failed');
            return [];
        }
        
        return data as LossReason[];
    }
}
