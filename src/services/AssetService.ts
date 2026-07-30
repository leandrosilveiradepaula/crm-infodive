import { createAdminClient } from '@/lib/supabase/admin';
import { CustomerAsset } from '@/types/postSales';

export class AssetService {
    static async getAssets(userId: string, organizationId: string, accountId?: string): Promise<CustomerAsset[]> {
        const supabase = createAdminClient();
        let query = supabase
            .from('customer_assets')
            .select(`
                *,
                service_contract:service_contracts(title, status, end_date),
                account:accounts(name)
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching assets:', error);
            throw new Error('Falha ao carregar ativos.');
        }

        return data as CustomerAsset[];
    }

    static async getAssetById(userId: string, organizationId: string, assetId: string): Promise<CustomerAsset | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('customer_assets')
            .select('*, service_contract:service_contracts(title, status)')
            .eq('id', assetId)
            .eq('organization_id', organizationId)
            .single();

        if (error) return null;
        return data as CustomerAsset;
    }

    static async createAsset(userId: string, organizationId: string, payload: Partial<CustomerAsset>): Promise<CustomerAsset> {
        const supabase = createAdminClient();

        // Whitelist fields
        const safePayload = {
            organization_id: organizationId,
            account_id: payload.account_id,
            service_contract_id: payload.service_contract_id || null,
            type: payload.type || 'hardware',
            manufacturer: payload.manufacturer,
            name_model: payload.name_model,
            serial_number_or_key: payload.serial_number_or_key || null,
            purchase_date: payload.purchase_date || null,
            warranty_expires_at: payload.warranty_expires_at || null,
            status: payload.status || 'active',
            created_by: userId
        };

        const { data, error } = await supabase
            .from('customer_assets')
            .insert([safePayload])
            .select()
            .single();

        if (error) {
            console.error('Error creating asset:', error);
            throw new Error('Não foi possível salvar o ativo.');
        }

        return data as CustomerAsset;
    }

    static async updateAsset(userId: string, organizationId: string, assetId: string, updates: Partial<CustomerAsset>): Promise<CustomerAsset> {
        const supabase = createAdminClient();

        // Whitelist updates
        const allowedColumns = [
            'service_contract_id', 'type', 'manufacturer', 'name_model', 
            'serial_number_or_key', 'purchase_date', 'warranty_expires_at', 'status'
        ];

        const safeUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
            if (allowedColumns.includes(key)) {
                acc[key] = value === '' ? null : value;
            }
            return acc;
        }, {} as Record<string, any>);

        const { data, error } = await supabase
            .from('customer_assets')
            .update(safeUpdates)
            .eq('id', assetId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating asset:', error);
            throw new Error('Não foi possível atualizar o ativo.');
        }

        return data as CustomerAsset;
    }

    static async deleteAsset(userId: string, organizationId: string, assetId: string): Promise<boolean> {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('customer_assets')
            .delete()
            .eq('id', assetId)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting asset:', error);
            throw new Error('Falha ao excluir ativo.');
        }

        return true;
    }
}
