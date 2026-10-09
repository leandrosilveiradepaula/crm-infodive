'use server';

import { createAdminClient } from '../../../lib/supabase/admin';
import type { PurchaseOrder } from '../../../hooks/usePurchaseOrders';
import { requirePermission, requireSessionContext } from '../../../lib/auth-server';

const STATUS = ['draft', 'sent', 'confirmed', 'delivered', 'cancelled'] as const;
const FIELDS = ['sales_order_id', 'distributor_id', 'distributor_branch_id', 'status', 'expected_delivery_date', 'tracking_code', 'notes'] as const;
type Writable = Pick<PurchaseOrder, (typeof FIELDS)[number]>;

function validatePurchaseOrderInput(input: Partial<PurchaseOrder>, isCreate: boolean): Partial<Writable> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid purchase order');
    const values: Record<string, unknown> = {};
    for (const field of FIELDS) {
        const value = input[field];
        if (value === undefined) continue;
        if (field === 'status') {
            if (typeof value !== 'string' || !STATUS.includes(value as (typeof STATUS)[number])) throw new Error('Invalid status');
        } else if (field === 'notes') {
            if (typeof value !== 'string' || value.length > 10000) throw new Error('Invalid notes');
        } else if (field === 'expected_delivery_date') {
            if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date');
        } else if (typeof value !== 'string' || !value.trim() || value.length > 250) {
            throw new Error('Invalid reference');
        }
        values[field] = value;
    }
    if (isCreate && values.status === undefined) values.status = 'draft';
    if (!isCreate && !Object.keys(values).length) throw new Error('No valid changes');
    return values as Partial<Writable>;
}

async function assertTenantReference(supabase: ReturnType<typeof createAdminClient>, table: string, id: string, organizationId: string) {
    const { data, error } = await supabase.from(table).select('id')
        .eq('id', id).eq('organization_id', organizationId).maybeSingle();
    if (error || !data) throw new Error('Invalid purchase order reference');
}

export async function getPurchaseOrders() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    try {
        const { data, error } = await supabase.from('purchase_orders').select(`
            *,
            distributor:accounts!purchase_orders_distributor_id_fkey(name),
            sales_order:sales_orders(id,total_value,deal:deals(title))
        `).eq('organization_id', organizationId).order('created_at', { ascending: false });
        if (error || !Array.isArray(data)) throw new Error('Invalid purchase order list');
        return { success: true, data };
    } catch {
        return { success: false, error: 'Não foi possível carregar pedidos de compra.' };
    }
}

export async function createPurchaseOrder(po: Partial<PurchaseOrder>) {
    const { organizationId } = await requirePermission('deals:create');
    try {
        const values = validatePurchaseOrderInput(po, true);
        const supabase = createAdminClient();
        if (values.sales_order_id) await assertTenantReference(supabase, 'sales_orders', values.sales_order_id, organizationId);
        if (values.distributor_id) await assertTenantReference(supabase, 'accounts', values.distributor_id, organizationId);
        const { data, error } = await supabase.from('purchase_orders')
            .insert([{ ...values, organization_id: organizationId }]).select('*').maybeSingle();
        if (error || !data) throw new Error('Purchase order not persisted');
        return { success: true, data };
    } catch {
        return { success: false, error: 'Não foi possível criar o pedido de compra.' };
    }
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>) {
    const { organizationId } = await requirePermission('deals:edit');
    try {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Invalid ID');
        const values = validatePurchaseOrderInput(updates, false);
        const supabase = createAdminClient();
        if (values.sales_order_id) await assertTenantReference(supabase, 'sales_orders', values.sales_order_id, organizationId);
        if (values.distributor_id) await assertTenantReference(supabase, 'accounts', values.distributor_id, organizationId);
        const { data, error } = await supabase.from('purchase_orders').update(values)
            .eq('id', id.trim()).eq('organization_id', organizationId)
            .select('*').maybeSingle();
        if (error || !data) throw new Error('Purchase order not updated');
        return { success: true, data };
    } catch {
        return { success: false, error: 'Não foi possível atualizar o pedido de compra.' };
    }
}
