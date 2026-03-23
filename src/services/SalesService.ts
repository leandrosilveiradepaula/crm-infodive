import { createAdminClient } from '@/lib/supabase/admin';
import { SalesOrder, SalesOrderItem } from '@/hooks/useSalesOrders';

export class SalesService {
    static async getSalesOrders(organizationId: string, dealId?: string) {
        const supabase = createAdminClient();
        let query = supabase
            .from('sales_orders')
            .select(`
                *,
                items:sales_order_items(*),
                installments:sales_order_installments(*),
                deal:deals(title, customer:accounts!deals_account_id_fkey(name))
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (dealId) {
            query = query.eq('deal_id', dealId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as SalesOrder[];
    }

    static async createSalesOrder(organizationId: string, order: Partial<SalesOrder>, items: Partial<SalesOrderItem>[]) {
        const supabase = createAdminClient();

        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase
            .from('sales_orders')
            .insert([{
                ...order,
                organization_id: organizationId,
                status: order.status || 'pedido_gerado'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Items
        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                sales_order_id: orderData.id,
                organization_id: organizationId
            }));

            const { error: itemsError } = await supabase
                .from('sales_order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        return orderData;
    }

    static async updateSalesOrder(organizationId: string, id: string, updates: Partial<SalesOrder>) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('sales_orders')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async deleteSalesOrder(organizationId: string, id: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('sales_orders')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw error;
        return true;
    }

    /**
     * Converts a Won Deal into one or more Sales Orders, 
     * grouped by distributor.
     */
    static async convertDealToSalesOrders(userId: string, organizationId: string, dealId: string) {
        const supabase = createAdminClient();

        // 1. Fetch deal and its products
        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('*, deal_products(*)')
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (dealError || !deal) throw new Error('Deal not found or access denied');

        const products = deal.deal_products || [];
        if (products.length === 0) return { success: true, message: 'No products to convert' };

        // 2. Group products by distributor_id
        const groups: Record<string, any[]> = {};
        products.forEach((p: any) => {
            const distId = p.distributor_id || 'none';
            if (!groups[distId]) groups[distId] = [];
            groups[distId].push(p);
        });

        const results = [];

        // 3. Create a Sales Order for each group
        for (const [distId, groupItems] of Object.entries(groups)) {
            const totalValue = groupItems.reduce((sum, item: any) => sum + (item.unit_price * item.quantity), 0);
            const billingEntity = deal.billing_type === 'direct' ? 'infodive' : 'distributor';

            // Create Order
            const { data: order, error: orderError } = await supabase
                .from('sales_orders')
                .insert([{
                    deal_id: deal.id,
                    organization_id: organizationId,
                    distributor_id: distId === 'none' ? null : distId,
                    status: 'pedido_gerado',
                    billing_entity: billingEntity,
                    total_value: totalValue,
                    created_by: userId
                }])
                .select()
                .single();

            if (orderError) {
                console.error(`Error creating sales order for dist ${distId}:`, orderError);
                continue;
            }

            // Create Items
            const itemsToInsert = groupItems.map(item => ({
                sales_order_id: order.id,
                organization_id: organizationId,
                product_sku: item.sku,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost: item.cost,
                margin: item.margin,
                external_id: item.external_id
            }));

            const { error: itemsError } = await supabase
                .from('sales_order_items')
                .insert(itemsToInsert);

            if (itemsError) {
                console.error(`Error creating items for sales order ${order.id}:`, itemsError);
            }

            results.push(order);
        }

        return { success: true, orders: results };
    }

    static async updateOrderStatus(organizationId: string, orderId: string, updates: Partial<SalesOrder>) {
        return await this.updateSalesOrder(organizationId, orderId, updates);
    }

    static async createInstallments(organizationId: string, orderId: string, installments: { dueDate: string; amount: number }[]) {
        const supabase = createAdminClient();

        const itemsToInsert = installments.map(inst => {
            // Convert DD/MM/YYYY or YYYY-MM-DD to ISO date string or valid Date string for postgres
            let isoDate = inst.dueDate;
            if (isoDate.includes('/')) {
                const parts = isoDate.split('/');
                isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }

            return {
                organization_id: organizationId,
                sales_order_id: orderId,
                due_date: isoDate,
                amount: inst.amount,
                status: 'pending'
            };
        });

        const { data, error } = await supabase
            .from('sales_order_installments')
            .insert(itemsToInsert)
            .select();

        if (error) throw error;
        return data;
    }

    static async updateInstallmentStatus(organizationId: string, installmentId: string, newStatus: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('sales_order_installments')
            .update({ status: newStatus })
            .eq('id', installmentId)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getAllInstallments(organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('sales_order_installments')
            .select(`
                *,
                sales_order:sales_orders(
                    id,
                    total_value,
                    status,
                    deal:deals(title, customer:accounts!deals_account_id_fkey(name))
                )
            `)
            .eq('organization_id', organizationId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data;
    }
}
