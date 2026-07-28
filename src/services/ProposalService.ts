import { createAdminClient } from '@/lib/supabase/admin';
import type { Proposal } from '@/types/proposal';

export class ProposalService {
    static async fetchProposals(userId: string, dealId: string, organizationId: string): Promise<Proposal[]> {
        const supabase = createAdminClient();

        // 2. Fetch proposals strictly within the user's organization
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching proposals:', error);
            return [];
        }

        return (data || []).map((p: any) => ({
            ...p,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            dealId: p.deal_id,
            content: p.content || p.content_json,
        })) as Proposal[];
    }

    static async updateProposal(userId: string, proposalId: string, organizationId: string, updates: Partial<Proposal>): Promise<Proposal> {
        const supabase = createAdminClient();
        const dbUpdates: any = {};

        if (updates.status) dbUpdates.status = updates.status;
        if (updates.public_token) dbUpdates.public_token = updates.public_token;
        if (updates.allow_signature !== undefined) dbUpdates.allow_signature = updates.allow_signature;

        if (updates.sentAt) {
            dbUpdates.sent_at = updates.sentAt;
        }
        if (updates.viewedAt) {
            dbUpdates.viewed_at = updates.viewedAt;
        }
        if (updates.signedAt) {
            dbUpdates.signed_at = updates.signedAt;
        }

        const { data, error } = await supabase
            .from('proposals')
            .update(dbUpdates)
            .eq('id', proposalId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw new Error('Não foi possível atualizar a proposta.');

        return {
            ...data,
            content: data.content || data.content_json,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            dealId: data.deal_id
        } as Proposal;
    }

    static async deleteProposal(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error('Não foi possível excluir a proposta.');
        return true;
    }

    static async createProposal(userId: string, organizationId: string, payload: Partial<Proposal>): Promise<Proposal> {
        const supabase = createAdminClient();
        
        // Map frontend camelCase to snake_case database columns
        const insertData: any = {
            organization_id: organizationId,
            created_by: userId,
            title: payload.title,
            status: payload.status,
            number: payload.number,
            deal_id: payload.dealId || payload.deal_id,
            account_id: payload.accountId,
            lead_id: payload.leadId,
            customer_id: payload.customerId,
            company_name: (payload as any).company_name || payload.customerName,
            template_id: (payload as any).template_id || payload.template,
            content_json: (payload as any).content_json || payload.content,
            products_json: (payload as any).products_json || payload.products,
            terms: payload.terms,
            subtotal: payload.subtotal,
            discount: payload.discount,
            total: payload.total,
            valid_until: payload.validUntil,
            public_token: payload.public_token,
            allow_signature: payload.allow_signature
        };

        // Auto-increment version for the deal
        if (insertData.deal_id) {
            const { data: latestProposal } = await supabase
                .from('proposals')
                .select('version')
                .eq('deal_id', insertData.deal_id)
                .eq('organization_id', organizationId)
                .order('version', { ascending: false })
                .limit(1)
                .maybeSingle();

            insertData.version = (latestProposal?.version || 0) + 1;
        } else {
            insertData.version = 1;
        }

        // Auto-generate proposal number if not provided
        if (!insertData.number && insertData.organization_id) {
            const { data: numData, error: numError } = await supabase
                .rpc('get_next_proposal_number', { p_organization_id: insertData.organization_id });
            if (!numError && numData) {
                insertData.number = numData;
            }
        }

        const { data, error } = await supabase
            .from('proposals')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('Error creating proposal:', error);
            throw new Error('Não foi possível criar a proposta.');
        }

        return {
            ...data,
            content: data.content || data.content_json,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            dealId: data.deal_id
        } as Proposal;
    }
}
