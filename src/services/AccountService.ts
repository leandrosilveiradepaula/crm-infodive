import { createAdminClient } from '@/lib/supabase/admin';
import { type Account } from '@/types/account';
import { normalizeCasing, normalizeTaxId, normalizeZip } from '@/lib/string-utils';

export class AccountService {
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
            console.error('Error fetching accounts:', error);
            return [];
        }

        return data.map((acc: any) => ({
            ...acc,
            contacts: (acc.contacts || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                email: c.email,
                mobile: c.mobile_phone,
                landline: c.landline_phone,
                role: c.role,
                isPrimary: c.is_primary
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
            console.error('Error fetching accounts:', error);
            return [];
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
            console.error('Error fetching manufacturers:', error);
            return [];
        }

        return data || [];
    }

    static async createAccount(userId: string, organizationId: string, account: Partial<Account>) {
        const supabase = createAdminClient();

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

            if (accError) throw accError;
            const newAccId = accData.id;

            if (account.contacts && account.contacts.length > 0) {
                const contactsToInsert = account.contacts.map(c => ({
                    account_id: newAccId,
                    organization_id: organizationId,
                    name: c.name,
                    email: c.email,
                    mobile_phone: c.mobile,
                    landline_phone: c.landline,
                    role: c.role,
                    is_primary: c.isPrimary
                }));
                await supabase.from('account_contacts').insert(contactsToInsert);
            }

            if (account.branches && account.branches.length > 0) {
                const branchesToInsert = account.branches.map(b => ({
                    account_id: newAccId,
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

            return { success: true, data: accData };
        } catch (error: any) {
            console.error('Error creating account:', error);
            return { success: false, error: error.message };
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
                        mobile_phone: c.mobile,
                        landline_phone: c.landline,
                        role: c.role,
                        is_primary: c.isPrimary
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
        } catch (error: any) {
            console.error('Error updating account:', error);
            return { success: false, error: error.message };
        }
    }

    static async deleteAccount(userId: string, organizationId: string, id: string) {
        const supabase = createAdminClient();
        try {
            const { error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId);
            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error deleting account:', error);
            return { success: false, error: error.message };
        }
    }
}
