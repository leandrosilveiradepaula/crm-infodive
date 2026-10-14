import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Automation } from '../types/automation';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn(), getAutomations: vi.fn(), createActivity: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('./AutomationService', () => ({ AutomationService: { getAutomations: mocks.getAutomations } }));
vi.mock('./ActivityService', () => ({ ActivityService: { createActivity: mocks.createActivity } }));
import { AutomationRuntimeService } from './AutomationRuntimeService';

const automation = (): Automation => ({
    id: 'automation-a', name: 'Criar tarefa', description: 'Acompanhar',
    enabled: true, category: 'followup', createdBy: 'user-a',
    createdAt: '2026-10-10T00:00:00Z', updatedAt: '2026-10-10T00:00:00Z',
    executionCount: 0, successCount: 0, failureCount: 0,
    trigger: { type: 'deal_created', config: {} }, conditions: [],
    actions: [{ type: 'create_task', config: { title: 'Verificar negócio' } }],
});
const event = () => ({
    eventId: 'event-a', type: 'deal_created' as const,
    organizationId: 'tenant-a', entityId: 'deal-a', data: { stage: 'open' },
});
function fakeDb(options: { claimId?: unknown; finalizationId?: unknown } = {}) {
    const ops: Array<{ table: string; mode: string; payload?: unknown }> = [];
    const from = vi.fn((table: string) => {
        const op: { table: string; mode: string; payload?: unknown } = { table, mode: 'read' };
        ops.push(op);
        const result = () => {
            if (table === 'automation_executions' && op.mode === 'insert') {
                return { data: { id: options.claimId === undefined ? 'execution-a' : options.claimId }, error: null };
            }
            if (table === 'automation_executions' && op.mode === 'update') {
                return { data: { id: options.finalizationId === undefined ? 'execution-a' : options.finalizationId }, error: null };
            }
            return { data: { execution_count: 0, success_count: 0, failure_count: 0 }, error: null };
        };
        const q = {
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return q; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return q; },
            select() { return q; },
            eq() { return q; },
            maybeSingle() { return Promise.resolve(result()); },
            single() { return Promise.resolve(result()); },
            then(ok: (value: unknown) => unknown) { return Promise.resolve(result()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { from, ops };
}
describe('automation runtime exact persistence evidence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getAutomations.mockResolvedValue([automation()]);
        mocks.createActivity.mockResolvedValue({ id: 'activity-a' });
    });

    it('rejects missing automation list without creating execution records', async () => {
        const db = fakeDb();
        mocks.getAutomations.mockResolvedValue(null);
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('definitions unavailable');
        expect(db.from).not.toHaveBeenCalled();
    });

    it('rejects malformed or duplicate automation IDs before side effects', async () => {
        const db = fakeDb();
        mocks.getAutomations.mockResolvedValue([{ ...automation(), id: '' }]);
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('definitions unavailable');
        mocks.getAutomations.mockResolvedValue([automation(), automation()]);
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('duplicate automation definitions');
        expect(db.from).not.toHaveBeenCalled();
    });

    it('does not run an action when the execution claim ID is malformed', async () => {
        fakeDb({ claimId: 123 });
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('execution id missing');
        expect(mocks.createActivity).not.toHaveBeenCalled();
    });

    it('records a sanitized failure if the activity did not persist an ID', async () => {
        const db = fakeDb();
        mocks.createActivity.mockResolvedValue({ id: null });
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result).toEqual([{ automationId: 'automation-a', status: 'failed', reason: 'automation action failed' }]);
        expect(db.ops.find(op => op.table === 'automation_executions' && op.mode === 'update')?.payload)
            .toMatchObject({ status: 'failed', error: 'automation action failed' });
    });

    it('does not claim success if a different execution row was finalized', async () => {
        fakeDb({ finalizationId: 'different' });
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('automation execution finalization failed');
        expect(mocks.createActivity).toHaveBeenCalledOnce();
    });

    it('allows a matching claim, task and finalization to complete', async () => {
        const db = fakeDb();
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result).toEqual([{ automationId: 'automation-a', status: 'success', reason: 'executed' }]);
        expect(db.ops.some(op => op.table === 'automation_executions' && op.mode === 'update')).toBe(true);
    });
});