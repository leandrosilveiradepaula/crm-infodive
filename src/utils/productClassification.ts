import type { DealProduct } from '@/types/deal';

/**
 * Centralized logic for product classification
 * Used to determine which proposal pages a product should appear on
 */

export const isSoftware = (p: Partial<DealProduct>) => {
    if (!p) return false;

    const cat = (p.category || '').toLowerCase();
    const subcat = (p.subcategory || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    // Broad Category/Subcategory Matches + Specific Product Names
    return (
        cat.includes('software') ||
        cat.includes('licen') ||
        cat.includes('subscri') ||
        cat.includes('maintenance') ||
        cat.includes('maint') ||
        subcat.includes('software') ||
        subcat.includes('licen') ||
        subcat.includes('subscri') ||
        // Specific product name matches (Spectrum Control, etc.)
        name.includes('spectrum') ||
        (name.includes('control') && !name.includes('enclosure')) // Avoid matching hardware 'Control Enclosure'
    );
};

export const isService = (p: Partial<DealProduct>) => {
    if (!p) return false;

    const cat = (p.category || '').toLowerCase();
    const subcat = (p.subcategory || '').toLowerCase();

    // Helper to match service keywords while avoiding hardware collisions (like 'servidor')
    const matchesService = (val: string) =>
        (val.includes('servi') && !val.includes('servidor')) ||
        val.includes('service') ||
        val.includes('implant') ||
        val.includes('config');

    return matchesService(cat) || matchesService(subcat);
};

export const isSupport = (p: Partial<DealProduct>) => {
    if (!p) return false;

    const cat = (p.category || '').toLowerCase();
    const subcat = (p.subcategory || '').toLowerCase();

    // Broad Category/Subcategory Matches
    return (
        cat.includes('suporte') ||
        cat.includes('support') ||
        cat.includes('care') ||
        cat.includes('garantia') ||
        cat.includes('warranty') ||
        subcat.includes('suporte') ||
        subcat.includes('support')
    );
};

export const isHardware = (p: Partial<DealProduct>) => {
    if (!p) return false;

    const cat = (p.category || '').toLowerCase();
    const subcat = (p.subcategory || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    // 1. Services and Support are fundamentally NOT hardware, even if their names contain hardware keywords
    // like "Serviço Instalação Storage".
    if (isService(p) || isSupport(p)) return false;

    // 2. Priority hardware keywords (these override software detections, e.g. "Storage Software" goes to Hardware)
    if (
        cat.includes('servidor') || cat.includes('server') || cat.includes('storage') ||
        subcat.includes('servidor') || subcat.includes('server') || subcat.includes('storage') ||
        name.includes('servidor') || name.includes('server') || name.includes('storage')
    ) {
        return true;
    }

    // 3. If it's explicitly identified as Software, it's NOT Hardware (unless caught by priority above)
    if (isSoftware(p)) return false;

    // 4. Strict Category/Subcategory Matches
    if (cat === 'hardware' || cat === 'produto' || cat === 'peça') return true;
    if (subcat === 'hardware') return true;

    // 4. Default to hardware for any other category that isn't software/service/support
    return true;
};

/**
 * Returns a human-readable label for the product category based on classification
 */
export const getClassificationLabel = (p: Partial<DealProduct>): string => {
    if (isSoftware(p)) return 'Software & Licenças';
    if (isService(p)) return 'Serviços';
    if (isSupport(p)) return 'Suporte & Garantia';
    if (isHardware(p)) return 'Hardware & Infraestrutura';
    return 'Geral';
};
