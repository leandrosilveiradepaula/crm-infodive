import { createAdminClient } from '@/lib/supabase/admin';
import { Contact } from '@/types/contact';
import { normalizeCasing, normalizePhone } from '@/lib/string-utils';

export class ContactService {
    static async getContacts(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('account_contacts')
            .select('*, account:accounts!account_contacts_account_id_fkey(name)')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (error) return { contacts: [], error: error.message };
        return { contacts: data as Contact[], error: null };
    }

    /**
     * Fetches all contacts for a given organization.
     * Optionally filters by account_id — returns all if no accountId provided.
     */
    static async getAccountContacts(userId: string, organizationId: string, accountId?: string | null) {
        const supabase = createAdminClient();

        let query = supabase
            .from('account_contacts')
            .select(`
                id, 
                account_id, 
                name, 
                email, 
                mobile_phone, 
                landline_phone, 
                role, 
                is_primary, 
                account:accounts(id, name)
            `)
            .eq('organization_id', organizationId)
            .order('name');

        if (accountId) {
            query = query.eq('account_id', accountId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching account contacts:', error.message);
            return [];
        }
        return data || [];
    }

    static async createContact(userId: string, organizationId: string, contact: Partial<Contact>) {
        const supabase = createAdminClient();

        const { organization_id, created_at, updated_at, account, ...contactData } = contact;

        if (contactData.email || contactData.mobile_phone) {
            let query = supabase
                .from('account_contacts')
                .select('id, name, email, mobile_phone')
                .eq('organization_id', organizationId);

            const conditions: string[] = [];
            if (contactData.email) conditions.push(`email.eq.${contactData.email}`);
            if (contactData.mobile_phone) conditions.push(`mobile_phone.eq.${contactData.mobile_phone}`);

            if (conditions.length > 0) {
                query = query.or(conditions.join(','));
                const { data: existingContacts } = await query;

                if (existingContacts && existingContacts.length > 0) {
                    const match = existingContacts[0];
                    if (match.email === contactData.email) {
                        return { success: false, error: `Já existe um contato com o email ${contactData.email}` };
                    }
                    if (match.mobile_phone === contactData.mobile_phone) {
                        return { success: false, error: `Já existe um contato com o celular ${contactData.mobile_phone}` };
                    }
                    return { success: false, error: 'Contato duplicado encontrado.' };
                }
            }
        }

        const normalizedContact = {
            ...contactData,
            name: normalizeCasing(contactData.name, 'name'),
            mobile_phone: normalizePhone(contactData.mobile_phone),
            landline_phone: normalizePhone(contactData.landline_phone),
            organization_id: organizationId
        };

        const { data, error } = await supabase
            .from('account_contacts')
            .insert([normalizedContact])
            .select()
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    }

    static async updateContact(userId: string, id: string, organizationId: string, updates: Partial<Contact>) {
        const supabase = createAdminClient();

        const { organization_id: _, created_at, updated_at, account, ...cleanUpdates } = updates;
        const normalizedUpdates = { ...cleanUpdates };
        if (cleanUpdates.name) normalizedUpdates.name = normalizeCasing(cleanUpdates.name, 'name');
        if (cleanUpdates.mobile_phone) normalizedUpdates.mobile_phone = normalizePhone(cleanUpdates.mobile_phone);
        if (cleanUpdates.landline_phone) normalizedUpdates.landline_phone = normalizePhone(cleanUpdates.landline_phone);

        const { error } = await supabase
            .from('account_contacts')
            .update(normalizedUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    static async deleteContact(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('account_contacts')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw new Error(error.message);
        return { success: true };
    }
}
