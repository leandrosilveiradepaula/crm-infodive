export interface AccountContact {
    id: string;
    name: string;
    email: string;
    mobile: string;
    landline: string;
    role: string;
    isPrimary: boolean;
}

export interface AccountBranch {
    id: string;
    name: string;
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cnpj?: string;
    ie?: string;
}

export interface Account {
    id: string;
    organization_id: string;
    name: string;
    cnpj: string;
    ie: string;
    segment: string;
    status: 'Ativo' | 'Inativo';
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    contacts: AccountContact[];
    branches: AccountBranch[];
    tags?: string[];
    relationship_type?: string;
    logo_url?: string;
    payment_terms?: string;
    description?: string;
    created_at?: string;
}
