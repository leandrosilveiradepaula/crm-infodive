
import { useState, useEffect } from 'react';
import { getProducts } from '@/app/(dashboard)/products/actions';
import { type Product } from '@/types/product';

// Module-level cache so products are fetched only once per session,
// avoiding race conditions when ProductSearch mounts while data still loads.
let _cachedProducts: Product[] | null = null;
let _fetchPromise: Promise<Product[]> | null = null;

async function fetchProductsOnce(): Promise<Product[]> {
    if (_cachedProducts !== null) return _cachedProducts;
    if (_fetchPromise) return _fetchPromise;

    _fetchPromise = (async () => {
        try {
            const data = await getProducts();
            _cachedProducts = data || [];
            return _cachedProducts;
        } catch (error) {
            console.error('Error fetching products via action:', error);
            _fetchPromise = null; // Allow retry on failure
            throw error;
        }
    })();

    return _fetchPromise;
}

/** Call this whenever you need to force a fresh fetch (e.g. after saving a product). */
export function invalidateProductsCache() {
    _cachedProducts = null;
    _fetchPromise = null;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>(_cachedProducts ?? []);
    const [loading, setLoading] = useState(_cachedProducts === null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Already cached — nothing to do
        if (_cachedProducts !== null) {
            setProducts(_cachedProducts);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchProductsOnce()
            .then((data) => {
                setProducts(data);
                setError(null);
            })
            .catch((err: any) => {
                console.error('Error fetching products:', err);
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { products, loading, error };
}
