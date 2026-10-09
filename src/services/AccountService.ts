import { createAdminClient } from '../lib/supabase/admin';
import { type Account } from '../types/account';
import { normalizeCasing, normalizeTaxId, normalizeZip } from '../lib/string-utils';

export class AccountService {
    private static validateAccountAggregate(
        input: Partial<Account>,
        requireName: boolean,
    ): void {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Dados de conta inválidos.');
        }
        if ((requireName || input.name !== undefined) &&
            (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 250)) {
            throw new Error('Nome da conta inválido.');
        }
        for (const field of ['contacts', 'branches'] as const) {
            const children = input[field];
            if (children === undefined) continue;
            if (!Array.isArray(children) || children.some(child =>
                !child || typeof child !== 'object' ||
                typeof child.name !== 'string' || !child.name.trim()
            )) {
                throw new Error('Dados de contatos ou filiais inválidos.');
            }
        }
    }

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

        if (error || !Array.isArray(data)) {
            console.error('[AccountService] accounts fetch failed');
            throw new Error('Não foi possível carregar as contas.');
        }

        return data.map((rawAccount: unknown) => {
            const account = rawAccount as Record<string, unknown>;
            const rawContacts = Array.isArray(account.contacts) ? account.contacts : [];
            return {
                ...account,
                contacts: rawContacts.map((rawContact: unknown) => {
                    const contact = rawContact as Record<string, unknown>;
                    return {
                        id: contact.id,
                        name: contact.name,
                        email: contact.email,
                        mobile_phone: contact.mobile_phone,
                        landline_phone: contact.landline_phone,
                        role: contact.role,
                        is_primary: contact.is_primary
                    };
                }),
                tags: Array.isArray(account.tags) ? account.tags : []
            } as unknown as Account;
        });
    }

    static async getSimpleAccounts(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (error || !Array.isArray(data)) {
            console.error('[AccountService] accounts fetch failed');
            throw new Error('Não foi possível carregar as contas.');
        }

        return data;
    }

    static async getManufacturers(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .eq('relationship_type', 'Fabricante')
            .order('name', { ascending: true });

        if (error || !Array.isArray(data)) {
            console.error('[AccountService] manufacturers fetch failed');
            throw new Error('Não foi possível carregar os fabricantes.');
        }

        return data;
    }

    static async createAccount(userId: string, organizationId: string, account: Partial<Account>) {
        const supabase = createAdminClient();
        let createdAccountId: string | null = null;

        try {
            this.validateAccountAggregate(account, true);
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
        let previousContacts: Record<string, unknown>[] | null = null;
        let previousBranches: Record<string, unknown>[] | null = null;

        const restoreChildren = async (): Promise<boolean> => {
            let restored = true;

            if (previousContacts) {
                const { error: deleteContactsError } = await supabase
                    .from('account_contacts')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);
                if (deleteContactsError) restored = false;
                if (!deleteContactsError && previousContacts.length > 0) {
                    const { error: restoreContactsError } = await supabase
                        .from('account_contacts')
                        .insert(previousContacts);
                    if (restoreContactsError) restored = false;
                }
            }

            if (previousBranches) {
                const { error: deleteBranchesError } = await supabase
                    .from('account_branches')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);
                if (deleteBranchesError) restored = false;
                if (!deleteBranchesError && previousBranches.length > 0) {
                    const { error: restoreBranchesError } = await supabase
                        .from('account_branches')
                        .insert(previousBranches);
                    if (restoreBranchesError) restored = false;
                }
            }

            return restored;
        };

        try {
            this.validateAccountAggregate(updates, false);
            const { data: existingAccount, error: existingAccountError } = await supabase
                .from('accounts')
                .select('id')
                .eq('id', id)
                .eq('organization_id', organizationId)
                .maybeSingle();

            if (existingAccountError || !existingAccount) {
                throw existingAccountError || new Error('account not found');
            }

            if (updates.contacts !== undefined) {
                const { data: contactsSnapshot, error: contactsSnapshotError } = await supabase
                    .from('account_contacts')
                    .select('id, account_id, organization_id, name, email, mobile_phone, landline_phone, role, is_primary')
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);
                if (contactsSnapshotError || !Array.isArray(contactsSnapshot)) {
                    throw contactsSnapshotError || new Error('contact snapshot returned invalid data');
                }
                previousContacts = contactsSnapshot as Record<string, unknown>[];

                const { data: deletedContacts, error: deleteContactsError } = await supabase
                    .from('account_contacts')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId)
                    .select('id');
                if (deleteContactsError || (deletedContacts || []).length !== previousContacts.length) {
                    throw deleteContactsError || new Error('contact replacement deleted an unexpected number of rows');
                }

                if (updates.contacts.length > 0) {
                    const contactsToInsert = updates.contacts.map(contact => ({
                        account_id: id,
                        organization_id: organizationId,
                        name: contact.name,
                        email: contact.email,
                        mobile_phone: contact.mobile_phone,
                        landline_phone: contact.landline_phone,
                        role: contact.role,
                        is_primary: contact.is_primary
                    }));
                    const { error: contactsInsertError } = await supabase
                        .from('account_contacts')
                        .insert(contactsToInsert);
                    if (contactsInsertError) throw contactsInsertError;
                }
            }

            if (updates.branches !== undefined) {
                const { data: branchesSnapshot, error: branchesSnapshotError } = await supabase
                    .from('account_branches')
                    .select('id, account_id, organization_id, name, zip, street, number, complement, neighborhood, city, state, cnpj, ie, payment_terms')
                    .eq('account_id', id)
                    .eq('organization_id', organizationId);
                if (branchesSnapshotError || !Array.isArray(branchesSnapshot)) {
                    throw branchesSnapshotError || new Error('branch snapshot returned invalid data');
                }
                previousBranches = branchesSnapshot as Record<string, unknown>[];

                const { data: deletedBranches, error: deleteBranchesError } = await supabase
                    .from('account_branches')
                    .delete()
                    .eq('account_id', id)
                    .eq('organization_id', organizationId)
                    .select('id');
                if (deleteBranchesError || (deletedBranches || []).length !== previousBranches.length) {
                    throw deleteBranchesError || new Error('branch replacement deleted an unexpected number of rows');
                }

                if (updates.branches.length > 0) {
                    const branchesToInsert = updates.branches.map(branch => ({
                        account_id: id,
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
                    const { error: branchesInsertError } = await supabase
                        .from('account_branches')
                        .insert(branchesToInsert);
                    if (branchesInsertError) throw branchesInsertError;
                }
            }

            const accountUpdates: Record<string, unknown> = {};
            const setIfPresent = (key: keyof Account, value: unknown) => {
                if (Object.prototype.hasOwnProperty.call(updates, key)) accountUpdates[key] = value;
            };
            setIfPresent('name', normalizeCasing(updates.name, 'name'));
            setIfPresent('cnpj', normalizeTaxId(updates.cnpj));
            setIfPresent('ie', updates.ie);
            setIfPresent('segment', normalizeCasing(updates.segment, 'name'));
            setIfPresent('status', updates.status);
            setIfPresent('zip', normalizeZip(updates.zip));
            setIfPresent('street', normalizeCasing(updates.street, 'address'));
            setIfPresent('number', updates.number);
            setIfPresent('complement', updates.complement);
            setIfPresent('neighborhood', normalizeCasing(updates.neighborhood, 'address'));
            setIfPresent('city', normalizeCasing(updates.city, 'address'));
            setIfPresent('state', normalizeCasing(updates.state, 'address'));
            setIfPresent('tags', updates.tags);
            setIfPresent('relationship_type', updates.relationship_type);
            setIfPresent('logo_url', updates.logo_url);
            setIfPresent('payment_terms', updates.payment_terms);

            if (Object.keys(accountUpdates).length > 0) {
                const { data: updatedAccount, error: accError } = await supabase
                    .from('accounts')
                    .update(accountUpdates)
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .select('id')
                    .maybeSingle();

                if (accError || !updatedAccount) {
                    throw accError || new Error('account update returned no row');
                }
            }

            return { success: true };
        } catch {
            console.error('[AccountService] account update failed');
            if (previousContacts || previousBranches) {
                const restored = await restoreChildren();
                if (!restored) console.error('[AccountService] account child restoration failed');
            }
            return { success: false, error: 'Não foi possível atualizar a conta.' };
        }
    }

    static async deleteAccount(userId: string, organization_id: string, id: string) {
        const supabase = createAdminClient();
        try {
            const { data: deleted, error } = await supabase
                .from('accounts')
                .delete()
                .eq('id', id)
                .eq('organization_id', organization_id)
                .select('id')
                .maybeSingle();
            if (error || !deleted) throw error || new Error('account deletion returned no row');
            return { success: true };
        } catch {
            console.error('[AccountService] account deletion failed');
            return { success: false, error: 'Não foi possível excluir a conta.' };
        }
    }

    static async bulkCreateAccounts(userId: string, organizationId: string, accounts: unknown[]) {
        const supabase = createAdminClient();
        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const rawAccount of accounts) {
            try {
                if (!rawAccount || typeof rawAccount !== 'object' || Array.isArray(rawAccount)) {
                    throw new Error('invalid account import row');
                }
                const account = rawAccount as Record<string, unknown>;
                const accountName = typeof account.name === 'string' ? account.name : '';
                const accountCnpj = typeof account.cnpj === 'string' ? account.cnpj : '';
                const normalizedCnpj = normalizeTaxId(accountCnpj);
                const contacts = Array.isArray(account.contacts) ? account.contacts : [];

                let existingAccountId: string | null = null;
                if (normalizedCnpj) {
                    const { data: existingAccount, error: existingAccountError } = await supabase
                        .from('accounts')
                        .select('id')
                        .eq('cnpj', normalizedCnpj)
                        .eq('organization_id', organizationId)
                        .maybeSingle();
                    if (existingAccountError) throw existingAccountError;
                    existingAccountId = existingAccount ? String(existingAccount.id) : null;
                }

                for (const rawContact of contacts) {
                    if (!rawContact || typeof rawContact !== 'object' || Array.isArray(rawContact)) {
                        throw new Error('invalid account contact import row');
                    }
                    const contact = rawContact as Record<string, unknown>;
                    const email = typeof contact.email === 'string' && contact.email.trim()
                        ? contact.email.trim()
                        : null;
                    if (!email) continue;

                    const { data: existingContact, error: contactLookupError } = await supabase
                        .from('account_contacts')
                        .select('id, account_id')
                        .eq('email', email)
                        .eq('organization_id', organizationId)
                        .maybeSingle();
                    if (contactLookupError) throw contactLookupError;
                    if (existingContact && (!existingAccountId || String(existingContact.account_id) !== existingAccountId)) {
                        throw new Error('contact email already belongs to another account');
                    }
                }

                const { data: accData, error: accError } = await supabase
                    .from('accounts')
                    .upsert({
                        organization_id: organizationId,
                        name: normalizeCasing(accountName, 'name'),
                        cnpj: normalizedCnpj,
                        ie: account.ie || null,
                        segment: normalizeCasing(typeof account.segment === 'string' ? account.segment : '', 'name') || 'Outros',
                        status: account.status || 'Ativo',
                        zip: normalizeZip(typeof account.zip === 'string' ? account.zip : '') || null,
                        street: normalizeCasing(typeof account.street === 'string' ? account.street : '', 'address') || null,
                        number: account.number || null,
                        complement: account.complement || null,
                        neighborhood: normalizeCasing(typeof account.neighborhood === 'string' ? account.neighborhood : '', 'address') || null,
                        city: normalizeCasing(typeof account.city === 'string' ? account.city : '', 'address') || null,
                        state: normalizeCasing(typeof account.state === 'string' ? account.state : '', 'address') || null,
                        relationship_type: account.relationship_type || 'Cliente'
                    }, { onConflict: 'cnpj, organization_id' })
                    .select()
                    .single();

                if (accError || !accData) throw accError || new Error('account upsert returned no row');

                const accId = String(accData.id);
                for (const rawContact of contacts) {
                    if (!rawContact || typeof rawContact !== 'object' || Array.isArray(rawContact)) {
                        throw new Error('invalid account contact import row');
                    }
                    const contact = rawContact as Record<string, unknown>;
                    const email = typeof contact.email === 'string' && contact.email.trim()
                        ? contact.email.trim()
                        : null;
                    const contactPayload = {
                        account_id: accId,
                        organization_id: organizationId,
                        name: typeof contact.name === 'string' ? contact.name : '',
                        email,
                        mobile_phone: contact.mobile_phone || null,
                        landline_phone: contact.landline_phone || null,
                        role: contact.role || null,
                        is_primary: Boolean(contact.is_primary)
                    };

                    if (email) {
                        const { data: existingContact, error: contactLookupError } = await supabase
                            .from('account_contacts')
                            .select('id, account_id')
                            .eq('email', email)
                            .eq('organization_id', organizationId)
                            .maybeSingle();
                        if (contactLookupError) throw contactLookupError;

                        if (existingContact && String(existingContact.account_id) !== accId) {
                            throw new Error('contact email already belongs to another account');
                        }

                        if (existingContact) {
                            const { data: updatedContact, error: contactUpdateError } = await supabase
                                .from('account_contacts')
                                .update(contactPayload)
                                .eq('id', existingContact.id)
                                .eq('organization_id', organizationId)
                                .select('id')
                                .maybeSingle();
                            if (contactUpdateError || !updatedContact) {
                                throw contactUpdateError || new Error('contact update returned no row');
                            }
                        } else {
                            const { data: insertedContact, error: contactInsertError } = await supabase
                                .from('account_contacts')
                                .insert(contactPayload)
                                .select('id')
                                .maybeSingle();
                            if (contactInsertError || !insertedContact) {
                                throw contactInsertError || new Error('contact insert returned no row');
                            }
                        }
                    } else {
                        const { data: insertedContact, error: contactInsertError } = await supabase
                            .from('account_contacts')
                            .insert(contactPayload)
                            .select('id')
                            .maybeSingle();
                        if (contactInsertError || !insertedContact) {
                            throw contactInsertError || new Error('contact insert returned no row');
                        }
                    }
                }

                if (existingAccountId) results.updated++;
                else results.created++;
            } catch {
                results.failed++;
                results.errors.push('Não foi possível importar esta conta.');
            }
        }

        return results;
    }

}
