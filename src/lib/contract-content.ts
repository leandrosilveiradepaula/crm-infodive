/** Only persisted user-authored text may be rendered as document content.
 * Arbitrary objects/HTML and synthetic fallback clauses are never trusted.
 */
export function persistedContractText(value: unknown): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const text = (value as Record<string, unknown>).text;
    return typeof text === 'string' && text.trim().length > 0 ? text : null;
}
