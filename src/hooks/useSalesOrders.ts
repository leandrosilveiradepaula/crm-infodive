import { useState, useCallback } from 'react';
import { getSalesOrders, createSalesOrder as createSalesOrderAction, updateSalesOrder as updateSalesOrderAction, deleteSalesOrder } from '@/app/(dashboard)/sales/actions';
import { toast } from 'sonner';

export interface SalesOrder {
    id: string;
    deal_id: string;
    distributor_id?: string;
    distributor_branch_id?: string;
    status: 'pedido_gerado' | 'nf_emitida' | 'entregue' | 'cliente_pagou' | 'distribuidor_pagou' | 'comissao_paga';
    tax_invoice_number?: string;
    billing_entity?: 'infodive' | 'distributor';
    payment_status?: 'pending' | 'paid' | 'partial';
    commission_status?: 'pending' | 'paid';
    total_value: number;
    invoice_url?: string;
    billed_at?: string;
    shipped_at?: string;
    delivered_at?: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    items?: SalesOrderItem[];
    installments?: SalesOrderInstallment[];
    commissions?: any[];
    deal?: {
        title: string;
        customer?: {
            name: string;
        };
    };
    user?: {
        name: string;
        commission_rules?: any;
    };
}

export interface SalesOrderItem {
    id: string;
    sales_order_id: string;
    product_sku?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    cost: number;
    margin: number;
    external_id?: string;
}

export interface SalesOrderInstallment {
    id: string;
    sales_order_id: string;
    organization_id: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'cancelled' | 'overdue';
    created_at: string;
    updated_at: string;
}

export const useSalesOrders = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSalesOrders = useCallback(async (dealId?: string) => {
        setLoading(true);
        try {
            const result = await getSalesOrders(dealId);
            if (!result.success) throw new Error(result.error);
            return result.data as SalesOrder[];
        } catch (err: any) {
            console.error('Error fetching sales orders:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createSalesOrder = async (order: Partial<SalesOrder>, items: Partial<SalesOrderItem>[]) => {
        setLoading(true);
        try {
            const result = await createSalesOrderAction(order, items);
            if (!result.success) throw new Error(result.error);
            return (result as any).data;
        } catch (err: any) {
            setError(err.message);
            console.error('Error creating sales order:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateSalesOrder = async (id: string, updates: Partial<SalesOrder>) => {
        setLoading(true);
        try {
            const result = await updateSalesOrderAction(id, updates);
            if (!result.success) throw new Error(result.error);
            return (result as any).data as SalesOrder;
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Erro ao atualizar pedido');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateInstallment = async (installmentId: string, status: string) => {
        setLoading(true);
        try {
            const { updateInstallmentStatusAction } = await import('@/app/(dashboard)/sales/actions');
            const result = await updateInstallmentStatusAction(installmentId, status);
            if (!result.success) throw new Error(result.error);
            return true;
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Erro ao atualizar parcela');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchSalesOrders,
        createSalesOrder,
        updateSalesOrder,
        updateInstallment,
        loading,
        error
    };
};
