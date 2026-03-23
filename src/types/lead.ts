export interface Lead {
    id: string;
    organization_id: string;
    company: string;
    contact_name: string;
    email: string;
    phone: string;
    status: 'Novo' | 'Convertido' | 'Qualificado' | 'Perdido';
    interest?: string;
    cnpj?: string;
    ie?: string;
    zip?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    owner?: string;
    created_at: string;
    updated_at: string;
}
