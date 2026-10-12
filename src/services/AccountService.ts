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

    private static readonly aggregateFields = [
        'name', 'cnpj', 'ie', 'segment', 'status', 'zip', 'street',
        'number', 'complement', 'neighborhood', 'city', 'state',
        'tags', 'relationship_type', 'logo_url', 'payment_terms',
    ] as const;

    private static prepareAggregate(input: Partial<Account>, requireName: boolean) {
        this.validateAccountAggregate(input, requireName);
        const fields: Record<string, unknown> = {};
        const casing = new Set(['name', 'segment']);
        const address = new Set(['street', 'neighborhood', 'city', 'state']);
        for (const key of this.aggregateFields) {
            if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
            const value = input[key];
            if (value === undefined) continue;
            if (key === 'tags') {
                if (!Array.isArray(value) || value.length > 50 ||
                    value.some(tag => typeof tag !== 'string' || tag.length > 120)) {
                    throw new Error('Etiquetas inválidas.');
                }
                fields.tags = value;
                continue;
            }
            if (value !== null && typeof value !== 'string') {
                throw new Error('Campo da conta inválido.');
            }
            if (typeof value === 'string' && value.length > 500) {
                throw new Error('Campo da conta excede o limite.');
            }
            fields[key] = typeof value !== 'string' ? value :
                casing.has(key) ? normalizeCasing(value, 'name') :
                address.has(key) ? normalizeCasing(value, 'address') :
                key === 'cnpj' ? normalizeTaxId(value) :
                key === 'zip' ? normalizeZip(value) : value;
        }
        if (requireName) {
            fields.status ??= 'Ativo';
            fields.relationship_type ??= 'Cliente';
            fields.tags ??= [];
        }
        if (fields.status !== undefined &&
            fields.status !== 'Ativo' && fields.status !== 'Inativo') {
            throw new Error('Status da conta inválido.');
        }

        const serializeChildren = (children: Account['contacts'] | Account['branches'] | undefined,
            keys: readonly string[]): Record<string, unknown>[] | null => {
            if (children === undefined) return null;
            if (children.length > 100) throw new Error('Limite de registros relacionados excedido.');
            return children.map(child => {
                const raw = child as unknown as Record<string, unknown>;
                const record: Record<string, unknown> = {};
                for (const key of keys) {
                    if (raw[key] === undefined) continue;
                    if (key === 'is_primary') {
                        if (typeof raw[key] !== 'boolean') throw new Error('Indicador principal inválido.');
                    } else if (raw[key] !== null &&
                        (typeof raw[key] !== 'string' || (raw[key] as string).length > 500)) {
                        throw new Error('Dados de contatos ou filiais inválidos.');
                    }
                    record[key] = raw[key];
                }
                return record;
            });
        };
        return {
            fields,
            contacts: serializeChildren(input.contacts, [
                'name', 'email', 'mobile_phone', 'landline_phone', 'role', 'is_primary',
            ]),
            branches: serializeChildren(input.branches, [
                'name', 'zip', 'street', 'number', 'complement', 'neighborhood',
                'city', 'state', 'cnpj', 'ie', 'payment_terms',
            ]),
        };
    }

    private static isUuid(value: unknown): value is string {
        return typeof value === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }

    private static validRpcRow(data: unknown): data is { account_id: string; aggregate_revision: number }[] {
        return Array.isArray(data) && data.length === 1 &&
            Boolean(data[0]) && this.isUuid(data[0].account_id) &&
            Number.isSafeInteger(data[0].aggregate_revision) &&
            data[0].aggregate_revision > 0;
    }

    static async createAccount(userId: string, organizationId: string, account: Partial<Account>) {
        try {
            if (!this.isUuid(userId) || !this.isUuid(organizationId)) {
                throw new Error('Identificadores de conta inválidos.');
            }
            const input = this.prepareAggregate(account, true);
            // All three tables commit or roll back in one database transaction.
            const { data, error } = await createAdminClient().rpc('upsert_account_aggregate_atomic', {
                p_actor_id: userId,
                p_org_id: organizationId,
                p_account_id: null,
                p_expected_revision: null,
                p_fields: input.fields,
                p_contacts: input.contacts ?? [],
                p_branches: input.branches ?? [],
            });
            if (error || !this.validRpcRow(data)) throw new Error('account RPC did not confirm persistence');
            return { success: true, data: { id: data[0].account_id, aggregate_revision: data[0].aggregate_revision } };
        } catch {
            console.error('[AccountService] atomic account creation failed');
            return { success: false, error: 'Não foi possível salvar a conta.' };
        }
    }

    static async updateAccount(userId: string, organizationId: string, id: string, updates: Partial<Account>) {
        try {
            if (![userId, organizationId, id].every(this.isUuid)) {
                throw new Error('Identificadores de conta inválidos.');
            }
            if (!Number.isSafeInteger(updates?.aggregate_revision) ||
                (updates.aggregate_revision ?? 0) < 1) {
                throw new Error('Revisão da conta obrigatória.');
            }
            const input = this.prepareAggregate(updates, false);
            if (!Object.keys(input.fields).length &&
                input.contacts === null && input.branches === null) {
                throw new Error('Nenhuma alteração informada.');
            }
            const { data, error } = await createAdminClient().rpc('upsert_account_aggregate_atomic', {
                p_actor_id: userId,
                p_org_id: organizationId,
                p_account_id: id,
                p_expected_revision: updates.aggregate_revision,
                p_fields: input.fields,
                p_contacts: input.contacts,
                p_branches: input.branches,
            });
            if (error || !this.validRpcRow(data) || data[0].account_id !== id) {
                throw new Error('account RPC did not confirm update');
            }
            return { success: true, aggregate_revision: data[0].aggregate_revision };
        } catch {
            console.error('[AccountService] atomic account update failed or revision stale');
            return {
                success: false,
                error: 'Não foi possível atualizar a conta. Recarregue os dados antes de tentar novamente.',
            };
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
