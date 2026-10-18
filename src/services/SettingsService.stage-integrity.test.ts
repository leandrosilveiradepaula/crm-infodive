import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), rpc: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SettingsService, type PipelineStage } from './SettingsService';

const actor = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const org = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const id = '11111111-1111-4111-8111-111111111111';
const current: PipelineStage = { id, name: 'Qualificação', color: '#abcdef', order_index: 0 };

describe('pipeline stage transactional service boundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
        mocks.rpc.mockResolvedValue({ data: [{ revision: 3 }], error: null });
    });

    it('rejects stale forms without actor and revision before I/O', async () => {
        await expect(SettingsService.savePipelineStages(org, [current])).resolves.toMatchObject({ success: false });
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('accepts a complete valid snapshot and carries revision into one atomic RPC', async () => {
        mocks.rpc.mockResolvedValueOnce({ data: [{ revision: 2, stages: [current] }], error: null });
        const snap = await SettingsService.getPipelineStageSnapshot(actor, org);
        expect(snap).toEqual({ revision: 2, stages: [current] });

        const result = await SettingsService.savePipelineStages(org, [current], 2, actor);
        expect(result).toMatchObject({ success: true, revision: 3 });
        expect(mocks.rpc).toHaveBeenLastCalledWith('replace_pipeline_stages_atomic', {
            p_actor_id: actor, p_org_id: org, p_expected_revision: 2,
            p_stages: [{ id, name: 'Qualificação', color: '#abcdef' }],
        });
    });

    it('uses defaults only when the atomic snapshot contains a legitimate empty stage list', async () => {
        mocks.rpc.mockResolvedValueOnce({ data: [{ revision: 2, stages: [] }], error: null });
        const snapshot = await SettingsService.getPipelineStageSnapshot(actor, org);
        expect(snapshot.revision).toBe(2);
        expect(snapshot.stages).toEqual([
            { id: '1', name: 'Lead', color: '#3b82f6', order_index: 0 },
            { id: '2', name: 'Qualificação', color: '#eab308', order_index: 1 },
            { id: '3', name: 'Proposta', color: '#8b5cf6', order_index: 2 },
            { id: '4', name: 'Negociação', color: '#f97316', order_index: 3 },
            { id: '5', name: 'Fechado Ganho', color: '#10b981', order_index: 4 },
        ]);
    });

    it.each([
        ['missing name', { id, color: '#abcdef', order_index: 0 }],
        ['non-text name', { id, name: 1, color: '#abcdef', order_index: 0 }],
        ['blank name', { id, name: '   ', color: '#abcdef', order_index: 0 }],
        ['overlong name', { id, name: 'a'.repeat(101), color: '#abcdef', order_index: 0 }],
        ['missing color', { id, name: 'Qualificação', order_index: 0 }],
        ['invalid color', { id, name: 'Qualificação', color: '#abc', order_index: 0 }],
        ['missing order index', { id, name: 'Qualificação', color: '#abcdef' }],
        ['fractional order index', { id, name: 'Qualificação', color: '#abcdef', order_index: 0.5 }],
        ['negative order index', { id, name: 'Qualificação', color: '#abcdef', order_index: -1 }],
        ['unsafe order index', { id, name: 'Qualificação', color: '#abcdef', order_index: Number.MAX_SAFE_INTEGER + 1 }],
        ['invalid stage id', { id: 'invalid', name: 'Qualificação', color: '#abcdef', order_index: 0 }],
    ])('rejects a snapshot with %s without returning partial data', async (_case, stage) => {
        mocks.rpc.mockResolvedValueOnce({ data: [{ revision: 2, stages: [current, stage] }], error: null });
        await expect(SettingsService.getPipelineStageSnapshot(actor, org))
            .rejects.toThrow('Não foi possível verificar a versão das etapas do pipeline.');
    });

    it('never reports success on missing transaction receipt or mismatch', async () => {
        for (const response of [
            { data: null, error: null }, { data: [], error: null },
            { data: [{ revision: 99 }], error: null },
            { data: [{ revision: 3 }], error: { code: 'XX000' } },
        ]) {
            mocks.rpc.mockResolvedValueOnce(response);
            const result = await SettingsService.savePipelineStages(org, [current], 2, actor);
            expect(result.success).toBe(false);
        }
    });

    it('rejects malformed organization identifiers before contacting the database', async () => {
        await expect(SettingsService.getPipelineStageSnapshot(actor, 'invalid-org'))
            .rejects.toThrow('identificar a organização');
        await expect(SettingsService.savePipelineStages(org, [current], 2, 'invalid-user'))
            .resolves.toMatchObject({ success: false });
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('returns explicit conflict and refuses duplicate and malformed stage values', async () => {
        mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
        await expect(SettingsService.savePipelineStages(org, [current], 2, actor))
            .resolves.toMatchObject({ success: false, conflict: true });
        await expect(SettingsService.savePipelineStages(org, [current, { ...current, id: 'not-a-uuid' }], 2, actor))
            .resolves.toMatchObject({ success: false });
        await expect(SettingsService.savePipelineStages(org, [current, { ...current, id: '22222222-2222-4222-8222-222222222222', name: ' qualificação ' }], 2, actor))
            .resolves.toMatchObject({ success: false });
        expect(mocks.rpc).toHaveBeenCalledTimes(1);
    });
});
