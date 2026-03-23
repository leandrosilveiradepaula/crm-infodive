export interface CommissionResult {
    commission: number;
    netMargin: number;
    appliedRate?: number;
    debug?: any;
}

export function calculateDealCommission(
    deal: {
        commission_deduction?: number;
        is_new_client?: boolean;
        deal_products?: Array<{
            unit_price: number;
            cost?: number;
            quantity: number;
            category?: string;
            name?: string;
        }>;
    },
    ownerRules: any,
    legacyRate: number = 0
): CommissionResult {
    const deduction = (deal.commission_deduction ?? 21) / 100;
    const products = deal.deal_products || [];

    let rules = ownerRules as any;

    if (typeof rules === 'string') {
        try {
            rules = JSON.parse(rules);
        } catch (e) {
            console.error('Error parsing commission rules:', e);
            rules = {};
        }
    }

    let lastAppliedRate = 0;

    const totals = products.reduce((acc, p) => {
        const grossMargin = ((p.unit_price || 0) - (p.cost || 0)) * (p.quantity || 0);
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
        if (rules && rules[ruleKey]) {
            const ruleValue = deal.is_new_client
                ? Number(rules[ruleKey].new)
                : Number(rules[ruleKey].base);

            if (!isNaN(ruleValue) && ruleValue > 0) {
                rate = ruleValue;
            } else if (!isNaN(Number(rules[ruleKey].base)) && Number(rules[ruleKey].base) > 0) {
                // Fallback to base if 'new' is not set or 0
                rate = Number(rules[ruleKey].base);
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
