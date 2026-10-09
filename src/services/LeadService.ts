import { createAdminClient } from '../lib/supabase/admin';
import { Lead } from '../types/lead';
import { normalizeCasing, normalizeTaxId, normalizePhone, normalizeZip } from '../lib/string-utils';

export class LeadService {
    private static readonly mutableFields = new Set([
        'company', 'contact_name', 'email', 'phone', 'status', 'interest',
        'cnpj', 'ie', 'zip', 'street', 'number', 'complement',
        'neighborhood', 'city', 'state', 'owner',
    ]);

    private static normalizedInput(input: Partial<Lead>): Record<string, unknown> {
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            throw new Error('Dados do lead inválidos.');
        }
        const fields = Object.fromEntries(Object.entries(input)
            .filter(([key]) => this.mutableFields.has(key)));
        for (const field of ['company', 'contact_name', 'street',
            'neighborhood', 'city', 'state', 'interest'] as const) {
            const value = fields[field];
            if (value !== undefined && value !== null) {
                if (typeof value !== 'string') throw new Error('Campo do lead inválido.');
                fields[field] = normalizeCasing(value, field === 'street' || field === 'city' ||
                    field === 'state' || field === 'neighborhood' ? 'address' : 'name');
            }
        }
        for (const field of ['cnpj', 'phone', 'zip'] as const) {
            const value = fields[field];
            if (value !== undefined && value !== null) {
                if (typeof value !== 'string') throw new Error('Campo do lead inválido.');
                fields[field] = field === 'cnpj' ? normalizeTaxId(value) :
                    field === 'phone' ? normalizePhone(value) : normalizeZip(value);
            }
        }
        return fields;
    }

    static async getLeads(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar os leads.');
        return data as Lead[];
    }

    static async createLead(userId: string, organizationId: string, lead: Partial<Lead>) {
        if (!lead || typeof lead.company !== 'string' ||
            !lead.company.trim() || lead.company.length > 250) {
            throw new Error('Empresa do lead inválida.');
        }
        const fields = this.normalizedInput(lead);
        const normalizedLead = {
            ...fields,
            // Preserve the legacy create defaults without copying privileged input.
            contact_name: fields.contact_name ?? '',
            cnpj: fields.cnpj ?? '',
            phone: fields.phone ?? '',
            street: fields.street ?? '',
            neighborhood: fields.neighborhood ?? '',
            city: fields.city ?? '',
            state: fields.state ?? '',
            zip: fields.zip ?? '',
            interest: fields.interest ?? '',
            organization_id: organizationId,
        };
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('leads')
            .insert([normalizedLead])
            .select()
            .single();

        if (error || !data) throw new Error('Não foi possível salvar o lead.');
        return data;
    }

    static async updateLead(userId: string, id: string, organizationId: string, updates: Partial<Lead>) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Lead inválido.');
        const normalizedUpdates = this.normalizedInput(updates);
        if (!Object.keys(normalizedUpdates).length) throw new Error('Nenhuma alteração permitida.');
        if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'company') &&
            (typeof normalizedUpdates.company !== 'string' ||
                !normalizedUpdates.company.trim() || normalizedUpdates.company.length > 250)) {
            throw new Error('Empresa do lead inválida.');
        }
        const supabase = createAdminClient();
        const { data: updated, error } = await supabase
            .from('leads')
            .update(normalizedUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();
        if (error || !updated) throw new Error('Não foi possível atualizar o lead.');
        return true;
    }

    static async deleteLead(userId: string, id: string, organizationId: string) {
        if (typeof id !== 'string' || !id.trim()) throw new Error('Lead inválido.');
        const supabase = createAdminClient();
        const { data: deleted, error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();
        if (error || !deleted) throw new Error('Não foi possível excluir o lead.');
        return true;
    }

    static async convertLeadToDeal(userId: string, organizationId: string, leadId: string, conversionData: Partial<Lead>) {
        const supabase = createAdminClient();

        // 1. Update Lead Status
        const { error: leadError } = await supabase
            .from('leads')
            .update({ ...conversionData, status: 'Convertido' })
            .eq('id', leadId)
            .eq('organization_id', organizationId);

        if (leadError) throw new Error('Não foi possível converter o lead.');

        // 2. Create Account
        const accountData = {
            organization_id: organizationId,
            name: normalizeCasing(conversionData.company, 'name'),
            cnpj: normalizeTaxId(conversionData.cnpj),
            ie: conversionData.ie,
            zip: normalizeZip(conversionData.zip),
            street: normalizeCasing(conversionData.street, 'address'),
            number: conversionData.number,
            complement: conversionData.complement,
            neighborhood: normalizeCasing(conversionData.neighborhood, 'address'),
            city: normalizeCasing(conversionData.city, 'address'),
            state: normalizeCasing(conversionData.state, 'address'),
            industry: normalizeCasing(conversionData.interest, 'name') || 'Novos Negócios',
            status: 'Ativo'
        };

        const { data: newAccount, error: accError } = await supabase
            .from('accounts')
            .insert([accountData])
            .select()
            .single();

        if (accError) throw new Error('Não foi possível converter o lead.');

        // 3. Create Contact for Account
        const contactData = {
            organization_id: organizationId,
            account_id: newAccount.id,
            name: normalizeCasing(conversionData.contact_name, 'name'),
            email: conversionData.email,
            mobile_phone: normalizePhone(conversionData.phone),
            role: 'Contato Comercial',
            is_primary: true
        };

        const { error: contactError } = await supabase.from('account_contacts').insert([contactData]);
        if (contactError) console.error('[LeadService] contact creation failed');

        // 4. Create Deal
        const dealData = {
            organization_id: organizationId,
            title: `Oportunidade: ${conversionData.interest || 'Novos Produtos'}`,
            account_id: newAccount.id,
            status: 'qualification',
            value: 10000,
            probability: 30,
            close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            owner_id: userId
        };

        const { error: dealError } = await supabase.from('deals').insert([dealData]);
        if (dealError) throw new Error('Não foi possível converter o lead.');

        return { success: true };
    }
}
