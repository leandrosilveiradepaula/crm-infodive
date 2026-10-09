import { createAdminClient } from '../lib/supabase/admin';
import { Contact } from '../types/contact';
import { normalizeCasing, normalizePhone } from '../lib/string-utils';

export class ContactService {
    private static async assertAccountInTenant(
        supabase: ReturnType<typeof createAdminClient>, accountId: string, organizationId: string,
    ): Promise<void> {
        if (typeof accountId !== 'string' || !accountId.trim()) throw new Error('Conta inválida.');
        const { data, error } = await supabase.from('accounts').select('id')
            .eq('id', accountId).eq('organization_id', organizationId).maybeSingle();
        if (error || !data) throw new Error('Conta não encontrada nesta organização.');
    }

    private static writable(input: Partial<Contact>): Record<string, unknown> {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Contato inválido.');
        const fields = ['name', 'email', 'mobile_phone', 'landline_phone', 'role', 'is_primary', 'account_id'] as const;
        const result: Record<string, unknown> = {};
        for (const field of fields) if (Object.prototype.hasOwnProperty.call(input, field)) {
            result[field] = input[field];
        }
        if (result.name !== undefined) {
            if (typeof result.name !== 'string' || !result.name.trim() || result.name.length > 250) throw new Error('Nome inválido.');
            result.name = normalizeCasing(result.name, 'name');
        }
        for (const key of ['email', 'mobile_phone', 'landline_phone', 'role'] as const) {
            if (result[key] !== undefined && result[key] !== null &&
                (typeof result[key] !== 'string' ||
                 result[key].length > (key === 'email' ? 320 : key === 'role' ? 200 : 64)))
                throw new Error('Campo de contato inválido.');
        }
        if (result.is_primary !== undefined && typeof result.is_primary !== 'boolean')
            throw new Error('Indicador principal inválido.');
        if (result.account_id !== undefined && (typeof result.account_id !== 'string' || !result.account_id.trim()))
            throw new Error('Conta inválida.');
        if (typeof result.mobile_phone === 'string') result.mobile_phone = normalizePhone(result.mobile_phone);
        if (typeof result.landline_phone === 'string') result.landline_phone = normalizePhone(result.landline_phone);
        return result;
    }
    static async getContacts(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('account_contacts')
            .select('*, account:accounts!account_contacts_account_id_fkey(name)')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (error || !Array.isArray(data)) return { contacts: [], error: 'Não foi possível carregar os contatos.' };
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

        if (error || !Array.isArray(data)) {
            console.error('[ContactService] account contacts fetch failed');
            throw new Error('Não foi possível carregar os contatos.');
        }
        return data;
    }

    static async createContact(userId: string, organizationId: string, contact: Partial<Contact>) {
        const supabase = createAdminClient();
        const data = this.writable(contact);
        if (!data.name || !data.account_id) throw new Error('Nome e conta são obrigatórios.');
        await this.assertAccountInTenant(supabase, data.account_id as string, organizationId);

        // Use equality filters rather than interpolating caller content into PostgREST OR syntax.
        for (const field of ['email', 'mobile_phone'] as const) {
            const value = data[field];
            if (typeof value !== 'string' || !value.trim()) continue;
            const { data: matches, error } = await supabase.from('account_contacts')
                .select('id').eq('organization_id', organizationId).eq(field, value).limit(1);
            if (error || !Array.isArray(matches)) throw new Error('Não foi possível verificar contatos duplicados.');
            if (matches.length) return { success: false, error: 'Já existe um contato com estes dados.' };
        }

        const { data: inserted, error } = await supabase.from('account_contacts')
            .insert([{ ...data, organization_id: organizationId }]).select().single();
        if (error || !inserted) return { success: false, error: 'Não foi possível salvar o contato.' };
        return { success: true, data: inserted };
    }

    static async updateContact(userId: string, id: string, organizationId: string, updates: Partial<Contact>) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Contato inválido.');
        const supabase = createAdminClient();
        const data = this.writable(updates);
        if (!Object.keys(data).length) throw new Error('Nenhuma alteração válida.');
        if (data.account_id !== undefined) await this.assertAccountInTenant(supabase, data.account_id as string, organizationId);
        const { data: updated, error } = await supabase.from('account_contacts')
            .update(data).eq('id', id).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !updated) throw new Error('Não foi possível atualizar o contato.');
        return { success: true };
    }

    static async deleteContact(userId: string, id: string, organizationId: string) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Contato inválido.');
        const supabase = createAdminClient();
        const { data: deleted, error } = await supabase.from('account_contacts')
            .delete().eq('id', id).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !deleted) throw new Error('Não foi possível excluir o contato.');
        return { success: true };
    }
}
