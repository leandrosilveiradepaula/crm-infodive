import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), createActivity: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./ActivityService', () => ({ ActivityService: { createActivity: mocks.createActivity } }));
import { ActivityAiService } from './ActivityAiService';

type Result = { data: unknown; error: { message?: string } | null };
type Op = { table: string; mode: string; filters: [string, unknown][] };
function fakeDb(responses: Record<string, Result>) {
    const ops: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        ops.push(op);
        const query = {
            select() { return query; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return query; },
            gt() { return query; },
            not() { return query; },
            order() { return query; },
            limit() { return query; },
            update() { op.mode = 'update'; return query; },
            maybeSingle() { return Promise.resolve(take()); },
            then(ok: (value: Result) => unknown, fail?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(ok, fail);
            },
        };
        const take = (): Result => responses[table + ':' + op.mode] ??
            responses[table] ?? { data: [], error: null };
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops };
}

describe('ActivityAiService offline failure contracts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.createActivity.mockResolvedValue({ id: 'activity-a' });
    });

    it('does not silently succeed when inactive deal selection fails', async () => {
        fakeDb({ deals: { data: null, error: { message: 'database error' } } });
        await expect(ActivityAiService.evaluateInactiveDeals('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível avaliar as oportunidades inativas.');
        expect(mocks.createActivity).not.toHaveBeenCalled();
    });

    it('rejects a missing existing-automation lookup before creating duplicates', async () => {
        const db = fakeDb({
            deals: { data: [{ id: 'deal-a', updated_at: '2020-01-01', title: 'A' }], error: null },
            activities: { data: null, error: { message: 'lookup failed' } },
        });
        await expect(ActivityAiService.evaluateInactiveDeals('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível verificar as atividades existentes.');
        expect(db.ops.filter(op => op.table === 'activities')[0].filters)
            .toContainEqual(['organization_id', 'tenant-a']);
        expect(mocks.createActivity).not.toHaveBeenCalled();
    });

    it('does not schedule follow-up when last activity lookup failed', async () => {
        let activityCall = 0;
        const ops: Op[] = [];
        const from = vi.fn((table: string) => {
            const op: Op = { table, mode: 'read', filters: [] };
            ops.push(op);
            const builder = {
                select() { return builder; },
                eq(k: string, v: unknown) { op.filters.push([k, v]); return builder; },
                not() { return builder; },
                order() { return builder; },
                limit() { return builder; },
                then(ok: (result: Result) => unknown) {
                    const result = table === 'deals' ?
                        { data: [{ id: 'deal-a', title: 'A', updated_at: '2020-01-01' }], error: null } :
                        ++activityCall === 1 ? { data: [], error: null } :
                        { data: null, error: { message: 'last activity unavailable' } };
                    return Promise.resolve(result).then(ok);
                },
            };
            return builder;
        });
        mocks.createAdminClient.mockReturnValue({ from });
        await expect(ActivityAiService.evaluateInactiveDeals('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível verificar a última atividade.');
        expect(mocks.createActivity).not.toHaveBeenCalled();
        expect(ops.filter(op => op.table === 'activities')).toHaveLength(2);
    });

    it('rejects broken suggestion list results while allowing a real empty array', async () => {
        fakeDb({ ai_activity_suggestions: { data: null, error: null } });
        await expect(ActivityAiService.getSuggestions('tenant-a'))
            .rejects.toThrow('Não foi possível carregar as sugestões.');
        fakeDb({ ai_activity_suggestions: { data: [], error: null } });
        await expect(ActivityAiService.getSuggestions('tenant-a')).resolves.toEqual([]);
    });

    it('requires an affected pending suggestion row to acknowledge dismissal', async () => {
        const db = fakeDb({
            'ai_activity_suggestions:update': { data: null, error: null },
        });
        await expect(ActivityAiService.dismissSuggestion('tenant-a', 'missing'))
            .rejects.toThrow('Não foi possível processar a atividade com IA.');
        const mutation = db.ops.find(op => op.mode === 'update');
        expect(mutation?.filters).toContainEqual(['organization_id', 'tenant-a']);
        expect(mutation?.filters).toContainEqual(['status', 'pending']);
    });
});
