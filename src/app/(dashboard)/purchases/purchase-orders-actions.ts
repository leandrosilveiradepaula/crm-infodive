'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { requirePermission, requireSessionContext } from '@/lib/auth-server';

export async function getPurchaseOrders() {
    const { organizationId } = await requireSessionContext();
    const supabase = await createAdminClient();

    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                distributor:accounts!purchase_orders_distributor_id_fkey(name),
                sales_order:sales_orders(
                    id,
                    total_value,
                    deal:deals(title)
                )
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching purchase orders:', error);
        return { success: false, error: error.message };
    }
}

export async function createPurchaseOrder(po: Partial<PurchaseOrder>) {
    const { organizationId } = await requirePermission('deals:create');
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .insert([{
                sales_order_id: po.sales_order_id,
                distributor_id: po.distributor_id,
                distributor_branch_id: po.distributor_branch_id,
                status: po.status || 'draft',
                expected_delivery_date: po.expected_delivery_date,
                notes: po.notes,
                organization_id: organizationId
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error creating purchase order:', error);
        return { success: false, error: error.message };
    }
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
    const { organizationId } = await requirePermission('deals:edit');
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error updating purchase order:', error);
        return { success: false, error: error.message };
    }
}


