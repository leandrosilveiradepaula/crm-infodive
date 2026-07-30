import { createAdminClient } from '@/lib/supabase/admin';
import { ServiceContract } from '@/types/postSales';

export class ServiceContractService {
    static async getContracts(userId: string, organizationId: string, accountId?: string): Promise<ServiceContract[]> {
        const supabase = createAdminClient();
        let query = supabase
            .from('service_contracts')
            .select(`
                *,
                account:accounts(name),
                deal:deals(title)
            `)
            .eq('organization_id', organizationId)
            .order('end_date', { ascending: true, nullsFirst: false });

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching service contracts:', error);
            throw new Error('Falha ao carregar contratos de serviço.');
        }

        return data as ServiceContract[];
    }

    static async getContractById(userId: string, organizationId: string, contractId: string): Promise<ServiceContract | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('service_contracts')
            .select('*, account:accounts(name), deal:deals(title)')
            .eq('id', contractId)
            .eq('organization_id', organizationId)
            .single();

        if (error) return null;
        return data as ServiceContract;
    }

    static async createContract(userId: string, organizationId: string, payload: Partial<ServiceContract>): Promise<ServiceContract> {
        const supabase = createAdminClient();

        // Whitelist fields
        const safePayload = {
            organization_id: organizationId,
            account_id: payload.account_id,
            deal_id: payload.deal_id || null,
            title: payload.title,
            type: payload.type || 'support',
            start_date: payload.start_date || null,
            end_date: payload.end_date || null,
            status: payload.status || 'active',
            monthly_value: payload.monthly_value || 0,
            coverage_details: payload.coverage_details || null,
            created_by: userId
        };

        const { data, error } = await supabase
            .from('service_contracts')
            .insert([safePayload])
            .select()
            .single();

        if (error) {
            console.error('Error creating service contract:', error);
            throw new Error('Não foi possível salvar o contrato de serviço.');
        }

        return data as ServiceContract;
    }

    static async updateContract(userId: string, organizationId: string, contractId: string, updates: Partial<ServiceContract>): Promise<ServiceContract> {
        const supabase = createAdminClient();

        // Whitelist updates
        const allowedColumns = [
            'deal_id', 'title', 'type', 'start_date', 'end_date', 
            'status', 'monthly_value', 'coverage_details'
        ];

        const safeUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
            if (allowedColumns.includes(key)) {
                acc[key] = value === '' ? null : value;
            }
            return acc;
        }, {} as Record<string, any>);

        const { data, error } = await supabase
            .from('service_contracts')
            .update(safeUpdates)
            .eq('id', contractId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating service contract:', error);
            throw new Error('Não foi possível atualizar o contrato de serviço.');
        }

        return data as ServiceContract;
    }

    static async deleteContract(userId: string, organizationId: string, contractId: string): Promise<boolean> {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('service_contracts')
            .delete()
            .eq('id', contractId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting service contract:', error);
            throw new Error('Falha ao excluir contrato.');
        }

        return true;
    }
}
