import { createAdminClient } from '@/lib/supabase/admin';
import { type Contract } from '@/types/contract';

export class ContractService {
    static async getContracts(organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw new Error('Não foi possível carregar os contratos.');
        return data;
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
