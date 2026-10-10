export type InvoiceValidation =
    | { ok: true; extension: 'xml' | 'pdf'; contentType: string }
    | { ok: false; error: string };

const MAX_INVOICE_BYTES = 10 * 1024 * 1024;

export function validateInvoiceUpload(orderId: unknown, file: unknown): InvoiceValidation {
    if (typeof orderId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(orderId)) {
        return { ok: false, error: 'Pedido inválido.' };
    }
    if (!file || typeof file !== 'object' ||
        !('name' in file) || !('size' in file) || !('type' in file) ||
        !('arrayBuffer' in file) || typeof file.arrayBuffer !== 'function' ||
        typeof file.name !== 'string' || typeof file.size !== 'number') {
        return { ok: false, error: 'Arquivo inválido.' };
    }
    if (file.size <= 0 || file.size > MAX_INVOICE_BYTES || !Number.isFinite(file.size)) {
        return { ok: false, error: 'Arquivo excede o limite de 10 MB ou está vazio.' };
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'pdf' && extension !== 'xml') {
        return { ok: false, error: 'Somente PDF e XML são permitidos.' };
    }
    const mime = typeof file.type === 'string' ? file.type.toLowerCase() : '';
    const accepted = extension === 'pdf'
        ? ['application/pdf']
        : ['application/xml', 'text/xml'];
    if (!accepted.includes(mime)) {
        return { ok: false, error: 'Tipo de arquivo incompatível.' };
    }
    return { ok: true, extension, contentType: mime };
}
