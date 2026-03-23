'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireSessionContext } from '@/lib/auth-server';

export async function getContactSuggestions() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('contact_suggestions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
    return data;
}

export async function rejectContactSuggestion(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('contact_suggestions')
        .update({ status: 'rejected' })
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard');
}

export async function ignoreContactForever(id: string, email: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    // 1. Inserir na Blacklist
    const { error: blockError } = await supabase
        .from('contact_blacklists')
        .insert([{
            organization_id: organizationId,
            email: email
        }]);

    if (blockError && blockError.code !== '23505') throw blockError;

    // 2. Marcar como descartado
    await supabase
        .from('contact_suggestions')
        .update({ status: 'rejected' })
        .eq('id', id)
        .eq('organization_id', organizationId);

    revalidatePath('/dashboard');
}

export async function approveContactSuggestion(
    suggestionId: string,
    contactData: Record<string, any>,
    accountIdToBind: string | null,
    isCreatingNewAccount: boolean,
    newAccountData: { name: string; cnpj: string; ie: string; }
) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    let accountId = accountIdToBind;

    if (isCreatingNewAccount) {
        const { data: newAccount, error: accountError } = await supabase
            .from('accounts')
            .insert([{
                ...newAccountData,
                organization_id: organizationId
            }])
            .select()
            .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
    }

    if (!accountId) throw new Error('Account ID is required for linking contact.');

    const { error: insertError } = await supabase
        .from('account_contacts')
        .insert([{
            account_id: accountId,
            ...contactData,
            organization_id: organizationId
        }]);

    if (insertError) throw insertError;

    await supabase
        .from('contact_suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestionId)
        .eq('organization_id', organizationId);

    revalidatePath('/dashboard');
    return true;
}

export async function getAccountsForSelect() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    
    // Using admin client but scoped by organizationId for security
    const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');
        
    if (error) {
        console.error('Error fetching accounts for suggestions:', error);
        return [];
    }
    
    return data;
}
