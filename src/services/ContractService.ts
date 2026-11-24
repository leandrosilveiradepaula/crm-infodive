import { createAdminClient } from '../lib/supabase/admin';
import { type Contract } from '../types/contract';

export class ContractService {
    // Current callers render the complete collection, not one page.
    // Fetch bounded pages and reject partial results; never hide later contracts.
    static async getContracts(organizationId: string, ownerId: string | null, canViewAll: boolean) {
        const PAGE_SIZE = 100;
        const MAX_PAGES = 10000;
        if (!organizationId || typeof canViewAll !== 'boolean' || (!canViewAll && !ownerId)) {
            throw new Error('Não foi possível determinar a autoridade para ler contratos.');
        }
        const supabase = createAdminClient();
        const result: Record<string, any>[] = [];
        const seen = new Set<string>();
        let expectedCount: number | undefined;

        for (let page = 0; page < MAX_PAGES; page++) {
            const start = result.length;
            let query = supabase.from('contracts')
                .select(canViewAll ? '*' : '*, deals!inner(owner_id,organization_id)', { count: 'exact' })
                .eq('organization_id', organizationId);
            if (!canViewAll) {
                query = query.eq('deals.organization_id', organizationId)
                    .eq('deals.owner_id', ownerId);
            }
            const { data, error, count } = await query
                .order('created_at', { ascending: false, nullsFirst: false })
                .order('id', { ascending: false })
                .range(start, start + PAGE_SIZE - 1);
            if (error || !Array.isArray(data) || typeof count !== 'number' ||
                !Number.isSafeInteger(count) || count < 0 || data.length > PAGE_SIZE ||
                (expectedCount !== undefined && count !== expectedCount) ||
                start + data.length > count || (data.length === 0 && start < count)) {
                throw new Error('Não foi possível carregar todos os contratos. Atualize e tente novamente.');
            }
            expectedCount = count;
            // PostgREST's compile-time parser cannot infer a conditional
            // select string. Treat its result as untrusted and narrow it
            // explicitly rather than pretending that its shape is known.
            for (const value of data as unknown[]) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    throw new Error('Não foi possível validar a integridade da lista de contratos.');
                }
                const row = value as Record<string, unknown>;
                const deal = row.deals && typeof row.deals === 'object' && !Array.isArray(row.deals)
                    ? row.deals as Record<string, unknown> : null;
                if (typeof row.id !== 'string' || !row.id ||
                    row.organization_id !== organizationId || seen.has(row.id) ||
                    (!canViewAll && (deal?.owner_id !== ownerId ||
                        deal?.organization_id !== organizationId))) {
                    throw new Error('Não foi possível validar a integridade da lista de contratos.');
                }
                seen.add(row.id);
                result.push(row);
            }
            if (result.length === expectedCount) return result;
        }
        throw new Error('Não foi possível carregar todos os contratos dentro do limite seguro.');
    }

    static async createContract(organizationId: string, contract: Partial<Contract>) {
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

    static async updateContract(organizationId: string, id: string, updates: Partial<Contract>) {
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

        const { data, error } = await supabase
            .from('contracts')
            .update(dbUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw new Error('Não foi possível atualizar o contrato.');
        return data;
    }

    static async deleteContract(organizationId: string, id: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error('Não foi possível excluir o contrato.');
        return true;
    }
}
