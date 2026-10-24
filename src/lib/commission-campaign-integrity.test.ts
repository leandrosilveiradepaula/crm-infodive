import { describe, expect, it } from 'vitest';
import { sanitizeCampaignWrite, sanitizeCommissionPayment } from './commission-campaign-integrity';

describe('commission and campaign mutation policy', () => {
    it('retains only client-writable campaign business fields', () => {
        const input = {
            id: 'forged-campaign',
            organization_id: 'other-org',
            created_at: 'forged',
            updated_at: 'forged',
            name: 'New campaign',
            commission_percent: 3,
            commission_absolute: 0,
            active: true,
        };
        const result = sanitizeCampaignWrite(input);
        expect(result).toEqual({
            name: 'New campaign',
            commission_percent: 3,
            commission_absolute: 0,
            active: true,
        });
        expect(result).not.toHaveProperty('organization_id');
        expect(result).not.toHaveProperty('id');
    });

    it('rejects invalid campaign writes instead of coercing unsafe values', () => {
        expect(() => sanitizeCampaignWrite({ active: true }, true)).toThrow();
        expect(() => sanitizeCampaignWrite({ name: '  ' })).toThrow();
        expect(() => sanitizeCampaignWrite({ commission_percent: Number.NaN })).toThrow();
        expect(() => sanitizeCampaignWrite({ commission_absolute: -1 })).toThrow();
        expect(() => sanitizeCampaignWrite({ active: 'yes' as unknown as boolean })).toThrow();
        expect(() => sanitizeCampaignWrite({ organization_id: 'other-org' })).toThrow();
        expect(sanitizeCampaignWrite({ name: 'Valid', start_date: null }, true)).toEqual({ name: 'Valid', start_date: null });
    });

    it('only accepts paid or pending commission status and sanitizes the value', () => {
        const now = new Date('2026-10-08T18:00:00.000Z');
        expect(sanitizeCommissionPayment({
            commission_status: 'paid',
            commission_value_final: 0,
            organization_id: 'other-org',
            value: 999999,
            commission_paid_at: '2099-01-01',
        }, now)).toEqual({
            commission_status: 'paid',
            commission_paid_at: '2026-10-08T18:00:00.000Z',
            commission_value_final: 0,
        });
        expect(sanitizeCommissionPayment({
            commission_status: 'pending',
            commission_value_final: 999999,
            commission_paid_at: '2099-01-01',
        })).toEqual({
            commission_status: 'pending',
            commission_paid_at: null,
            commission_value_final: null,
        });
    });

    it('rejects missing, nonfinite, negative or unsupported payment statuses', () => {
        expect(() => sanitizeCommissionPayment({ commission_status: 'paid' })).toThrow();
        expect(() => sanitizeCommissionPayment({ commission_status: 'paid', commission_value_final: Number.POSITIVE_INFINITY })).toThrow();
        expect(() => sanitizeCommissionPayment({ commission_status: 'paid', commission_value_final: -10 })).toThrow();
        expect(() => sanitizeCommissionPayment({ commission_status: 'approved', commission_value_final: 1 })).toThrow();
        expect(() => sanitizeCommissionPayment(null)).toThrow();
    });
});
