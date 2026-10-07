const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getRequestId(incoming?: string | null): string {
    const candidate = incoming?.trim();
    if (candidate && REQUEST_ID_PATTERN.test(candidate)) {
        return candidate;
    }
    return crypto.randomUUID();
}
