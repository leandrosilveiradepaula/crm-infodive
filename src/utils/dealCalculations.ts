import type { DealProduct } from '@/types/deal';

export interface ProductPriceItem extends Partial<DealProduct> {
    id: string;
    unit_price: number;
    quantity: number;
    is_optional?: boolean;
    cost?: number;
    parent_id?: string | null;
}

/**
 * Calculates the total sales value for a deal, considering product groups (parent/child).
 * Logic:
 * 1. Sum all "Base" products (non-optional).
 * 2. If Base Sum > 0, return it.
 * 3. If Base Sum is 0, identify "Root Options" (optional root items).
 * 4. For each Root Option, calculate the sum of itself and all its descendant children.
 * 5. Return the value of the most expensive scenario group.
 */
export const calculateDealValue = (products: ProductPriceItem[]): number => {
    if (!products || products.length === 0) return 0;

    const productsMap = new Map<string, ProductPriceItem>();
    products.forEach(p => productsMap.set(p.id, p));

    // Helper to get total value of a tree (parent + recursive children)
    const getTreeValue = (productId: string, valueField: 'unit_price' | 'cost'): number => {
        const item = productsMap.get(productId);
        if (!item) return 0;

        const val = (Number(item[valueField as keyof ProductPriceItem]) || 0) * (item.quantity || 0);
        const children = products.filter(p => p.parent_id === productId);

        const childrenSum = children.reduce((sum, child) => {
            return sum + getTreeValue(child.id, valueField);
        }, 0);

        return val + childrenSum;
    };

    // 1. Calculate sum of non-optional root items and their children
    const baseValue = products.reduce((sum, p) => {
        if (p.parent_id || p.is_optional) return sum;
        return sum + getTreeValue(p.id, 'unit_price');
    }, 0);

    console.log('[calculateDealValue] Base Value:', baseValue);

    // 2. If we have a base value, that's our deal value
    if (baseValue > 0) return parseFloat(baseValue.toFixed(2));

    // 3. Fallback: If all root items are optional (or base value is 0),
    // find root options and calculate their scenario values.
    const rootOptions = products.filter(p => p.is_optional && !p.parent_id);
    console.log('[calculateDealValue] Root Options Found:', rootOptions.length);

    if (rootOptions.length === 0) {
        return parseFloat(baseValue.toFixed(2));
    }

    const scenarioValues = rootOptions.map(p => {
        const val = getTreeValue(p.id, 'unit_price');
        console.log(`[calculateDealValue] Scenario for ${p.id}:`, val);
        return val;
    });
    const maxScenario = Math.max(...scenarioValues);

    console.log('[calculateDealValue] Max Scenario Value:', maxScenario);
    return parseFloat(maxScenario.toFixed(2));
};

/**
 * Calculates the total cost for a deal, considering product groups.
 */
export const calculateDealTotalCost = (products: ProductPriceItem[]): number => {
    if (!products || products.length === 0) return 0;

    const productsMap = new Map<string, ProductPriceItem>();
    products.forEach(p => productsMap.set(p.id, p));

    const getTreeValue = (productId: string, valueField: 'unit_price' | 'cost'): number => {
        const item = productsMap.get(productId);
        if (!item) return 0;
        const val = (Number(item[valueField as keyof ProductPriceItem]) || 0) * (item.quantity || 0);
        const children = products.filter(p => p.parent_id === productId);
        return val + children.reduce((sum, child) => sum + getTreeValue(child.id, valueField), 0);
    };

    const baseCost = products.reduce((sum, p) => {
        if (p.parent_id || p.is_optional) return sum;
        return sum + getTreeValue(p.id, 'cost');
    }, 0);

    if (baseCost > 0) return parseFloat(baseCost.toFixed(2));

    const rootOptions = products.filter(p => p.is_optional && !p.parent_id);
    if (rootOptions.length === 0) return parseFloat(baseCost.toFixed(2));

    const scenarioCosts = rootOptions.map(p => getTreeValue(p.id, 'cost'));
    const maxScenarioCost = Math.max(...scenarioCosts);

    return parseFloat(maxScenarioCost.toFixed(2));
};
