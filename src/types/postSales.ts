export interface ServiceContract {
    id: string;
    organization_id: string;
    account_id: string;
    deal_id?: string;
    title: string;
    type: 'support' | 'warranty_extension' | 'subscription';
    start_date?: string;
    end_date?: string;
    status: 'active' | 'expired' | 'pending_renewal' | 'canceled';
    monthly_value: number;
    coverage_details?: string;
    created_at?: string;
    updated_at?: string;
    created_by?: string;
}

export interface CustomerAsset {
    id: string;
    organization_id: string;
    account_id: string;
    service_contract_id?: string;
    type: 'hardware' | 'software_license' | 'cloud_subscription';
    manufacturer: string;
    name_model: string;
    serial_number_or_key?: string;
    purchase_date?: string;
    warranty_expires_at?: string;
    status: 'active' | 'in_maintenance' | 'retired';
    created_at?: string;
    updated_at?: string;
    created_by?: string;
}
