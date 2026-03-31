import type { DealProduct } from '@/types/deal';

export function sortProductsHierarchically(products: DealProduct[]) {

    // 1. Group by parent_id
    const childrenMap = new Map<string, DealProduct[]>();
    const rootProducts: DealProduct[] = [];

    for (const p of products) {
        if (p.parent_id) {
            if (!childrenMap.has(p.parent_id)) {
                childrenMap.set(p.parent_id, []);
            }
            childrenMap.get(p.parent_id)!.push(p);
        } else {
            rootProducts.push(p);
        }
    }

    // 2. Sort siblings by display_order
    const sortByOrder = (a: DealProduct, b: DealProduct) => (a.display_order || 0) - (b.display_order || 0);
    rootProducts.sort(sortByOrder);
    for (const children of childrenMap.values()) {
        children.sort(sortByOrder);
    }

    // 3. Flatten tree
    const result: DealProduct[] = [];

    // Recursive function to add product and its children
    const addProductAndChildren = (product: DealProduct) => {
        result.push(product);
        const children = childrenMap.get(product.id);
        if (children) {
            for (const child of children) {
                addProductAndChildren(child);
            }
        }
    }

    for (const root of rootProducts) {
        addProductAndChildren(root);
    }

    // Append any orphaned children just in case their parent_id is missing from the list
    const resultIds = new Set(result.map(p => p.id));
    const orphans = products.filter(p => !resultIds.has(p.id));

    if (orphans.length > 0) {
        orphans.sort(sortByOrder);
        result.push(...orphans);
    }

    return result;
}
