export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected';

export interface ProposalProduct {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ProposalSection {
    id: string;
    title: string;
    content: string;
    order: number;
}

export interface Proposal {
    id: string;
    deal_id: string;
    title: string;
    status: ProposalStatus;
    number: string;
    template: string;
    version: number;

    // Frontend friendly camelCase mapping
    dealId: string;
    accountId?: string;
    leadId?: string;
    customerId?: string;

    // Metadata / Content
    content: {
        aiSummary?: string;
        config?: any;
        generatedAt?: string;
        [key: string]: any;
    };

    // Financials (often denormalized or computed)
    subtotal: number;
    discount: number;
    discountPercentage?: number;
    tax?: number;
    taxPercentage?: number;
    total: number;

    // Dates
    createdAt: string;
    updatedAt?: string;
    validUntil?: string; // Optional, might be in content or separate column
    sentAt?: string;
    viewedAt?: string;
    signedAt?: string;

    // Auth
    createdBy?: string;

    // Config
    includeTerms?: boolean;
    includeLogo?: boolean;
    includeSignature?: boolean;
    terms?: string;
    versions?: any[];

    // Digital Signature fields
    public_token?: string;
    allow_signature?: boolean;
    signature_required?: boolean;

    // Derived or Joined fields (if any)
    customerName?: string;
    customerEmail?: string;

    // If the backend stores products/sections in JSON or separate tables, adjust here
    // For now assuming we might hydrate these from the 'content' or separate fetch
    products?: ProposalProduct[];
    products_json?: any[];
    sections?: ProposalSection[];
    company_name?: string;
}
