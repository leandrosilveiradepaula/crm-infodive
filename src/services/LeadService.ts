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
        // This is intentionally a single database operation. Never fall back to
        // multiple PostgREST writes: a missing migration must fail closed.
        const isUuid = (value: unknown): value is string =>
            typeof value === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
        if (![userId, organizationId, leadId].every(isUuid)) {
            throw new Error('Identificadores inválidos para conversão.');
        }

        const normalized = this.normalizedInput(conversionData);
        // Status/ownership are determined by the server and the database.
        delete normalized.status;
        delete normalized.owner;
        for (const key of ['company', 'contact_name'] as const) {
            if (Object.prototype.hasOwnProperty.call(normalized, key) &&
                (typeof normalized[key] !== 'string' ||
                    !(normalized[key] as string).trim() ||
                    (normalized[key] as string).length > 250)) {
                throw new Error('Dados obrigatórios da conversão inválidos.');
            }
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc('convert_lead_to_deal_atomic', {
            p_actor_id: userId,
            p_org_id: organizationId,
            p_lead_id: leadId,
            p_input: normalized,
        });
        if (error || !Array.isArray(data) || data.length !== 1) {
            throw new Error('Não foi possível converter o lead. Nenhuma conversão foi confirmada.');
        }
        const row = data[0];
        if (!row || !isUuid(row.account_id) || !isUuid(row.contact_id) ||
            !isUuid(row.deal_id) || typeof row.replayed !== 'boolean') {
            throw new Error('Resposta de conversão inválida; confirme o estado no servidor.');
        }

        return {
            success: true,
            accountId: row.account_id as string,
            contactId: row.contact_id as string,
            dealId: row.deal_id as string,
            replayed: row.replayed as boolean,
        };
    }
}
