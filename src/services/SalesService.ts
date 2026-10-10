import { createAdminClient } from '../lib/supabase/admin';
import type { SalesOrder, SalesOrderItem } from '@/hooks/useSalesOrders';
import type { DealProduct } from '@/types/deal';

export class SalesService {
    static async getSalesOrders(organizationId: string, dealId?: string): Promise<SalesOrder[]> {
        const supabase = createAdminClient();
        let query = supabase
            .from('sales_orders')
            .select(`
                *,
                items:sales_order_items(*),
                installments:sales_order_installments(*),
                deal:deals(title, commission_deduction, owner_id, customer:accounts!deals_account_id_fkey(name))
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (dealId) {
            query = query.eq('deal_id', dealId);
        }

        const { data, error } = await query;
        if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar os dados de vendas.');

        // Fetch profiles for the users (either via created_by or deal's owner_id)
        let profilesMap: Record<string, { full_name: string; commission_rules: any }> = {};
        if (data && data.length > 0) {
            const userIds = new Set<string>();
            data.forEach(order => {
                if (order.created_by) userIds.add(order.created_by);
                if (order.deal?.owner_id) userIds.add(order.deal.owner_id);
            });

            if (userIds.size > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, commission_rules')
                    .in('id', Array.from(userIds))
                    .eq('organization_id', organizationId);
                
                if (profilesError || !Array.isArray(profiles)) throw new Error('Não foi possível carregar os perfis de vendas.');
                if (profiles) {
                    profilesMap = (profiles as any[]).reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {} as Record<string, any>);
                }
            }
        }

        // Map the user into the order
        const mappedData = (data || []).map(order => {
            const userId = order.created_by || order.deal?.owner_id;
            const profile = userId ? profilesMap[userId] : null;
            
            return {
                ...order,
                user: {
                    name: profile?.full_name || 'Vendedor',
                    commission_rules: profile?.commission_rules || null
                }
            };
        });

        return mappedData as SalesOrder[];
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

        if (orderError) throw new Error('Não foi possível salvar os dados de vendas.');

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

            if (itemsError) throw new Error('Não foi possível salvar os dados de vendas.');
        }

        return orderData;
    }

    static async updateSalesOrder(organizationId: string, id: string, updates: Partial<SalesOrder>) {
        if (typeof id !== 'string' || !id.trim() || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
            throw new Error('Pedido inválido.');
        }
        const writable = ['status', 'tax_invoice_number', 'billing_entity', 'payment_status', 'commission_status',
            'total_value', 'invoice_url', 'billed_at', 'shipped_at', 'delivered_at'] as const;
        const changes: Record<string, unknown> = {};
        for (const key of writable) {
            if (updates[key] !== undefined) changes[key] = updates[key];
        }
        if (!Object.keys(changes).length) throw new Error('Nenhuma alteração válida.');
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('sales_orders').update(changes)
            .eq('id', id.trim()).eq('organization_id', organizationId)
            .select().maybeSingle();
        if (error || !data) throw new Error('Não foi possível atualizar os dados de vendas.');
        return data;
    }

    static async deleteSalesOrder(organizationId: string, id: string) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Pedido inválido.');
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('sales_orders').delete()
            .eq('id', id.trim()).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !data) throw new Error('Não foi possível excluir os dados de vendas.');
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

        if (dealError || !deal) throw new Error('Negócio não encontrado ou acesso negado.');

        const products = deal.deal_products || [];
        if (products.length === 0) return { success: true, message: 'No products to convert' };

        // 2. Group products by distributor_id
        const groups: Record<string, DealProduct[]> = {};
        products.forEach((p: DealProduct) => {
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
                console.error('[SalesService] sales order creation failed');
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
                console.error('[SalesService] order item creation failed');
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

        if (error) throw new Error('Não foi possível salvar os dados de vendas.');
        return data;
    }

    static async updateInstallmentStatus(organizationId: string, installmentId: string, newStatus: string) {
        if (typeof installmentId !== 'string' || !installmentId.trim() ||
            !['pending', 'paid', 'cancelled', 'overdue'].includes(newStatus)) {
            throw new Error('Parcela ou situação inválida.');
        }
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('sales_order_installments')
            .update({ status: newStatus }).eq('id', installmentId.trim())
            .eq('organization_id', organizationId).select().maybeSingle();
        if (error || !data) throw new Error('Não foi possível atualizar os dados de vendas.');
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

        if (error) throw new Error('Não foi possível carregar os dados de vendas.');
        return data;
    }
}
