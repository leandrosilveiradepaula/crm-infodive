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
        if (!order || typeof order !== 'object' || Array.isArray(order) ||
            typeof order.deal_id !== 'string' || !order.deal_id.trim() ||
            !Array.isArray(items) || items.length === 0 || items.length > 250 ||
            items.some(item => !item || typeof item.product_name !== 'string' || !item.product_name.trim() ||
                typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0 ||
                typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0)) {
            throw new Error('Dados do pedido inválidos.');
        }
        const supabase = createAdminClient();
        const { data: deal, error: dealError } = await supabase.from('deals')
            .select('id').eq('id', order.deal_id).eq('organization_id', organizationId).maybeSingle();
        if (dealError || !deal) throw new Error('Negócio não encontrado ou acesso negado.');

        // Only explicit writable fields may enter privileged inserts.
        const orderPayload = {
            deal_id: order.deal_id,
            organization_id: organizationId,
            status: 'pedido_gerado',
            billing_entity: order.billing_entity,
            distributor_id: order.distributor_id,
            total_value: items.reduce((sum, item) => sum + item.unit_price! * item.quantity!, 0),
        };
        if (!Number.isFinite(orderPayload.total_value)) throw new Error('Valor do pedido inválido.');

        const { data: orderData, error: orderError } = await supabase.from('sales_orders')
            .insert([orderPayload]).select('id').maybeSingle();
        if (orderError || !orderData) throw new Error('Não foi possível salvar os dados de vendas.');

        const itemsToInsert = items.map(item => ({
            sales_order_id: orderData.id,
            organization_id: organizationId,
            product_sku: item.product_sku,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost: item.cost,
            margin: item.margin,
            external_id: item.external_id,
        }));
        const { data: insertedItems, error: itemsError } = await supabase.from('sales_order_items')
            .insert(itemsToInsert).select('id');
        if (itemsError || !Array.isArray(insertedItems) || insertedItems.length !== itemsToInsert.length) {
            throw new Error('Não foi possível salvar todos os itens do pedido.');
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
        if (typeof userId !== 'string' || !userId.trim() ||
            typeof dealId !== 'string' || !dealId.trim() || typeof organizationId !== 'string' || !organizationId.trim()) {
            throw new Error('Dados de conversão inválidos.');
        }
        const supabase = createAdminClient();
        const { data: deal, error: dealError } = await supabase.from('deals')
            .select('*, deal_products(*)').eq('id', dealId)
            .eq('organization_id', organizationId).maybeSingle();
        if (dealError || !deal || !Array.isArray(deal.deal_products)) {
            throw new Error('Negócio não encontrado ou acesso negado.');
        }

        const products = deal.deal_products as DealProduct[];
        if (products.length === 0) return { success: true, message: 'No products to convert' };
        if (products.some(item => !item || typeof item.name !== 'string' || !item.name.trim() ||
            typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0 ||
            typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
            throw new Error('Produtos do negócio inválidos.');
        }

        // Prevent serial duplicate conversions. Concurrent requests still require
        // a database-level lock/unique idempotency policy.
        const { data: existing, error: existingError } = await supabase.from('sales_orders')
            .select('id').eq('deal_id', dealId).eq('organization_id', organizationId);
        if (existingError || !Array.isArray(existing)) throw new Error('Não foi possível verificar conversão anterior.');
        if (existing.length > 0) throw new Error('Já existem pedidos para este negócio. Verifique antes de repetir.');

        const groups: Record<string, DealProduct[]> = {};
        for (const product of products) {
            const distId = product.distributor_id || 'none';
            if (!groups[distId]) groups[distId] = [];
            groups[distId].push(product);
        }
        const results = [];
        for (const [distId, groupItems] of Object.entries(groups)) {
            const totalValue = groupItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
            if (!Number.isFinite(totalValue)) throw new Error('Valor do pedido inválido.');
            const billingEntity = deal.billing_type === 'direct' ? 'infodive' : 'distributor';
            const { data: order, error: orderError } = await supabase.from('sales_orders')
                .insert([{
                    deal_id: deal.id, organization_id: organizationId,
                    distributor_id: distId === 'none' ? null : distId,
                    status: 'pedido_gerado', billing_entity: billingEntity,
                    total_value: totalValue, created_by: userId,
                }]).select('id').maybeSingle();
            if (orderError || !order) throw new Error('Não foi possível criar o pedido. Conversão parcial possível.');
            const itemsToInsert = groupItems.map(item => ({
                sales_order_id: order.id, organization_id: organizationId,
                product_sku: item.sku, product_name: item.name,
                quantity: item.quantity, unit_price: item.unit_price,
                cost: item.cost, margin: item.margin, external_id: item.external_id,
            }));
            const { data: inserted, error: itemsError } = await supabase.from('sales_order_items')
                .insert(itemsToInsert).select('id');
            if (itemsError || !Array.isArray(inserted) || inserted.length !== itemsToInsert.length) {
                throw new Error('Não foi possível salvar todos os itens. Conversão parcial possível.');
            }
            results.push(order);
        }
        return { success: true, orders: results };
    }

    static async updateOrderStatus(organizationId: string, orderId: string, updates: Partial<SalesOrder>) {
        return await this.updateSalesOrder(organizationId, orderId, updates);
    }

    static async createInstallments(organizationId: string, orderId: string, installments: { dueDate: string; amount: number }[]) {
        if (typeof orderId !== 'string' || !orderId.trim() || !Array.isArray(installments) ||
            installments.length === 0 || installments.length > 120 ||
            installments.some(inst => !inst || typeof inst.dueDate !== 'string' ||
                typeof inst.amount !== 'number' || !Number.isFinite(inst.amount) || inst.amount <= 0)) {
            throw new Error('Parcelas inválidas.');
        }
        const normalized = installments.map(inst => {
            let isoDate = inst.dueDate;
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) {
                const [day, month, year] = isoDate.split('/');
                isoDate = `${year}-${month}-${day}`;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) ||
                Number.isNaN(Date.parse(isoDate)) ||
                new Date(`${isoDate}T00:00:00Z`).toISOString().slice(0, 10) !== isoDate) {
                throw new Error('Data de parcela inválida.');
            }
            return { organization_id: organizationId, sales_order_id: orderId,
                due_date: isoDate, amount: inst.amount, status: 'pending' };
        });
        const supabase = createAdminClient();
        const { data: ownedOrder, error: ownershipError } = await supabase.from('sales_orders')
            .select('id').eq('id', orderId).eq('organization_id', organizationId).maybeSingle();
        if (ownershipError || !ownedOrder) throw new Error('Pedido não encontrado ou acesso negado.');
        const { data, error } = await supabase.from('sales_order_installments')
            .insert(normalized).select('id');
        if (error || !Array.isArray(data) || data.length !== normalized.length) {
            throw new Error('Não foi possível salvar todas as parcelas.');
        }
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

        if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar os dados de vendas.');
        return data;
    }
}
