'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export async function getDealsForReports() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select(`
            id,
            title,
            company,
            value,
            probability,
            stage,
            owner_id,
            billing_type,
            created_at,
            won_at,
            lost_at,
            loss_reason,
            account_data:accounts!deals_account_id_fkey(
                id,
                name,
                segment,
                relationship_type
            ),
            deal_products (
                id,
                name,
                quantity,
                unit_price
            )
        `)
        .eq('organization_id', organizationId);

    if (dealsError) {
        console.error('Error fetching deals for reports:', dealsError);
        return [];
    }

    // Fetch profiles to map owner names (since FK join is failing)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name');

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.full_name;
        return acc;
    }, {});

    return (deals || []).map((d: any) => ({
        ...d,
        owner: profileMap[d.owner_id] || d.owner || 'Desconhecido',
        segment: d.account_data?.segment || 'Não Definido',
        relationshipType: d.account_data?.relationship_type || 'Não Definido',
        products: d.deal_products
    }));
}
