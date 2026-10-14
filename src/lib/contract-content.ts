/** Only persisted user-authored text may be rendered as document content.
 * Arbitrary objects/HTML and synthetic fallback clauses are never trusted.
 */
export function persistedContractText(value: unknown): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const text = (value as Record<string, unknown>).text;
    return typeof text === 'string' && text.trim().length > 0 ? text : null;
}

/** Draft payloads stay bounded and text-only, including nested inputs. */
export function validatePersistedDraftText(value: unknown): void {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Conteúdo do contrato inválido.');
    const keys = Object.keys(value);
    if (keys.length !== 1 || keys[0] !== 'text') throw new Error('Formato do contrato inválido.');
    const text = (value as Record<string, unknown>).text;
    if (typeof text !== 'string' || !text.trim() || text.length > 100000) {
        throw new Error('Texto do contrato inválido.');
    }
}
