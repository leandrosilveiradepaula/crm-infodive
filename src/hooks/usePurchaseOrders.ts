import { useState, useCallback } from 'react';
import { getPurchaseOrders, createPurchaseOrder as createPurchaseOrderAction, updatePurchaseOrder as updatePurchaseOrderAction } from '@/app/(dashboard)/purchases/purchase-orders-actions';

export interface PurchaseOrder {
    id: string;
    sales_order_id?: string;
    distributor_id?: string;
    distributor_branch_id?: string;
    status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
    expected_delivery_date?: string;
    tracking_code?: string;
    notes?: string;
    created_at: string;
    created_by: string;
    distributor?: {
        name: string;
    };
    sales_order?: {
        id: string;
        total_value?: number;
        deal?: {
            title: string;
        };
    };
}

export const usePurchaseOrders = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPurchaseOrders = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getPurchaseOrders();
            if (!result.success) throw new Error(result.error);
            return result.data as PurchaseOrder[];
        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createPurchaseOrder = async (po: Partial<PurchaseOrder>) => {
        setLoading(true);
        try {
            const result = await createPurchaseOrderAction(po);
            if (!result.success) throw new Error(result.error);
            return result.data as PurchaseOrder;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
        setLoading(true);
        try {
            const result = await updatePurchaseOrderAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return result.data as PurchaseOrder;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };


    return {
        fetchPurchaseOrders,
        createPurchaseOrder,
        updatePurchaseOrder,
        loading,
        error
    };
};
