import { createAdminClient } from '../lib/supabase/admin';
import { type Contract } from '../types/contract';

export class ContractService {
    static async getContracts(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        // Service-role bypasses RLS; trust only the current active profile.
        const { data: profile, error: profileError } = await supabase
            .from('profiles').select('role')
            .eq('id', userId).eq('organization_id', organizationId)
            .eq('status', 'active').maybeSingle();
        if (profileError || !profile) throw new Error('Acesso aos contratos negado.');
        const privileged = profile.role === 'admin' || profile.role === 'manager';
        if (!privileged && profile.role !== 'vendedor') throw new Error('Acesso aos contratos negado.');

        // Keyset pagination: INSERT/DELETE before the cursor cannot shift pages.
        // This is not a transactional snapshot for changes to ownership/sort keys.
        const pageSize = 500;
        const all: Record<string, unknown>[] = [];
        const seen = new Set<string>();
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
        let cursor: { created_at: string; id: string } | null = null;
        for (;;) {
            let query = privileged
                ? supabase.from('contracts').select('*').eq('organization_id', organizationId)
                : supabase.from('contracts')
                    .select('*, visible_deal:deals!inner(id)')
                    .eq('organization_id', organizationId)
                    .eq('visible_deal.organization_id', organizationId)
                    .eq('visible_deal.owner_id', userId);
            if (cursor) {
                // PostgREST OR operands with punctuation must be quoted.
                query = query.or('created_at.lt."' + cursor.created_at +
                    '",and(created_at.eq."' + cursor.created_at + '",id.lt.' + cursor.id + ')');
            }
            const { data, error } = await query
                .order('created_at', { ascending: false, nullsFirst: true })
                .order('id', { ascending: false }).limit(pageSize);
            if (error || !Array.isArray(data) || data.length > pageSize)
                throw new Error('Não foi possível carregar os contratos.');
            for (const item of data) {
                if (!item || typeof item.id !== 'string' || !uuid.test(item.id) ||
                    typeof item.created_at !== 'string' || !timestamp.test(item.created_at) ||
                    Number.isNaN(Date.parse(item.created_at)) || seen.has(item.id))
                    throw new Error('Resposta de contratos inválida.');
                seen.add(item.id);
                all.push(item);
            }
            if (data.length < pageSize) return all;
            const last = data[data.length - 1];
            cursor = { created_at: last.created_at, id: last.id };
        }
    }

    private static async assertCanWrite(userId: string, organizationId: string, dealId: string | null | undefined) {
        const db = createAdminClient();
        const { data: profile, error } = await db.from('profiles')
            .select('role').eq('id', userId).eq('organization_id', organizationId)
            .eq('status', 'active').maybeSingle();
        if (error || !profile) throw new Error('Acesso aos contratos negado.');
        if (profile.role !== 'admin' && profile.role !== 'manager' && profile.role !== 'vendedor')
            throw new Error('Acesso aos contratos negado.');
        if (!dealId) {
            if (profile.role === 'vendedor') throw new Error('Contrato sem negócio não autorizado.');
            return;
        }
        const { data: deal, error: dealError } = await db.from('deals')
            .select('id,owner_id').eq('id', dealId).eq('organization_id', organizationId).maybeSingle();
        if (dealError || !deal || (profile.role === 'vendedor' && deal.owner_id !== userId))
            throw new Error('Negócio não autorizado.');
    }

    private static async assertProposalInTenant(organizationId: string, proposalId: string | null | undefined, dealId: string | null | undefined) {
        if (!proposalId) return;
        const db = createAdminClient();
        const { data, error } = await db.from('proposals').select('id,deal_id')
            .eq('id', proposalId).eq('organization_id', organizationId).maybeSingle();
        if (error || !data || (data.deal_id && dealId && data.deal_id !== dealId))
            throw new Error('Proposta não autorizada.');
    }

    private static async assertCanEditContract(userId: string, organizationId: string, id: string) {
        const db = createAdminClient();
        const { data, error } = await db.from('contracts').select('deal_id')
            .eq('id', id).eq('organization_id', organizationId).maybeSingle();
        if (error || !data) throw new Error('Contrato não autorizado.');
        await this.assertCanWrite(userId, organizationId, data.deal_id);
        return data.deal_id as string | null;
    }

    static async createContract(userId: string, organizationId: string, contract: Partial<Contract>) {
        await this.assertCanWrite(userId, organizationId, contract.dealId);
        await this.assertProposalInTenant(organizationId, contract.proposalId, contract.dealId);
        const supabase = createAdminClient();
        
        const dbData = {
            organization_id: organizationId,
            title: contract.title,
            company_name: contract.company,
            value: contract.value,
            status: contract.status || 'draft',
            type: contract.type || 'service',
            signer_name: contract.signerName,
            signer_role: contract.signerRole,
            deal_id: contract.dealId,
            proposal_id: contract.proposalId,
            content_json: contract.content_json,
            signature_image: contract.signature_image
        };

        const { data, error } = await supabase
            .from('contracts')
            .insert([dbData])
            .select()
            .single();

        if (error) throw new Error('Não foi possível salvar o contrato.');
        return data;
    }

    static async updateContract(userId: string, organizationId: string, id: string, updates: Partial<Contract>) {
        const existingDealId = await this.assertCanEditContract(userId, organizationId, id);
        if (updates.dealId !== undefined && updates.dealId !== existingDealId)
            await this.assertCanWrite(userId, organizationId, updates.dealId);
        if (updates.proposalId !== undefined)
            await this.assertProposalInTenant(organizationId, updates.proposalId, updates.dealId === undefined ? existingDealId : updates.dealId);
        const supabase = createAdminClient();
        
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.company !== undefined) dbUpdates.company_name = updates.company;
        if (updates.value !== undefined) dbUpdates.value = updates.value;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.signerName !== undefined) dbUpdates.signer_name = updates.signerName;
        if (updates.signerRole !== undefined) dbUpdates.signer_role = updates.signerRole;
        if (updates.dealId !== undefined) dbUpdates.deal_id = updates.dealId;
        if (updates.proposalId !== undefined) dbUpdates.proposal_id = updates.proposalId;
        if (updates.content_json !== undefined) dbUpdates.content_json = updates.content_json;
        if (updates.signature_image !== undefined) dbUpdates.signature_image = updates.signature_image;

        let write = supabase.from('contracts').update(dbUpdates)
            .eq('id', id).eq('organization_id', organizationId);
        write = existingDealId === null ? write.is('deal_id', null)
            : write.eq('deal_id', existingDealId);
        const { data, error } = await write.select().maybeSingle();
        if (error || !data) throw new Error('Não foi possível atualizar o contrato.');
        return data;
    }

    static async deleteContract(userId: string, organizationId: string, id: string) {
        const existingDealId = await this.assertCanEditContract(userId, organizationId, id);
        const supabase = createAdminClient();
        let write = supabase.from('contracts').delete()
            .eq('id', id).eq('organization_id', organizationId);
        write = existingDealId === null ? write.is('deal_id', null)
            : write.eq('deal_id', existingDealId);
        const { data, error } = await write.select('id').maybeSingle();
        if (error || !data) throw new Error('Não foi possível excluir o contrato.');
        return true;
    }
}
