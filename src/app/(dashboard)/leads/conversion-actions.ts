'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Lead } from '@/types/lead';
import { revalidatePath } from 'next/cache';
import { Account } from '@/types/account';
import { Deal } from '@/types/deal';
import { requireSessionContext } from '@/lib/auth-server';

import { LeadService } from '@/services/LeadService';

export async function convertLeadToDeal(leadId: string, conversionData: Partial<Lead>, accountId?: string, contactId?: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await LeadService.convertLeadToDeal(userId, organizationId, leadId, conversionData, accountId, contactId);

    revalidatePath('/leads');
    revalidatePath('/customers');
    revalidatePath('/pipeline');

    return result;
}

export async function getAccountDetails(accountId: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
        .from('accounts')
        .select('id, name, cnpj, ie, zip, street, number, complement, neighborhood, city, state')
        .eq('id', accountId)
        .eq('organization_id', organizationId)
        .single();
        
    if (error) {
        console.error('Error fetching account details:', error);
        throw new Error('Erro ao buscar detalhes da empresa.');
    }
    
    return data;
}
