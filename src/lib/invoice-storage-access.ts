/**
 * Raw Storage signing is reserved for invoice_url references saved on sales_orders.
 * Normal document attachments use DocumentService access checks instead.
 * Both legacy timestamp suffixes and random UUID suffixes are supported.
 */
const UUID_SEGMENT = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const INVOICE_NAME = new RegExp('^(' + UUID_SEGMENT + ')_([A-Za-z0-9-]{1,80})\\.(pdf|xml)$', 'i');

export function parseInvoiceStoragePath(
    organizationId: string,
    filePath: unknown,
): { orderId: string } | null {
    if (typeof organizationId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(organizationId) ||
        typeof filePath !== 'string' || filePath.length > 300) {
        return null;
    }
    const parts = filePath.split('/');
    if (parts.length !== 3 || parts[0] !== organizationId || parts[1] !== 'invoices') {
        return null;
    }
    const matched = INVOICE_NAME.exec(parts[2]);
    if (!matched) return null;
    return { orderId: matched[1] };
}

export function isValidInvoiceStoragePath(
    organizationId: string,
    orderId: string,
    filePath: unknown,
): boolean {
    const parsed = parseInvoiceStoragePath(organizationId, filePath);
    return parsed !== null && parsed.orderId.toLowerCase() === orderId.toLowerCase();
}
