import type { Deal } from '@/types/deal';
import type { Profile } from '@/types/profile';
import { getRecurringPricingMultiplier } from './dealCalculations';

export interface CommissionResult {
    commission: number;
    netMargin: number;
    appliedRate?: number;
    debug?: {
        deduction: number;
        productsCount: number;
        hasRules: boolean;
    };
}

export function calculateDealCommission(
    deal: Partial<Deal>,
    ownerRules: Profile['commission_rules'] | string | null,
    legacyRate: number = 0
): CommissionResult {
    const deduction = (deal.commission_deduction ?? 21) / 100;
    const products = deal.deal_products || [];

    let rules: Profile['commission_rules'] = undefined;

    if (typeof ownerRules === 'string') {
        try {
            rules = JSON.parse(ownerRules);
        } catch (e) {
            console.error('Error parsing commission rules:', e);
            rules = undefined;
        }
    } else {
        rules = ownerRules || undefined;
    }

    let lastAppliedRate = 0;

    const totals = products.reduce((acc, p) => {
        const grossMargin = ((p.unit_price || 0) - (p.cost || 0)) * (p.quantity || 0) * getRecurringPricingMultiplier(p.pricing_model);
        const netMargin = grossMargin * (1 - deduction);

        // Map Portuguese UI categories to English rule keys
        const categoryMap: Record<string, string> = {
            'hardware': 'hardware',
            'produto': 'hardware',
            'software': 'software',
            'licenciamento': 'software',
            'serviço': 'services',
            'serviços': 'services'
        };

        const rawCat = (p.category || 'Hardware').toLowerCase();
        const ruleKey = categoryMap[rawCat] || 'hardware';

        let rate = 0;

        // 1. Try specific category rule
        if (rules && rules[ruleKey as keyof NonNullable<Profile['commission_rules']>]) {
            const rule = rules[ruleKey as keyof NonNullable<Profile['commission_rules']>];
            const ruleValue = deal.is_new_client
                ? Number(rule.new)
                : Number(rule.base);

            if (!isNaN(ruleValue) && ruleValue > 0) {
                rate = ruleValue;
            } else if (!isNaN(Number(rule.base)) && Number(rule.base) > 0) {
                // Fallback to base if 'new' is not set or 0
                rate = Number(rule.base);
            }
        }

        // 2. Try legacy commission_rate from profile
        if (rate === 0 && legacyRate > 0) {
            rate = legacyRate;
        }

        // 3. Fallback default to avoid "Zero" confusion
        if (rate === 0) {
            rate = 2.0;
        }

        lastAppliedRate = rate;

        return {
            commission: acc.commission + (netMargin * (rate / 100)),
            netMargin: acc.netMargin + netMargin
        };
    }, { commission: 0, netMargin: 0 });

    return {
        commission: totals.commission,
        netMargin: totals.netMargin,
        appliedRate: lastAppliedRate,
        debug: {
            deduction,
            productsCount: products.length,
            hasRules: !!rules
        }
    };
}
