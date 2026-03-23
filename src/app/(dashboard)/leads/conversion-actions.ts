'use server';

import { createClient } from '@/lib/supabase/server';
import { Lead } from '@/types/lead';
import { revalidatePath } from 'next/cache';
import { Account } from '@/types/account';
import { Deal } from '@/types/deal';
import { requireSessionContext } from '@/lib/auth-server';

import { LeadService } from '@/services/LeadService';

export async function convertLeadToDeal(leadId: string, conversionData: Partial<Lead>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await LeadService.convertLeadToDeal(userId, organizationId, leadId, conversionData);

    revalidatePath('/leads');
    revalidatePath('/customers');
    revalidatePath('/pipeline');

    return result;
}
