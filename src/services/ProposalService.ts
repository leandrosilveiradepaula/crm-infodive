import { createAdminClient } from '../lib/supabase/admin';
import type { Proposal } from '../types/proposal';

export class ProposalService {
    private static readonly proposalStatuses = new Set(['draft', 'sent', 'viewed', 'signed', 'rejected']);

    private static async assertTenantReference(
        supabase: ReturnType<typeof createAdminClient>,
        table: 'accounts' | 'leads',
        id: string,
        organizationId: string,
    ) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Referência da proposta inválida.');
        const { data, error } = await supabase.from(table).select('id')
            .eq('id', id).eq('organization_id', organizationId).maybeSingle();
        if (error || !data) throw new Error('Referência da proposta indisponível nesta organização.');
    }

    private static async assertDealVisible(
        supabase: ReturnType<typeof createAdminClient>,
        userId: string,
        organizationId: string,
        dealId: string,
    ): Promise<void> {
        if (!dealId || typeof dealId !== 'string') throw new Error('Oportunidade inválida.');
        const { data: profile, error: profileError } = await supabase.from('profiles')
            .select('role, roles').eq('id', userId).eq('organization_id', organizationId).maybeSingle();
        if (profileError || !profile) throw new Error('Não foi possível validar o acesso à proposta.');
        const roles = Array.isArray(profile.roles) ? profile.roles : [];
        const fullAccess = profile.role === 'admin' || profile.role === 'manager' ||
            roles.some((role: unknown) => role === 'admin' || role === 'manager');
        let dealQuery = supabase.from('deals').select('id')
            .eq('id', dealId).eq('organization_id', organizationId);
        if (!fullAccess) dealQuery = dealQuery.eq('owner_id', userId);
        const { data: deal, error } = await dealQuery.maybeSingle();
        if (error || !deal) throw new Error('Oportunidade indisponível ou sem permissão.');
    }

    private static async assertProposalVisible(
        supabase: ReturnType<typeof createAdminClient>,
        userId: string,
        organizationId: string,
        proposalId: string,
    ): Promise<void> {
        const { data: proposal, error } = await supabase.from('proposals')
            .select('deal_id, created_by').eq('id', proposalId).eq('organization_id', organizationId).maybeSingle();
        if (error || !proposal) throw new Error('Proposta indisponível ou sem permissão.');
        if (proposal.deal_id) {
            await this.assertDealVisible(supabase, userId, organizationId, proposal.deal_id);
            return;
        }
        // Standalone proposals require both creator identity and current tenant membership.
        if (proposal.created_by !== userId) throw new Error('Proposta indisponível ou sem permissão.');
        const { data: profile, error: profileError } = await supabase.from('profiles')
            .select('id').eq('id', userId).eq('organization_id', organizationId).maybeSingle();
        if (profileError || !profile) throw new Error('Não foi possível validar o acesso à proposta.');
    }
    static async fetchProposals(userId: string, dealId: string, organizationId: string): Promise<Proposal[]> {
        const supabase = createAdminClient();
        await this.assertDealVisible(supabase, userId, organizationId, dealId);

        // 2. Fetch proposals strictly within the user's organization
        const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error || !Array.isArray(data)) {
            console.error('[ProposalService] proposals fetch failed');
            throw new Error('Não foi possível carregar as propostas.');
        }

        return data.map((p: any) => ({
            ...p,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            dealId: p.deal_id,
            content: p.content || p.content_json,
        })) as Proposal[];
    }

    static async updateProposal(userId: string, proposalId: string, organizationId: string, updates: Partial<Proposal>): Promise<Proposal> {
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            throw new Error('Alteração de proposta inválida.');
        }
        if (updates.status !== undefined && !this.proposalStatuses.has(updates.status)) {
            throw new Error('Status de proposta inválido.');
        }
        if (updates.allow_signature !== undefined && typeof updates.allow_signature !== 'boolean') {
            throw new Error('Configuração de assinatura inválida.');
        }
        const dbUpdates: Record<string, unknown> = {};
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.public_token) dbUpdates.public_token = updates.public_token;
        if (updates.allow_signature !== undefined) dbUpdates.allow_signature = updates.allow_signature;
        if (updates.sentAt) dbUpdates.sent_at = updates.sentAt;
        if (updates.viewedAt) dbUpdates.viewed_at = updates.viewedAt;
        if (updates.signedAt) dbUpdates.signed_at = updates.signedAt;
        if (!Object.keys(dbUpdates).length) throw new Error('Nenhuma alteração de proposta permitida.');

        const supabase = createAdminClient();
        await this.assertProposalVisible(supabase, userId, organizationId, proposalId);
        const { data, error } = await supabase
            .from('proposals')
            .update(dbUpdates)
            .eq('id', proposalId)
            .eq('organization_id', organizationId)
            .select()
            .maybeSingle();
        if (error || !data) throw new Error('Não foi possível atualizar a proposta.');

        return {
            ...data,
            content: data.content || data.content_json,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            dealId: data.deal_id,
        } as Proposal;
    }

    static async deleteProposal(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();
        await this.assertProposalVisible(supabase, userId, organizationId, id);

        const { data: deleted, error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id').maybeSingle();

        if (error || !deleted) throw new Error('Não foi possível excluir a proposta.');
        return true;
    }

    static async createProposal(userId: string, organizationId: string, payload: Partial<Proposal>): Promise<Proposal> {
        if (typeof payload?.title !== 'string' || !payload.title.trim() || payload.title.length > 250) {
            throw new Error('Título da proposta inválido.');
        }
        if (payload.status !== undefined && !this.proposalStatuses.has(payload.status)) {
            throw new Error('Status de proposta inválido.');
        }
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

        if (insertData.deal_id) {
            await this.assertDealVisible(supabase, userId, organizationId, insertData.deal_id);
        }
        if (insertData.account_id) {
            await this.assertTenantReference(supabase, 'accounts', insertData.account_id, organizationId);
        }
        if (insertData.lead_id) {
            await this.assertTenantReference(supabase, 'leads', insertData.lead_id, organizationId);
        }

        // Auto-increment version for the deal
        if (insertData.deal_id) {
            const { data: latestProposal, error: versionError } = await supabase
                .from('proposals')
                .select('version')
                .eq('deal_id', insertData.deal_id)
                .eq('organization_id', organizationId)
                .order('version', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (versionError) throw new Error('Não foi possível consultar a versão da proposta.');
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

        if (error || !data) {
            console.error('[ProposalService] proposal creation failed');
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
