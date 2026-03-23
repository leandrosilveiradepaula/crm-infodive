export interface Contact {
    id: string;
    organization_id: string;
    name: string;
    email: string;
    mobile_phone?: string;
    landline_phone?: string;
    role?: string;
    linkedin?: string;
    account_id?: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
    account?: {
        name: string;
    };
}
