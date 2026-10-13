import { createAdminClient } from '../lib/supabase/admin';
import { type Contract } from '@/types/contract';
import { validatePersistedDraftText } from '../lib/contract-content';

type Admin = ReturnType<typeof createAdminClient>;
type ContractLink = { id: string; deal_id: string | null; proposal_id: string | null; status: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validId(value: unknown): value is string { return typeof value === 'string' && UUID.test(value); }
function validateTenant(organizationId: string, ownerId?: string) {
    if (!validId(organizationId) || (ownerId !== undefined && !validId(ownerId))) {
        throw new Error('Contexto de organização ou usuário inválido.');
    }
}
function validateReadRows(rows: unknown, organizationId: string, ownedIds?: string[]) {
    if (!Array.isArray(rows)) throw new Error('Resposta inválida de contratos.');
    for (const row of rows) {
        if (!row || !validId(row.id) || row.organization_id !== organizationId ||
            typeof row.title !== 'string' || !row.title.trim() ||
            typeof row.company_name !== 'string' || !row.company_name.trim() ||
            !['draft','sent','viewed','signed','declined'].includes(row.status) ||
            !['service','nda','sales'].includes(row.type) ||
            (ownedIds !== undefined && (!validId(row.deal_id) || !ownedIds.includes(row.deal_id)))) {
            throw new Error('Resposta inválida de contratos.');
        }
    }
}


/** Privileged reads always filter by tenant; sellers only see their owned deals. */
async function ownedDealIds(db: Admin, orgId: string, ownerId: string) {
    const { data, error } = await db.from('deals')
        .select('id').eq('organization_id', orgId).eq('owner_id', ownerId);
    if (error || !Array.isArray(data)) throw new Error('Não foi possível validar as oportunidades.');
    if (data.some(item => !item || !validId(item.id))) throw new Error('Oportunidades inválidas na consulta.');
    return data.map(item => item.id as string);
}

async function assertDealReference(db: Admin, orgId: string, dealId: string | undefined | null, ownerId?: string) {
    if (dealId && !validId(dealId)) throw new Error('Referência de oportunidade inválida.');
    if (!dealId) {
        if (ownerId) throw new Error('O contrato deve estar vinculado a uma oportunidade autorizada.');
        return;
    }
    const query = db.from('deals').select('id').eq('id', dealId).eq('organization_id', orgId);
    if (ownerId) query.eq('owner_id', ownerId);
    const { data, error } = await query.maybeSingle();
    if (error || !data) throw new Error('Oportunidade inválida ou acesso negado.');
}

async function assertProposalReference(db: Admin, orgId: string, proposalId: string | undefined | null, dealId: string | undefined | null) {
    if (proposalId && !validId(proposalId)) throw new Error('Referência de proposta inválida.');
    if (!proposalId) return;
    // A proposal can only be attached to the contract for its own deal.
    if (!dealId) throw new Error('Proposta sem oportunidade vinculada.');
    const { data, error } = await db.from('proposals').select('id')
        .eq('id', proposalId).eq('deal_id', dealId)
        .eq('organization_id', orgId).maybeSingle();
    if (error || !data) throw new Error('Proposta inválida para esta oportunidade.');
}

function validateContractFields(contract: Partial<Contract>, creating: boolean) {
    if (!contract || typeof contract !== 'object' || Array.isArray(contract)) throw new Error('Contrato inválido.');
    if (creating && (typeof contract.title !== 'string' || !contract.title.trim())) throw new Error('Título obrigatório.');
    if (creating && (typeof contract.company !== 'string' || !contract.company.trim())) throw new Error('Empresa obrigatória.');
    if (contract.title !== undefined && (typeof contract.title !== 'string' || !contract.title.trim() || contract.title.length > 500)) throw new Error('Título inválido.');
    if (contract.company !== undefined && (typeof contract.company !== 'string' || !contract.company.trim() || contract.company.length > 500)) throw new Error('Empresa inválida.');
    if (contract.value !== undefined && (typeof contract.value !== 'number' || !Number.isFinite(contract.value) || contract.value < 0)) throw new Error('Valor inválido.');
    if (contract.status !== undefined && contract.status !== 'draft') throw new Error('Somente rascunhos podem ser criados ou editados até a implantação de um fluxo verificável.');
    // A name or image is not verified identity, consent, or a signed document.
    // Preserve legacy rows for reading; refuse new signature evidence until an
    // auditable signing mechanism and its human-approved requirements exist.
    if (contract.signature_image !== undefined ||
        contract.signerName !== undefined || contract.signerRole !== undefined) {
        throw new Error('Assinatura eletrônica indisponível: evidência verificável não configurada.');
    }
    if (contract.type !== undefined && !['service', 'nda', 'sales'].includes(contract.type)) throw new Error('Tipo inválido.');
    if (contract.content_json !== undefined) validatePersistedDraftText(contract.content_json);
    for (const value of [contract.dealId, contract.proposalId]) {
        if (value !== undefined && (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))) {
            throw new Error('Referência inválida.');
        }
    }
}

async function existingContract(db: Admin, orgId: string, id: string, ownerId?: string): Promise<ContractLink> {
    if (typeof id !== 'string' || !id.trim()) throw new Error('Contrato inválido.');
    const { data, error } = await db.from('contracts')
        .select('id,deal_id,proposal_id,status').eq('id', id).eq('organization_id', orgId).maybeSingle();
    if (error || !data || data.id !== id || !['draft','sent','viewed','signed','declined'].includes(data.status) ||
        (data.deal_id !== null && !validId(data.deal_id)) ||
        (data.proposal_id !== null && !validId(data.proposal_id))) throw new Error('Contrato não encontrado.');
    if (ownerId) await assertDealReference(db, orgId, data.deal_id, ownerId);
    if (data.status !== 'draft') throw new Error('Este contrato não é um rascunho editável.');
    return data as ContractLink;
}

export class ContractService {
    /** Seller creation choices must be derived from server-owned tenant and user identity. */
    static async getOwnedContractDealOptions(organizationId: string, ownerId: string) {
        if (!organizationId || !ownerId) throw new Error('Acesso negado às oportunidades.');
        validateTenant(organizationId, ownerId);
        const db = createAdminClient();
        const { data, error } = await db.from('deals')
            .select('id,title,company')
            .eq('organization_id', organizationId)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });
        if (error || !Array.isArray(data)) throw new Error('Não foi possível carregar as oportunidades autorizadas.');
        if (data.some(item => !validId(item?.id) || typeof item?.title !== 'string')) {
            throw new Error('Dados inválidos das oportunidades.');
        }
        return data.map(item => ({ id: item.id, title: item.title, company: typeof item.company === 'string' ? item.company : '' }));
    }

    static async getContracts(organizationId: string, ownerId?: string) {
        validateTenant(organizationId, ownerId);
        const db = createAdminClient();
        let visibleIds: string[] | undefined;
        if (ownerId) {
            visibleIds = await ownedDealIds(db, organizationId, ownerId);
            if (!visibleIds.length) return [];
        }
        // PostgREST can cap responses (commonly 1000 rows). Never treat a truncated
        // list as complete: fetch bounded windows with a deterministic tie-breaker.
        const PAGE_SIZE = 200;
        const MAX_PAGES = 50;
        const rows: Array<{ id: string; organization_id: string; title: string; company_name: string; value: number | null; status: string; type: string; signer_name: string | null; signer_role: string | null; deal_id: string | null; proposal_id: string | null; created_at: string; updated_at: string; content_json: unknown; signature_image: string | null }> = [];
        const seen = new Set<string>();
        for (let page = 0; page < MAX_PAGES; page++) {
            let query = db.from('contracts').select('*').eq('organization_id', organizationId);
            if (visibleIds) query = query.in('deal_id', visibleIds);
            const { data, error } = await query.order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            if (error) throw new Error('Não foi possível carregar os contratos.');
            if (!Array.isArray(data)) throw new Error('Resposta inválida de contratos.');
            validateReadRows(data, organizationId, visibleIds);
            for (const item of data) {
                const id = item.id as string;
                if (seen.has(id)) throw new Error('Duplicidade ou paginação inconsistente de contratos.');
                seen.add(id);
                rows.push(item);
            }
            if (data.length < PAGE_SIZE) return rows;
        }
        throw new Error('Limite de listagem excedido. Refine a consulta de contratos.');
    }

    static async createContract(organizationId: string, contract: Partial<Contract>, ownerId?: string) {
        validateTenant(organizationId, ownerId);
        validateContractFields(contract, true);
        const db = createAdminClient();
        await assertDealReference(db, organizationId, contract.dealId, ownerId);
        await assertProposalReference(db, organizationId, contract.proposalId, contract.dealId);
        const dbData = {
            organization_id: organizationId,
            title: contract.title,
            company_name: contract.company,
            value: contract.value,
            status: 'draft',
            type: contract.type || 'service',
            signer_name: contract.signerName,
            signer_role: contract.signerRole,
            deal_id: contract.dealId,
            proposal_id: contract.proposalId,
            content_json: contract.content_json,
            signature_image: contract.signature_image,
        };
        const { data, error } = await db.from('contracts')
            .insert([dbData]).select('id').maybeSingle();
        if (error || !data || !validId(data.id)) throw new Error('Não foi possível salvar o contrato.');
        return data;
    }

    static async updateContract(organizationId: string, id: string, updates: Partial<Contract>, ownerId?: string, expectedUpdatedAt?: string) {
        validateTenant(organizationId, ownerId);
        if (expectedUpdatedAt !== undefined && (typeof expectedUpdatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(expectedUpdatedAt) || Number.isNaN(Date.parse(expectedUpdatedAt)))) {
            throw new Error('Versão inválida do rascunho.');
        }
        validateContractFields(updates, false);
        const db = createAdminClient();
        const current = await existingContract(db, organizationId, id, ownerId);
        const dealId = updates.dealId ?? current.deal_id;
        const proposalId = updates.proposalId ?? current.proposal_id;
        await assertDealReference(db, organizationId, dealId, ownerId);
        await assertProposalReference(db, organizationId, proposalId, dealId);
        const fields: Record<string, unknown> = {};
        if (updates.title !== undefined) fields.title = updates.title;
        if (updates.company !== undefined) fields.company_name = updates.company;
        if (updates.value !== undefined) fields.value = updates.value;
        if (updates.status !== undefined) fields.status = updates.status;
        if (updates.type !== undefined) fields.type = updates.type;
        if (updates.signerName !== undefined) fields.signer_name = updates.signerName;
        if (updates.signerRole !== undefined) fields.signer_role = updates.signerRole;
        if (updates.dealId !== undefined) fields.deal_id = updates.dealId;
        if (updates.proposalId !== undefined) fields.proposal_id = updates.proposalId;
        if (updates.content_json !== undefined) fields.content_json = updates.content_json;
        if (updates.signature_image !== undefined) fields.signature_image = updates.signature_image;
        if (!Object.keys(fields).length) throw new Error('Nenhuma alteração válida.');
        fields.updated_at = new Date().toISOString();
        let query = db.from('contracts').update(fields).eq('id', id).eq('organization_id', organizationId).eq('status', 'draft');
        if (ownerId) query = query.eq('deal_id', current.deal_id);
        if (expectedUpdatedAt !== undefined) query = query.eq('updated_at', expectedUpdatedAt);
        const { data, error } = await query.select('id').maybeSingle();
        if (error || !data || data.id !== id) throw new Error('Não foi possível atualizar o rascunho: estado alterado ou versão desatualizada.');
        return data;
    }

    static async deleteContract(organizationId: string, id: string, ownerId?: string) {
        validateTenant(organizationId, ownerId);
        const db = createAdminClient();
        const current = await existingContract(db, organizationId, id, ownerId);
        let query = db.from('contracts').delete().eq('id', id).eq('organization_id', organizationId).eq('status', 'draft');
        if (ownerId) query = query.eq('deal_id', current.deal_id);
        const { data, error } = await query.select('id').maybeSingle();
        if (error || !data || data.id !== id) throw new Error('Não foi possível excluir o contrato.');
        return true;
    }
}
