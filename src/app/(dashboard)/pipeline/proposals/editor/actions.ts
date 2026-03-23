'use server';

import { requireSessionContext } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Fetches deal with products for the proposal editor.
 * Validates organization access.
 */
export async function fetchDealForEditor(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();

    const supabase = createAdminClient();
    const { data: deal, error } = await supabase
        .from('deals')
        .select('*, deal_products(*)')
        .eq('id', dealId)
        .eq('organization_id', organizationId)
        .single();

    if (error || !deal) {
        throw new Error('Deal not found or access denied');
    }

    return deal;
}

/**
 * Fetches distributors for the proposal editor.
 */
export async function fetchDistributorsForEditor() {
    const { userId, organizationId } = await requireSessionContext();

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('accounts')
        .select('id, name, cnpj, payment_terms, logo_url, account_branches(id, name, cnpj), account_contacts(id, name, email, mobile_phone, landline_phone, role)')
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'Distribuidor')
        .order('name');

    if (error) {
        console.error('Error fetching distributors:', error);
        return [];
    }

    return data || [];
}
