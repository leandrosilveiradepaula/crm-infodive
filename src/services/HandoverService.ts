import { createAdminClient } from '@/lib/supabase/admin';
import { Handover } from '@/hooks/useHandover';

export class HandoverService {
    static async getHandover(userId: string, dealId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('project_handovers')
            .select(`
                *,
                deal:deals!project_handovers_deal_id_fkey(title, organization_id, customer:accounts!deals_account_id_fkey(name))
            `)
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Handover | null;
    }

    static async createHandover(userId: string, organizationId: string, handover: Partial<Handover>) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('project_handovers')
            .insert([{
                deal_id: handover.deal_id,
                technical_lead_id: handover.technical_lead_id,
                organization_id: organizationId,
                status: handover.status || 'pending',
                checklist_data: handover.checklist_data || {}
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Handover;
    }

    static async updateHandover(userId: string, id: string, organizationId: string, updates: Partial<Handover>) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('project_handovers')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return data as Handover;
    }
}
