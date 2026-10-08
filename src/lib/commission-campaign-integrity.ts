import type { Campaign } from '@/types/goal';

const campaignFields = [
    'name', 'description', 'start_date', 'end_date', 'active',
    'commission_percent', 'commission_absolute',
] as const;

export function sanitizeCampaignWrite(input: Partial<Campaign>, requireName = false): Partial<Campaign> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Invalid campaign');
    }

    const safe: Record<string, unknown> = {};
    const source = input as Record<string, unknown>;
    for (const field of campaignFields) {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            safe[field] = source[field];
        }
    }
    if (!Object.keys(safe).length) throw new Error('Empty campaign update');
    if (requireName && !Object.prototype.hasOwnProperty.call(safe, 'name')) {
        throw new Error('Campaign name required');
    }
    if ('name' in safe && (typeof safe.name !== 'string' || !safe.name.trim() || safe.name.length > 200)) {
        throw new Error('Invalid campaign name');
    }
    if ('description' in safe && (typeof safe.description !== 'string' || safe.description.length > 2000)) {
        throw new Error('Invalid campaign description');
    }
    for (const field of ['start_date', 'end_date']) {
        if (field in safe && safe[field] !== null && typeof safe[field] !== 'string') {
            throw new Error('Invalid campaign date');
        }
    }
    if ('active' in safe && typeof safe.active !== 'boolean') {
        throw new Error('Invalid campaign activation');
    }
    for (const field of ['commission_percent', 'commission_absolute']) {
        if (field in safe && (
            typeof safe[field] !== 'number' ||
            !Number.isFinite(safe[field]) ||
            (safe[field] as number) < 0
        )) {
            throw new Error('Invalid campaign commission value');
        }
    }
    return safe as Partial<Campaign>;
}

export interface CommissionPaymentWrite {
    commission_status: 'pending' | 'paid';
    commission_paid_at: string | null;
    commission_value_final: number | null;
}

export function sanitizeCommissionPayment(input: unknown, now = new Date()): CommissionPaymentWrite {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Invalid commission update');
    }
    const source = input as Record<string, unknown>;
    if (source.commission_status === 'pending') {
        return { commission_status: 'pending', commission_paid_at: null, commission_value_final: null };
    }
    if (source.commission_status !== 'paid') {
        throw new Error('Invalid commission status');
    }
    if (
        typeof source.commission_value_final !== 'number' ||
        !Number.isFinite(source.commission_value_final) ||
        source.commission_value_final < 0
    ) {
        throw new Error('Invalid paid commission amount');
    }
    return {
        commission_status: 'paid',
        commission_paid_at: now.toISOString(),
        commission_value_final: source.commission_value_final,
    };
}
