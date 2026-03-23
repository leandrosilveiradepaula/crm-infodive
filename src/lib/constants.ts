/**
 * Centralized application constants
 */

export const PROPOSAL_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    VIEWED: 'viewed',
    SIGNED: 'signed',
    REJECTED: 'rejected',
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const ORDER_STATUS = {
    PENDING: 'pending',
    BILLED: 'billed',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const CONTACT_SUGGESTION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    IGNORED: 'ignored',
} as const;

export type ContactSuggestionStatus = typeof CONTACT_SUGGESTION_STATUS[keyof typeof CONTACT_SUGGESTION_STATUS];

export const PRODUCT_CATEGORIES = {
    HARDWARE: 'Hardware',
    SOFTWARE: 'Software',
    LICENSING: 'Licenciamento',
    PRODUCT: 'Produto',
    SERVICE: 'Serviço',
} as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES];

export const STOCK_STATUS = {
    IN_STOCK: 'in_stock',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

export const DEAL_HEALTH_STATUS = {
    HEALTHY: 'healthy',
    AT_RISK: 'at_risk',
    URGENT: 'urgent',
} as const;

export type DealHealthStatus = typeof DEAL_HEALTH_STATUS[keyof typeof DEAL_HEALTH_STATUS];

export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SALES: 'sales',
    VENDEDOR: 'vendedor',
} as const;

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
