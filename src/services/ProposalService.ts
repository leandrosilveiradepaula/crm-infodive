import { createAdminClient } from '@/lib/supabase/admin';

export class ProposalService {
    static async fetchProposals(userId: string, dealId: string, organizationId: string) {
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

        return data.map((p: any) => ({
            ...p,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            dealId: p.deal_id,
            content: p.content || p.content_json,
        }));
    }

    static async updateProposal(userId: string, proposalId: string, organizationId: string, updates: Partial<{
        status: string;
        sent_at: string;
        sentAt: string;
        viewed_at: string;
        viewedAt: string;
        signed_at: string;
        signedAt: string;
        public_token: string;
        allow_signature: boolean;
    }>) {
        const supabase = createAdminClient();
        const dbUpdates: any = {};

        if (updates.status) dbUpdates.status = updates.status;
        if (updates.public_token) dbUpdates.public_token = updates.public_token;
        if (updates.allow_signature !== undefined) dbUpdates.allow_signature = updates.allow_signature;

        if (updates.sent_at || updates.sentAt) {
            dbUpdates.sent_at = updates.sent_at || updates.sentAt;
        }
        if (updates.viewed_at || updates.viewedAt) {
            dbUpdates.viewed_at = updates.viewed_at || updates.viewedAt;
        }
        if (updates.signed_at || updates.signedAt) {
            dbUpdates.signed_at = updates.signed_at || updates.signedAt;
        }

        const { data, error } = await supabase
            .from('proposals')
            .update(dbUpdates)
            .eq('id', proposalId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw new Error(`Database error: ${error.message}`);

        return {
            ...data,
            content: data.content || data.content_json
        };
    }

    static async deleteProposal(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error(error.message);
        return true;
    }

    static async createProposal(userId: string, organizationId: string, payload: any) {
        const supabase = createAdminClient();
        // ... (truncated in my head, but I'll update the rest)
        const insertData: any = { ...payload, organization_id: organizationId };

        insertData.created_by = userId;

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
            if (error.message.includes('column')) {
                throw new Error(`Erro de esquema no Banco de Dados: ${error.message}. Por favor, contate o suporte.`);
            }
            throw new Error(error.message);
        }

        return data;
    }
}
