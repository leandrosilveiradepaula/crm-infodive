import { describe, expect, it } from 'vitest';
import type { DealProduct } from '../src/types/deal';
import {
    buildProposalDisplayGroups,
    buildProposalDisplayItem,
    formatProposalDisplayCurrency,
    getProposalDisplayCurrency,
    getProposalDisplaySubtotal,
    getProposalDisplayUnitPrice,
    normalizeProposalQuantity,
} from '../src/components/proposals/proposalDisplayValues';

const product = (overrides: Partial<DealProduct> = {}): DealProduct => ({
    id: overrides.id || 'product-1',
    organization_id: 'org-1',
    deal_id: 'deal-1',
    name: overrides.name || 'Product',
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 100,
    cost: overrides.cost ?? 40,
    margin: overrides.margin ?? 20,
    ...overrides,
});

describe('proposal display values', () => {
    it('uses BRL for normal products', () => {
        const item = buildProposalDisplayItem(product({ unit_price: 1234.56 }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(1234.56);
        expect(item.subtotal).toBe(1234.56);
        expect(item.usdFallbackToBrl).toBe(false);
    });

    it('uses USD when present_in_usd has a valid exchange rate', () => {
        const item = buildProposalDisplayItem(product({
            is_usd: true,
            unit_price: 5200,
            present_in_usd: true,
            exchange_rate: 5.2,
        }));

        expect(item.currency).toBe('USD');
        expect(item.unitPrice).toBe(1000);
        expect(item.subtotal).toBe(1000);
        expect(item.validExchangeRate).toBe(true);
    });

    it('falls back to BRL when present_in_usd has no exchange rate', () => {
        const item = buildProposalDisplayItem(product({ is_usd: true, present_in_usd: true }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(100);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('falls back to BRL when exchange_rate is zero', () => {
        const item = buildProposalDisplayItem(product({ is_usd: true, present_in_usd: true, exchange_rate: 0 }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(100);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('falls back to BRL when exchange_rate is negative', () => {
        const item = buildProposalDisplayItem(product({ is_usd: true, present_in_usd: true, exchange_rate: -5 }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(100);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('falls back to BRL when exchange_rate is NaN', () => {
        const item = buildProposalDisplayItem(product({ is_usd: true, present_in_usd: true, exchange_rate: Number.NaN }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(100);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('falls back to BRL when exchange_rate is an invalid string', () => {
        const item = buildProposalDisplayItem(product({
            is_usd: true,
            present_in_usd: true,
            exchange_rate: 'invalid' as unknown as number,
        }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(100);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('preserves quantity in display subtotal', () => {
        expect(getProposalDisplaySubtotal(product({ unit_price: 125, quantity: 3 }))).toBe(375);
    });

    it('preserves quantity 0', () => {
        expect(normalizeProposalQuantity(0)).toBe(0);
    });

    it('uses 0 subtotal when quantity is 0', () => {
        expect(getProposalDisplaySubtotal(product({ unit_price: 125, quantity: 0 }))).toBe(0);
    });

    it('uses 1 only when quantity is missing or not numeric', () => {
        expect(normalizeProposalQuantity(undefined)).toBe(1);
        expect(normalizeProposalQuantity(null)).toBe(1);
        expect(normalizeProposalQuantity('invalid')).toBe(1);
    });

    it('keeps buildProposalDisplayItem subtotal aligned with getProposalDisplaySubtotal', () => {
        const item = product({
            is_usd: true,
            unit_price: 5200,
            quantity: 2,
            present_in_usd: true,
            exchange_rate: 5.2,
        });

        expect(buildProposalDisplayItem(item).subtotal).toBe(getProposalDisplaySubtotal(item));
    });

    it('groups one_time BRL products', () => {
        const groups = buildProposalDisplayGroups([product({ pricing_model: 'one_time' })]);

        expect(groups[0].pricingModel).toBe('one_time');
        expect(groups[0].items[0].currency).toBe('BRL');
    });

    it('groups one_time USD products', () => {
        const groups = buildProposalDisplayGroups([product({
            pricing_model: 'one_time',
            is_usd: true,
            present_in_usd: true,
            exchange_rate: 2,
        })]);

        expect(groups[0].pricingModel).toBe('one_time');
        expect(groups[0].items[0].currency).toBe('USD');
    });

    it('groups monthly BRL products', () => {
        const groups = buildProposalDisplayGroups([product({ pricing_model: 'monthly' })]);

        expect(groups[0].pricingModel).toBe('monthly');
        expect(groups[0].items[0].currency).toBe('BRL');
    });

    it('groups monthly USD products', () => {
        const groups = buildProposalDisplayGroups([product({
            pricing_model: 'monthly',
            is_usd: true,
            unit_price: 5200,
            present_in_usd: true,
            exchange_rate: 5.2,
        })]);

        expect(groups[0].pricingModel).toBe('monthly');
        expect(groups[0].items[0].currency).toBe('USD');
    });

    it('does not annualize monthly USD presentation', () => {
        const groups = buildProposalDisplayGroups([product({
            pricing_model: 'monthly',
            is_usd: true,
            unit_price: 5200,
            quantity: 2,
            present_in_usd: true,
            exchange_rate: 5.2,
        })]);

        expect(groups[0].items[0].subtotal).toBe(2000);
        expect(groups[0].totals[0].subtotal).toBe(2000);
    });

    it('groups annual BRL products', () => {
        const groups = buildProposalDisplayGroups([product({ pricing_model: 'annual' })]);

        expect(groups[0].pricingModel).toBe('annual');
        expect(groups[0].items[0].currency).toBe('BRL');
    });

    it('groups annual USD products', () => {
        const groups = buildProposalDisplayGroups([product({
            pricing_model: 'annual',
            is_usd: true,
            unit_price: 5200,
            present_in_usd: true,
            exchange_rate: 5.2,
        })]);

        expect(groups[0].pricingModel).toBe('annual');
        expect(groups[0].items[0].currency).toBe('USD');
    });

    it('keeps mixed BRL and USD items in one pricing group', () => {
        const groups = buildProposalDisplayGroups([
            product({ id: 'brl', pricing_model: 'monthly', unit_price: 1000 }),
            product({ id: 'usd', pricing_model: 'monthly', is_usd: true, unit_price: 5200, present_in_usd: true, exchange_rate: 5.2 }),
        ]);

        expect(groups).toHaveLength(1);
        expect(groups[0].items.map(item => item.currency)).toEqual(['BRL', 'USD']);
    });

    it('creates separate totals per currency', () => {
        const groups = buildProposalDisplayGroups([
            product({ id: 'brl', pricing_model: 'monthly', unit_price: 1000 }),
            product({ id: 'usd', pricing_model: 'monthly', is_usd: true, unit_price: 5200, present_in_usd: true, exchange_rate: 5.2 }),
        ]);

        expect(groups[0].totals).toEqual([
            { currency: 'BRL', subtotal: 1000, totalLabel: 'Total mensal BRL' },
            { currency: 'USD', subtotal: 1000, totalLabel: 'Total mensal USD' },
        ]);
    });

    it('preserves original item order inside pricing groups', () => {
        const groups = buildProposalDisplayGroups([
            product({ id: 'monthly-a', pricing_model: 'monthly' }),
            product({ id: 'one-time', pricing_model: 'one_time' }),
            product({ id: 'monthly-b', pricing_model: 'monthly' }),
        ]);

        expect(groups.find(group => group.pricingModel === 'monthly')?.items.map(item => item.product.id)).toEqual([
            'monthly-a',
            'monthly-b',
        ]);
    });

    it('omits empty pricing groups', () => {
        const groups = buildProposalDisplayGroups([product({ pricing_model: 'annual' })]);

        expect(groups.map(group => group.pricingModel)).toEqual(['annual']);
    });

    it('keeps optional products out of main totals when callers pass only main products', () => {
        const products = [
            product({ id: 'main', pricing_model: 'monthly', unit_price: 1000 }),
            product({ id: 'optional', pricing_model: 'monthly', unit_price: 5000, is_optional: true }),
        ];
        const groups = buildProposalDisplayGroups(products.filter(item => !item.is_optional));

        expect(groups[0].totals[0].subtotal).toBe(1000);
    });

    it('preserves parent and child order when supplied hierarchically', () => {
        const groups = buildProposalDisplayGroups([
            product({ id: 'parent', pricing_model: 'monthly' }),
            product({ id: 'child', parent_id: 'parent', pricing_model: 'monthly' }),
        ]);

        expect(groups[0].items.map(item => item.product.id)).toEqual(['parent', 'child']);
    });

    it('exposes display currency independently from formatting', () => {
        expect(getProposalDisplayCurrency(product({ is_usd: true, present_in_usd: true, exchange_rate: 5 }))).toBe('USD');
        expect(getProposalDisplayCurrency(product({ present_in_usd: false, exchange_rate: 5 }))).toBe('BRL');
    });

    it('exposes display unit price independently from subtotal', () => {
        expect(getProposalDisplayUnitPrice(product({
            is_usd: true,
            unit_price: 5200,
            quantity: 2,
            present_in_usd: true,
            exchange_rate: 5.2,
        }))).toBe(1000);
    });

    it('falls back to BRL when is_usd is false even with present_in_usd and a valid exchange rate', () => {
        const item = buildProposalDisplayItem(product({
            is_usd: false,
            unit_price: 5200,
            present_in_usd: true,
            exchange_rate: 5.2,
        }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(5200);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('falls back to BRL when is_usd is absent even with present_in_usd and a valid exchange rate', () => {
        const item = buildProposalDisplayItem(product({
            unit_price: 5200,
            present_in_usd: true,
            exchange_rate: 5.2,
        }));

        expect(item.currency).toBe('BRL');
        expect(item.unitPrice).toBe(5200);
        expect(item.usdFallbackToBrl).toBe(true);
    });

    it('formats BRL for proposal display', () => {
        expect(formatProposalDisplayCurrency(1234.56, 'BRL')).toBe('R$ 1.234,56');
    });

    it('formats USD for proposal display', () => {
        expect(formatProposalDisplayCurrency(1234.56, 'USD')).toBe('US$ 1,234.56');
    });
});
