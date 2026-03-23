export interface Product {
    id: string;
    organization_id: string;
    name: string;
    category: string;
    subcategory?: string;
    brand: string;
    icon?: string;
    description: string;
    sku: string;
    margin?: number;
    show_sku_on_proposal?: boolean;
    created_at?: string;
}
