export interface ProductTechDetail {
    id: string;
    sku?: string;
    description: string;
    quantity: number;
    unit_price: number;
    unit_cost?: number;
    is_visible_on_proposal?: boolean;
    is_highlighted_on_grid?: boolean;
    grid_label?: string | null;
}

export interface DealProduct {
    id: string;
    organization_id: string;
    deal_id: string;
    product_id?: string;
    name: string;
    sku?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    cost: number;
    margin: number;
    category?: string;
    subcategory?: string;
    manufacturer?: string;
    is_bid?: boolean;
    is_usd?: boolean;
    usd_cost?: number;
    exchange_rate?: number;
    billing_type?: 'direct' | 'indirect';
    distributor_id?: string;
    distributor_cnpj?: string;
    is_optional?: boolean;
    parent_id?: string | null;
    show_sku_on_proposal?: boolean;
    show_description_on_proposal?: boolean;
    catalog_description?: string;
    display_order?: number;
    custom_label?: string | null;
    tech_details?: string | null;
    [key: string]: any;
}

export interface Deal {
    id: string;
    organization_id: string;
    title: string;
    company: string;
    value: number;
    probability: number;
    stage: string;
    owner: string;
    tags: string[];
    description?: string;
    days_in_stage: number;
    created_at: string;
    won_at?: string;
    lost_at?: string;
    loss_reason?: string;
    owner_id?: string;
    owner_profile?: any;
    expected_close_date?: string;
    deal_products?: DealProduct[];
    deal_activities?: any[];
    account?: any;
    account_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    risk_factors?: string[];
    health_score?: number;
    health_trend?: 'stable' | 'improving' | 'declining';
    billing_type?: 'direct' | 'indirect';
    distributor_id?: string;
    distributor_contact_id?: string;
    manufacturer_contact_id?: string;
    supplier_id?: string;
    client_contact_id?: string;
    lead_source?: string;
    next_step?: string;
    commission_deduction?: number;
    custom_fields?: Record<string, any>;
}
