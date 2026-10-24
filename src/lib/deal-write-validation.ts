/**
 * Server-only deal mutation boundary. Keep values from client input out of
 * privileged PostgreSQL writes unless they match the persisted data contract.
 */
export function requireDealIdentity(userId: unknown, organizationId: unknown, dealId?: unknown): void {
    if (typeof userId !== 'string' || !userId.trim() ||
        typeof organizationId !== 'string' || !organizationId.trim() ||
        (dealId !== undefined && (typeof dealId !== 'string' || !dealId.trim()))) {
        throw new Error('Identificação da oportunidade inválida.');
    }
}

export function validateDealTitle(title: unknown): string {
    if (typeof title !== 'string' || !title.trim() || title.length > 240) {
        throw new Error('Título da oportunidade inválido.');
    }
    return title.trim();
}

export function validateDealMoney(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) ||
        value < 0 || value > 1_000_000_000_000_000) {
        throw new Error('Valor da oportunidade inválido.');
    }
    return value;
}

export function validateDealProbability(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) ||
        value < 0 || value > 100) {
        throw new Error('Probabilidade da oportunidade inválida.');
    }
    return value;
}

export function validateDealStage(stage: unknown): string {
    if (typeof stage !== 'string' || !stage.trim() || stage.length > 100 ||
        /[\u0000-\u001f]/.test(stage)) {
        throw new Error('Etapa da oportunidade inválida.');
    }
    return stage.trim();
}

export function validateDealReference(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' || !value.trim() || value.length > 128) {
        throw new Error('Referência da oportunidade inválida.');
    }
    return value.trim();
}
