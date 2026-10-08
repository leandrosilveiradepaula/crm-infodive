import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Automation } from '@/types/automation';
import type { AutomationRuntimeEvent } from '@/services/automationRuntimeCore';

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    getAutomations: vi.fn(),
    createActivity: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('@/services/AutomationService', () => ({
    AutomationService: { getAutomations: mocks.getAutomations },
}));
vi.mock('@/services/ActivityService', () => ({
    ActivityService: { createActivity: mocks.createActivity },
}));

import { AutomationRuntimeService } from '@/services/AutomationRuntimeService';

type Write = { table: string; operation: string; payload: unknown };
type FakeOptions = { duplicate?: boolean; finalizationMissing?: boolean };
function fakeDatabase(options: FakeOptions = {}) {
    const writes: Write[] = [];
    const from = vi.fn((table: string) => {
        let operation = '';
        const query = {
            insert(payload: unknown) {
                operation = 'insert';
                writes.push({ table, operation, payload });
                return query;
            },
            update(payload: unknown) {
                operation = 'update';
                writes.push({ table, operation, payload });
                return query;
            },
            eq(_column: string, _value: unknown) { return query; },
            select(_columns?: string) { return query; },
            async maybeSingle() {
                if (table === 'automation_executions' && operation === 'insert') {
                    if (options.duplicate) return { data: null, error: { code: '23505' } };
                    return { data: { id: 'execution-1' }, error: null };
                }
                if (table === 'automation_executions' && operation === 'update' && options.finalizationMissing) {
                    return { data: null, error: null };
                }
                return { data: { id: 'execution-1' }, error: null };
            },
            async single() {
                return { data: { execution_count: 0, success_count: 0, failure_count: 0 }, error: null };
            },
        };
        return query;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { writes, from };
}

function automation(): Automation {
    return {
        id: 'automation-1',
        name: 'Criar acompanhamento',
        description: 'Criar tarefa',
        enabled: true,
        trigger: { type: 'deal_created', config: {} },
        conditions: [],
        actions: [{ type: 'create_task', config: { title: 'Acompanhar oportunidade' } }],
    } as Automation;
}
function event(): AutomationRuntimeEvent {
    return {
        eventId: 'event-1',
        type: 'deal_created',
        organizationId: 'tenant-a',
        entityId: 'deal-1',
        data: { stage: 'open', title: 'Oportunidade' },
    };
}

describe('AutomationRuntimeService offline execution behavior', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getAutomations.mockResolvedValue([automation()]);
        mocks.createActivity.mockResolvedValue({ id: 'activity-1' });
    });

    it('creates one real action through the service and persists its successful execution', async () => {
        const db = fakeDatabase();
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result).toEqual([{ automationId: 'automation-1', status: 'success', reason: 'executed' }]);
        expect(mocks.createActivity).toHaveBeenCalledTimes(1);
        expect(mocks.createActivity).toHaveBeenCalledWith(
            'user-a', 'tenant-a', expect.objectContaining({
                type: 'task', dealId: 'deal-1', source: 'automation',
            }),
        );
        expect(db.writes).toContainEqual(expect.objectContaining({
            table: 'automation_executions',
            operation: 'update',
            payload: expect.objectContaining({ status: 'success', error: null }),
        }));
        expect(db.writes).toContainEqual(expect.objectContaining({
            table: 'automations', operation: 'update',
            payload: expect.objectContaining({ execution_count: 1, success_count: 1 }),
        }));
    });

    it('skips duplicated events without creating tasks or touching counters', async () => {
        const db = fakeDatabase({ duplicate: true });
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result).toEqual([{
            automationId: 'automation-1', status: 'skipped', reason: 'duplicate_event',
        }]);
        expect(mocks.createActivity).not.toHaveBeenCalled();
        expect(db.writes.filter(write => write.operation === 'update')).toHaveLength(0);
    });

    it('persists unmatched conditions as skipped without creating an activity', async () => {
        const db = fakeDatabase();
        const definition = automation();
        definition.conditions = [{ field: 'stage', operator: 'equals', value: 'won', logic: 'AND' }];
        mocks.getAutomations.mockResolvedValue([definition]);
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result[0]).toMatchObject({ status: 'skipped', reason: 'conditions_not_met' });
        expect(mocks.createActivity).not.toHaveBeenCalled();
        expect(db.writes.find(write => write.table === 'automation_executions')).toMatchObject({
            operation: 'insert', payload: expect.objectContaining({ status: 'skipped' }),
        });
    });

    it('records only a sanitized failure when task creation fails', async () => {
        const db = fakeDatabase();
        mocks.createActivity.mockRejectedValue(new Error('sensitive database detail'));
        const result = await AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event());
        expect(result[0]).toMatchObject({ status: 'failed', reason: 'automation action failed' });
        const final = db.writes.find(write => write.table === 'automation_executions' && write.operation === 'update');
        expect(final?.payload).toMatchObject({ status: 'failed', error: 'automation action failed' });
        expect(JSON.stringify(db.writes)).not.toContain('sensitive database detail');
    });

    it('fails closed if finalization updates no execution row after the action', async () => {
        const db = fakeDatabase({ finalizationMissing: true });
        await expect(AutomationRuntimeService.executeEvent('user-a', 'tenant-a', event()))
            .rejects.toThrow('automation execution finalization failed');
        expect(mocks.createActivity).toHaveBeenCalledTimes(1);
        expect(db.writes.filter(write => write.table === 'automation_executions' && write.operation === 'update')).toHaveLength(1);
    });

    it('rejects tenant mismatch and malformed events before database access', async () => {
        const db = fakeDatabase();
        for (const invalid of [
            { ...event(), organizationId: 'tenant-b' },
            { ...event(), eventId: '' },
            { ...event(), entityId: '   ' },
            { ...event(), data: null },
            { ...event(), type: 'unrecognized' },
        ]) {
            await expect(AutomationRuntimeService.executeEvent(
                'user-a', 'tenant-a', invalid as AutomationRuntimeEvent,
            )).rejects.toThrow();
        }
        expect(mocks.getAutomations).not.toHaveBeenCalled();
        expect(db.from).not.toHaveBeenCalled();
    });
});
