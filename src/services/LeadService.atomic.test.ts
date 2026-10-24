import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({
    createAdminClient: mocks.createAdminClient,
}));
import { LeadService } from './LeadService';

const actor = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const org = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const lead = '11111111-1111-4111-8111-111111111111';
const account = '22222222-2222-4222-8222-222222222222';
const contact = '33333333-3333-4333-8333-333333333333';
const deal = '44444444-4444-4444-8444-444444444444';
const valid = { account_id: account, contact_id: contact, deal_id: deal, replayed: false };

describe('atomic lead conversion RPC boundary (#117)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
        mocks.rpc.mockResolvedValue({ data: [valid], error: null });
    });

    it('executes one RPC and never performs non-atomic table writes', async () => {
        const result = await LeadService.convertLeadToDeal(actor, org, lead, {
            company: 'ACME LTDA', contact_name: 'ANA DA SILVA', interest: 'servicos',
            id: 'forged', organization_id: 'foreign',
            status: 'Convertido', owner: 'spoofed',
        });
        expect(mocks.rpc).toHaveBeenCalledTimes(1);
        expect(mocks.rpc).toHaveBeenCalledWith('convert_lead_to_deal_atomic', {
            p_actor_id: actor, p_org_id: org, p_lead_id: lead,
            p_input: { company: 'Acme Ltda', contact_name: 'Ana da Silva', interest: 'Servicos' },
        });
        expect(result).toEqual({
            success: true, accountId: account, contactId: contact,
            dealId: deal, replayed: false,
        });
    });

    it('does not call the database with malformed identifiers or invalid payloads', async () => {
        await expect(LeadService.convertLeadToDeal(actor, 'foreign', lead, {}))
            .rejects.toThrow('Identificadores inválidos');
        await expect(LeadService.convertLeadToDeal(actor, org, lead, {
            company: '   ',
        })).rejects.toThrow('Dados obrigatórios');
        await expect(LeadService.convertLeadToDeal(actor, org, lead,
            { contact_name: { nested: true } } as never)).rejects.toThrow();
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('rejects database errors and malformed/non-persisted success responses', async () => {
        const bad = [
            { data: null, error: null },
            { data: [], error: null },
            { data: [valid, valid], error: null },
            { data: [null], error: null },
            { data: [{ ...valid, deal_id: 'broken' }], error: null },
            { data: [{ ...valid, replayed: 'true' }], error: null },
            { data: [valid], error: { message: 'transaction rolled back' } },
        ];
        for (const reply of bad) {
            mocks.rpc.mockResolvedValueOnce(reply);
            await expect(LeadService.convertLeadToDeal(actor, org, lead, {
                company: 'Acme',
            })).rejects.toThrow();
        }
        expect(mocks.rpc).toHaveBeenCalledTimes(bad.length);
    });

    it('reports exact replay only when confirmed by the RPC', async () => {
        mocks.rpc.mockResolvedValueOnce({ data: [{ ...valid, replayed: true }], error: null });
        await expect(LeadService.convertLeadToDeal(actor, org, lead, {}))
            .resolves.toMatchObject({ success: true, replayed: true });
    });
});
