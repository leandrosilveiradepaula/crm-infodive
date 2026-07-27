export type DocumentCategory =
    | 'contrato'
    | 'contrato_social'
    | 'financeiro'
    | 'fiscal'
    | 'certificado'
    | 'ata'
    | 'nf'
    | 'tecnico'
    | 'configuracao'
    | 'precos_aprovados'
    | 'proposta'
    | 'espelho_nf'
    | 'pedido'
    | 'outro';

export type EntityType = 'deal' | 'account' | 'contact';

/** Categories for deal documents */
export const DEAL_DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
    { value: 'configuracao', label: 'Configuração' },
    { value: 'precos_aprovados', label: 'Preços Aprovados' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'espelho_nf', label: 'Espelho de NF' },
    { value: 'pedido', label: 'Pedido' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'ata', label: 'Ata' },
    { value: 'nf', label: 'Nota Fiscal' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'outro', label: 'Outro' },
];

/** Categories for account documents */
export const ACCOUNT_DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
    { value: 'contrato_social', label: 'Contrato Social' },
    { value: 'financeiro', label: 'Financeiro / DRE' },
    { value: 'fiscal', label: 'Fiscal / CNPJ' },
    { value: 'certificado', label: 'Certificado' },
    { value: 'contrato', label: 'Contrato' },
    { value: 'nf', label: 'Nota Fiscal' },
    { value: 'outro', label: 'Outro' },
];

/** Get categories based on entity type */
export function getDocumentCategories(entityType: EntityType) {
    switch (entityType) {
        case 'account': return ACCOUNT_DOCUMENT_CATEGORIES;
        case 'deal':
        default: return DEAL_DOCUMENT_CATEGORIES;
    }
}

export interface EntityDocument {
    id: string;
    organization_id: string;
    entity_type: EntityType;
    entity_id: string;
    created_by: string;
    name: string;
    description?: string | null;
    file_path: string;
    file_type: string;
    file_size: number;
    category: DocumentCategory;
    parent_id?: string | null;
    version: number;
    quote_id?: string | null;
    created_at: string;
    updated_at: string;
    source_name?: string;
}
