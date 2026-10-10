export type InvoiceValidation =
    | { ok: true; extension: 'xml' | 'pdf'; contentType: string }
    | { ok: false; error: string };

const MAX_INVOICE_BYTES = 10 * 1024 * 1024;

export function validateInvoiceUpload(orderId: unknown, file: unknown): InvoiceValidation {
    if (typeof orderId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId)) {
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


/**
 * Detect files that lie about their extension or MIME before placing them in
 * privileged Storage. This is a format sanity check, not NFe fiscal validation.
 */
export function validateInvoiceContent(extension: 'xml' | 'pdf', input: ArrayBuffer): string | null {
    const bytes = new Uint8Array(input);
    if (bytes.length === 0) return 'Arquivo vazio.';
    if (extension === 'pdf') {
        const start = String.fromCharCode(...bytes.subarray(0, Math.min(1024, bytes.length)));
        const tail = String.fromCharCode(...bytes.subarray(Math.max(0, bytes.length - 1024)));
        if (!start.includes('%PDF-') || !tail.includes('%%EOF')) {
            return 'O conteúdo não corresponde a um PDF válido.';
        }
        return null;
    }
    let text: string;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
    } catch {
        return 'O XML deve estar codificado em UTF-8.';
    }
    if (/<!DOCTYPE|<!ENTITY/i.test(text) || [...text].some(character => {
        const code = character.charCodeAt(0);
        return code < 32 && code !== 9 && code !== 10 && code !== 13;
    })) {
        return 'O XML contém declarações ou caracteres proibidos.';
    }
    if (!/^(?:<\?xml\s[^>]*\?>\s*)?<[A-Za-z_:][\w:.-]*(?:\s[^<>]*)?(?:\/>|>[\s\S]*<\/[A-Za-z_:][\w:.-]*>)$/.test(text)) {
        return 'O conteúdo não corresponde a um XML válido.';
    }
    return null;
}
