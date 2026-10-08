import { createAdminClient } from '@/lib/supabase/admin';
import { type Account } from '@/types/account';
import { normalizeCasing, normalizeTaxId, normalizeZip } from '@/lib/string-utils';

export class AccountService {
    private static async cleanupCreatedAccount(
        supabase: ReturnType<typeof createAdminClient>,
        accountId: string,
        organizationId: string,
    ): Promise<boolean> {
        const [contactsResult, branchesResult] = await Promise.all([
            supabase.from('account_contacts').delete().eq('account_id', accountId).eq('organization_id', organizationId),
            supabase.from('account_branches').delete().eq('account_id', accountId).eq('organization_id', organizationId),
        ]);

        const { data: deletedAccount, error: accountError } = await supabase
            .from('accounts')
            .delete()
            .eq('id', accountId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        return !contactsResult.error && !branchesResult.error && !accountError && Boolean(deletedAccount);
    }

    static async getAccounts(userId: string, organizationId: string): Promise<Account[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('accounts')
            .select(`
                *,
                contacts:account_contacts(*),
                branches:account_branches(*)
            `)
            .eq('organization_id', organizationId)
            .order('name');

        if (error) {
            console.error('[AccountService] accounts fetch failed');
            throw new Error('Não foi possível carregar as contas.');
        }

        return data.map((acc: any) => ({
            ...acc,
            contacts: (acc.contacts || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                mobile_phone: c.mobile_phone,
                landline_phone: c.landline_phone,
                role: c.role,
                is_primary: c.is_primary
            })),
            tags: acc.tags || []
        }));
    }

    static async getSimpleAccounts(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (error) {
            console.error('[AccountService] accounts fetch failed');
            throw new Error('Não foi possível carregar as contas.');
        }

        return data || [];
    }

    static async getManufacturers(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .eq('relationship_type', 'Fabricante')
            .order('name', { ascending: true });

        if (error) {
            console.error('[AccountService] manufacturers fetch failed');
            throw new Error('Não foi possível carregar os fabricantes.');
        }

        return data || [];
    }

    static async createAccount(userId: string, organizationId: string, account: Partial<Account>) {
        const supabase = createAdminClient();
        let createdAccountId: string | null = null;

        try {
            const { data: accData, error: accError } = await supabase
                .from('accounts')
                .insert([{
                    organization_id: organizationId,
                    name: normalizeCasing(account.name, 'name'),
                    cnpj: normalizeTaxId(account.cnpj),
                    ie: account.ie,
                    segment: normalizeCasing(account.segment, 'name'),
                    status: account.status || 'Ativo',
                    zip: normalizeZip(account.zip),
                    street: normalizeCasing(account.street, 'address'),
                    number: account.number,
                    complement: account.complement,
                    neighborhood: normalizeCasing(account.neighborhood, 'address'),
                    city: normalizeCasing(account.city, 'address'),
                    state: normalizeCasing(account.state, 'address'),
                    tags: account.tags || [],
                    relationship_type: account.relationship_type || 'Cliente',
                    logo_url: account.logo_url || null,
                    payment_terms: account.payment_terms || null
                }])
                .select()
                .single();

            if (accError || !accData) throw accError || new Error('account insert returned no row');
            createdAccountId = accData.id;

            if (account.contacts && account.contacts.length > 0) {
                const contactsToInsert = account.contacts.map(contact => ({
                    account_id: createdAccountId,
                    organization_id: organizationId,
                    name: contact.name,
                    email: contact.email,
                    mobile_phone: contact.mobile_phone,
                    landline_phone: contact.landline_phone,
                    role: contact.role,
                    is_primary: contact.is_primary
                }));
                const { error: contactsError } = await supabase.from('account_contacts').insert(contactsToInsert);
                if (contactsError) throw contactsError;
            }

            if (account.branches && account.branches.length > 0) {
                const branchesToInsert = account.branches.map(branch => ({
                    account_id: createdAccountId,
                    organization_id: organizationId,
                    name: branch.name,
                    zip: branch.zip,
                    street: branch.street,
                    number: branch.number,
                    complement: branch.complement,
                    neighborhood: branch.neighborhood,
                    city: branch.city,
                    state: branch.state,
                    cnpj: branch.cnpj,
                    ie: branch.ie,
                    payment_terms: branch.payment_terms
                }));
                const { error: branchesError } = await supabase.from('account_branches').insert(branchesToInsert);
                if (branchesError) throw branchesError;
            }

            return { success: true, data: accData };
        } catch {
            console.error('[AccountService] account creation failed');
            if (createdAccountId) {
                const rolledBack = await this.cleanupCreatedAccount(supabase, createdAccountId, organizationId);
                if (!rolledBack) console.error('[AccountService] account creation rollback failed');
            }
            return { success: false, error: 'Não foi possível salvar a conta.' };
        }
    }

    static async updateAccount(userId: string, organizationId: string, id: string, updates: Partial<Account>) {
        const supabase = createAdminClient();

        try {
            const { error: accError } = await supabase
                .from('accounts')
                .update({
                    name: normalizeCasing(updates.name, 'name'),
                    cnpj: normalizeTaxId(updates.cnpj),
                    ie: updates.ie,
                    segment: normalizeCasing(updates.segment, 'name'),
                    status: updates.status,
                    zip: normalizeZip(updates.zip),
                    street: normalizeCasing(updates.street, 'address'),
                    number: updates.number,
                    complement: updates.complement,
                    neighborhood: normalizeCasing(updates.neighborhood, 'address'),
                    city: normalizeCasing(updates.city, 'address'),
                    state: normalizeCasing(updates.state, 'address'),
                    tags: updates.tags,
                    relationship_type: updates.relationship_type,
                    logo_url: updates.logo_url,
                    payment_terms: updates.payment_terms
                })
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (accError) throw accError;

            if (updates.contacts) {
                await supabase
                    .from('account_contacts')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);

                if (updates.contacts.length > 0) {
                    const contactsToInsert = updates.contacts.map(c => ({
                        account_id: id,
                        organization_id: organizationId,
                        name: c.name,
                        email: c.email,
                        mobile_phone: c.mobile_phone,
                        landline_phone: c.landline_phone,
                        role: c.role,
                        is_primary: c.is_primary
                    }));
                    await supabase.from('account_contacts').insert(contactsToInsert);
                }
            }

            if (updates.branches) {
                await supabase
                    .from('account_branches')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);

                if (updates.branches.length > 0) {
                    const branchesToInsert = updates.branches.map(b => ({
                        account_id: id,
                        organization_id: organizationId,
                        name: b.name,
                        zip: b.zip,
                        street: b.street,
                        number: b.number,
                        complement: b.complement,
                        neighborhood: b.neighborhood,
                        city: b.city,
                        state: b.state,
                        cnpj: b.cnpj,
                        ie: b.ie,
                        payment_terms: b.payment_terms
                    }));
                    await supabase.from('account_branches').insert(branchesToInsert);
                }
            }

            return { success: true };
        } catch {
            console.error('[AccountService] account update failed');
            return { success: false, error: 'Não foi possível atualizar a conta.' };
        }
    }

    static async deleteAccount(userId: string, organization_id: string, id: string) {
        const supabase = createAdminClient();
        try {
            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id)
                .eq('organization_id', organization_id);
            if (error) throw error;
            return { success: true };
        } catch {
            console.error('[AccountService] account deletion failed');
            return { success: false, error: 'Não foi possível excluir a conta.' };
        }
    }

    static async bulkCreateAccounts(userId: string, organizationId: string, accounts: any[]) {
        const supabase = createAdminClient();
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const account of accounts) {
            try {
                // 1. Upsert Account by CNPJ
                const { data: accData, error: accError } = await supabase
                    .from('accounts')
                    .upsert({
                        organization_id: organizationId,
                        name: normalizeCasing(account.name, 'name'),
                        cnpj: normalizeTaxId(account.cnpj),
                        ie: account.ie || null,
                        segment: normalizeCasing(account.segment, 'name') || 'Outros',
                        status: account.status || 'Ativo',
                        zip: normalizeZip(account.zip) || null,
                        street: normalizeCasing(account.street, 'address') || null,
                        number: account.number || null,
                        complement: account.complement || null,
                        neighborhood: normalizeCasing(account.neighborhood, 'address') || null,
                        city: normalizeCasing(account.city, 'address') || null,
                        state: normalizeCasing(account.state, 'address') || null,
                        relationship_type: account.relationship_type || 'Cliente'
                    }, { onConflict: 'cnpj, organization_id' })
                    .select()
                    .single();

                if (accError) throw accError;

                const accId = accData.id;
                
                // Determine if it was an update or create (simplified check)
                if (accData.created_at === accData.updated_at) results.created++;
                else results.updated++;

                // 2. Handle Contacts
                if (account.contacts && account.contacts.length > 0) {
                    for (const contact of account.contacts) {
                        // Upsert Contact by Email (if exists) or just insert
                        const contactPayload = {
                            account_id: accId,
                            organization_id: organizationId,
                            name: contact.name,
                            email: contact.email || null,
                            mobile_phone: contact.mobile_phone || null,
                            landline_phone: contact.landline_phone || null,
                            role: contact.role || null,
                            is_primary: !!contact.is_primary
                        };

                        if (contact.email) {
                            await supabase.from('account_contacts').upsert(contactPayload, { onConflict: 'email, organization_id' });
                        } else {
                            await supabase.from('account_contacts').insert(contactPayload);
                        }
                    }
                }
            } catch {
                results.failed++;
                results.errors.push('Não foi possível importar esta conta.');
            }
        }

        return results;
    }
}
