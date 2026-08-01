import { createAdminClient } from '@/lib/supabase/admin';
import { Lead } from '@/types/lead';
import { normalizeCasing, normalizeTaxId, normalizePhone, normalizeZip } from '@/lib/string-utils';

export class LeadService {
    static async getLeads(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw new Error('Não foi possível carregar os leads.');
        return data as Lead[];
    }

    static async createLead(userId: string, organizationId: string, lead: Partial<Lead>) {
        const supabase = createAdminClient();
        const normalizedLead = {
            ...lead,
            company: normalizeCasing(lead.company, 'name'),
            contact_name: normalizeCasing(lead.contact_name, 'name'),
            cnpj: normalizeTaxId(lead.cnpj),
            phone: normalizePhone(lead.phone),
            street: normalizeCasing(lead.street, 'address'),
            neighborhood: normalizeCasing(lead.neighborhood, 'address'),
            city: normalizeCasing(lead.city, 'address'),
            state: normalizeCasing(lead.state, 'address'),
            zip: normalizeZip(lead.zip),
            interest: normalizeCasing(lead.interest, 'name'),
            organization_id: organizationId
        };
        const { data, error } = await supabase
            .from('leads')
            .insert([normalizedLead])
            .select()
            .single();

        if (error) throw new Error('Não foi possível salvar o lead.');
        return data;
    }

    static async updateLead(userId: string, id: string, organizationId: string, updates: Partial<Lead>) {
        const supabase = createAdminClient();
        const normalizedUpdates = { ...updates };
        if (updates.company) normalizedUpdates.company = normalizeCasing(updates.company, 'name');
        if (updates.contact_name) normalizedUpdates.contact_name = normalizeCasing(updates.contact_name, 'name');
        if (updates.cnpj) normalizedUpdates.cnpj = normalizeTaxId(updates.cnpj);
        if (updates.phone) normalizedUpdates.phone = normalizePhone(updates.phone);
        if (updates.street) normalizedUpdates.street = normalizeCasing(updates.street, 'address');
        if (updates.neighborhood) normalizedUpdates.neighborhood = normalizeCasing(updates.neighborhood, 'address');
        if (updates.city) normalizedUpdates.city = normalizeCasing(updates.city, 'address');
        if (updates.state) normalizedUpdates.state = normalizeCasing(updates.state, 'address');
        if (updates.zip) normalizedUpdates.zip = normalizeZip(updates.zip);
        if (updates.interest) normalizedUpdates.interest = normalizeCasing(updates.interest, 'name');

        const { error } = await supabase
            .from('leads')
            .update(normalizedUpdates)
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw new Error('Não foi possível atualizar o lead.');
        return true;
    }

    static async deleteLead(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);
        if (error) throw new Error('Não foi possível excluir o lead.');
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
