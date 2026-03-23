export interface Contract {
    id: string;
    title: string;
    company: string;
    value: number;
    status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined';
    createdAt: string;
    updatedAt: string;
    type: 'service' | 'nda' | 'sales';
    signerName?: string;
    signerRole?: string;
    dealId?: string;
    proposalId?: string;
    content_json?: any;
    signature_image?: string;
}
