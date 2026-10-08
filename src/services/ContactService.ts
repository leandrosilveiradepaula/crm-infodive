import { createAdminClient } from '../lib/supabase/admin';
import { Contact } from '../types/contact';
import { normalizeCasing, normalizePhone } from '../lib/string-utils';

export class ContactService {
    private static async assertAccountInOrganization(
        supabase: ReturnType<typeof createAdminClient>,
        organizationId: string,
        accountId?: string | null,
    ) {
        if (!accountId) return;

        const { data: account, error } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', accountId)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error || !account) {
            throw new Error('A conta vinculada ao contato é inválida.');
        }
    }

    private static async attachTenantAccounts(
        supabase: ReturnType<typeof createAdminClient>,
        organizationId: string,
        contacts: Record<string, unknown>[],
    ): Promise<Record<string, unknown>[]> {
        const accountIds = [...new Set(
            contacts
                .map(contact => contact.account_id)
                .filter((value): value is string => typeof value === 'string' && Boolean(value))
        )];

        if (accountIds.length === 0) return contacts;

        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('id, name')
            .eq('organization_id', organizationId)
            .in('id', accountIds);

        if (error) {
            throw new Error('Não foi possível carregar as contas dos contatos.');
        }

        const accountMap = new Map(
            (accounts || []).map(account => [String(account.id), account])
        );

        return contacts.map(contact => ({
            ...contact,
            account: typeof contact.account_id === 'string'
                ? accountMap.get(contact.account_id) || null
                : null,
        }));
    }

    private static async assertUniqueContact(
        supabase: ReturnType<typeof createAdminClient>,
        organizationId: string,
        values: { email?: string | null; mobilePhone?: string | null },
        excludeId?: string,
    ) {
        for (const candidate of [
            { column: 'email', value: values.email },
            { column: 'mobile_phone', value: values.mobilePhone },
        ]) {
            if (!candidate.value) continue;

            let query = supabase
                .from('account_contacts')
                .select('id')
                .eq('organization_id', organizationId)
                .eq(candidate.column, candidate.value);

            if (excludeId) query = query.neq('id', excludeId);

            const { data, error } = await query.limit(1);
            if (error) {
                throw new Error('Não foi possível validar a duplicidade do contato.');
            }
            if (data && data.length > 0) {
                throw new Error('Já existe um contato com estes dados.');
            }
        }
    }

    static async getContacts(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('account_contacts')
            .select('*')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (error) return { contacts: [], error: 'Não foi possível carregar os contatos.' };

        try {
            const contacts = await this.attachTenantAccounts(
                supabase,
                organizationId,
                (data || []) as Record<string, unknown>[],
            );
            return { contacts: contacts as unknown as Contact[], error: null };
        } catch {
            return { contacts: [], error: 'Não foi possível carregar os contatos.' };
        }
    }

    static async getAccountContacts(userId: string, organizationId: string, accountId?: string | null) {
        const supabase = createAdminClient();

        if (accountId) {
            await this.assertAccountInOrganization(supabase, organizationId, accountId);
        }

        let query = supabase
            .from('account_contacts')
            .select(`
                id,
                account_id,
                organization_id,
                name,
                email,
                mobile_phone,
                landline_phone,
                role,
                is_primary
            `)
            .eq('organization_id', organizationId)
            .order('name');

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[ContactService] account contacts fetch failed');
            throw new Error('Não foi possível carregar os contatos.');
        }

        return await this.attachTenantAccounts(
            supabase,
            organizationId,
            (data || []) as Record<string, unknown>[],
        );
    }

    static async createContact(userId: string, organizationId: string, contact: Partial<Contact>) {
        const supabase = createAdminClient();
        const email = typeof contact.email === 'string' ? contact.email.trim() : undefined;
        const mobilePhone = normalizePhone(contact.mobile_phone);

        await this.assertAccountInOrganization(supabase, organizationId, contact.account_id);
        await this.assertUniqueContact(supabase, organizationId, {
            email,
            mobilePhone,
        });

        const normalizedContact = {
            name: normalizeCasing(contact.name, 'name'),
            email: email || null,
            mobile_phone: mobilePhone || null,
            landline_phone: normalizePhone(contact.landline_phone) || null,
            role: contact.role || null,
            linkedin: contact.linkedin || null,
            account_id: contact.account_id || null,
            is_primary: Boolean(contact.is_primary),
            organization_id: organizationId,
        };

        const { data, error } = await supabase
            .from('account_contacts')
            .insert([normalizedContact])
            .select()
            .single();

        if (error) return { success: false, error: 'Não foi possível salvar o contato.' };
        return { success: true, data };
    }

    static async updateContact(userId: string, id: string, organizationId: string, updates: Partial<Contact>) {
        const supabase = createAdminClient();
        const normalizedUpdates: Record<string, unknown> = {};

        if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
            normalizedUpdates.name = normalizeCasing(updates.name, 'name');
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'email')) {
            normalizedUpdates.email = typeof updates.email === 'string' ? updates.email.trim() : null;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'mobile_phone')) {
            normalizedUpdates.mobile_phone = normalizePhone(updates.mobile_phone) || null;
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'landline_phone')) {
            normalizedUpdates.landline_phone = normalizePhone(updates.landline_phone) || null;
        }
        for (const key of ['role', 'linkedin', 'is_primary'] as const) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                normalizedUpdates[key] = updates[key] ?? null;
            }
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'account_id')) {
            const accountId = updates.account_id || null;
            await this.assertAccountInOrganization(supabase, organizationId, accountId);
            normalizedUpdates.account_id = accountId;
        }

        if (Object.keys(normalizedUpdates).length === 0) {
            throw new Error('Nenhuma alteração válida foi informada para o contato.');
        }

        await this.assertUniqueContact(
            supabase,
            organizationId,
            {
                email: Object.prototype.hasOwnProperty.call(normalizedUpdates, 'email')
                    ? String(normalizedUpdates.email || '')
                    : undefined,
                mobilePhone: Object.prototype.hasOwnProperty.call(normalizedUpdates, 'mobile_phone')
                    ? String(normalizedUpdates.mobile_phone || '')
                    : undefined,
            },
            id,
        );

        const { data, error } = await supabase
            .from('account_contacts')
            .update(normalizedUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (error || !data) throw new Error('Não foi possível atualizar o contato.');
        return { success: true };
    }

    static async deleteContact(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('account_contacts')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (error || !data) throw new Error('Não foi possível excluir o contato.');
        return { success: true };
    }
}
