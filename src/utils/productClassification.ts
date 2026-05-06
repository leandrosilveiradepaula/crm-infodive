import type { DealProduct } from '@/types/deal';

/**
 * Centralized logic for product classification.
 * Based solely on the explicit `category` field set by the user.
 */

export const isSoftware = (p: Partial<DealProduct>) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    return (
        cat.includes('software') ||
        cat.includes('licen') ||
        cat.includes('subscri') ||
        cat.includes('maintenance') ||
        cat.includes('maint')
    );
};

export const isService = (p: Partial<DealProduct>) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    return (
        (cat.includes('servi') && !cat.includes('servidor')) ||
        cat.includes('service') ||
        cat.includes('implant') ||
        cat.includes('config')
    );
};

export const isSupport = (p: Partial<DealProduct>) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    return (
        cat.includes('suporte') ||
        cat.includes('support') ||
        cat.includes('care') ||
        cat.includes('garantia') ||
        cat.includes('warranty')
    );
};

export const isHardware = (p: Partial<DealProduct>) => {
    if (!p) return false;
    if (isSoftware(p) || isService(p) || isSupport(p)) return false;
    return true;
};

/**
 * Returns a human-readable label for the product category based on classification
 */
export const getClassificationLabel = (p: Partial<DealProduct>): string => {
    if (isSoftware(p)) return 'Software & Licenças';
    if (isService(p)) return 'Serviços';
    if (isSupport(p)) return 'Suporte & Garantia';
    return 'Hardware & Infraestrutura';
};
