import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { ActivityService } from './ActivityService';

type DbResponse = { data: unknown; error: { code?: string; message?: string } | null };
type DbOperation = { table: string; mode: string; payload?: unknown; filters: [string, unknown][]; orders: string[] };
function mockDatabase(overrides: Record<string, DbResponse> = {}) {
    const queries: DbOperation[] = [];
    const response = (table: string, mode: string): DbResponse =>
        overrides[table + ':' + mode] ?? overrides[table] ??
        (mode === 'insert' || mode === 'update' || mode === 'delete'
            ? { data: { id: 'row-1' }, error: null }
            : { data: [], error: null });
    const from = vi.fn((table: string) => {
        const state: DbOperation = { table, mode: 'read', filters: [], orders: [] };
        queries.push(state);
        const builder = {
            select(_fields?: string) { return builder; },
            eq(name: string, value: unknown) { state.filters.push([name, value]); return builder; },
            neq(_name: string, _value: unknown) { return builder; },
            in(_name: string, _values: unknown[]) { return builder; },
            order(field: string, _options?: unknown) { state.orders.push(field); return builder; },
            limit(_amount: number) { return builder; },
            insert(payload: unknown) { state.mode = 'insert'; state.payload = payload; return builder; },
            update(payload: unknown) { state.mode = 'update'; state.payload = payload; return builder; },
            delete() { state.mode = 'delete'; return builder; },
            single() { return Promise.resolve(response(table, state.mode)); },
            maybeSingle() { return Promise.resolve(response(table, state.mode)); },
            then(resolve: (value: DbResponse) => unknown, reject?: (reason: unknown) => unknown) {
                return Promise.resolve(response(table, state.mode)).then(resolve, reject);
            },
        };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { queries, from };
}

describe('ActivityService offline data integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('sorts activities by real dueDate column and not a quoted column name', async () => {
        const db = mockDatabase({ activities: { data: [], error: null } });
        await ActivityService.getActivities('user-a', 'tenant-a');
        expect(db.queries.find(q => q.table === 'activities')?.orders).toEqual(['dueDate']);
    });

    it('rejects empty successful-looking database responses', async () => {
        mockDatabase({ activities: { data: null, error: null } });
        await expect(ActivityService.getActivities('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as atividades.');
        await expect(ActivityService.getUpcomingTasks('user-a', 'tenant-a'))
            .rejects.toThrow('Não foi possível carregar as tarefas próximas.');

        mockDatabase({ 'activities:insert': { data: null, error: null } });
        await expect(ActivityService.createActivity('user-a', 'tenant-a', { title: 'Contato', type: 'task' }))
            .rejects.toThrow('Não foi possível salvar a atividade.');
    });

    it('rejects blank related record identifiers before querying', async () => {
        const db = mockDatabase();
        await expect(ActivityService.createActivity('user-a', 'tenant-a', {
            title: 'Contato', dealId: '   ',
        })).rejects.toThrow('Referência de atividade inválida.');
        expect(db.queries).toHaveLength(0);
    });

    it('does not pretend a failed activity read is a valid empty result', async () => {
        mockDatabase({ activities: { data: null, error: { message: 'database unavailable' } } });
        await expect(ActivityService.getActivities('user-a', 'tenant-a')).rejects.toThrow('Não foi possível carregar as atividades.');
        await expect(ActivityService.getUpcomingTasks('user-a', 'tenant-a')).rejects.toThrow('Não foi possível carregar as tarefas próximas.');
    });

    it('fails closed on related deal/account read errors and retains tenant filters', async () => {
        const activity = { id: 'activity-1', deal_id: 'deal-1', account_id: 'account-1', title: 'Follow up' };
        const db = mockDatabase({
            activities: { data: [activity], error: null },
            deals: { data: null, error: { message: 'join failed' } },
        });
        await expect(ActivityService.getActivities('user-a', 'tenant-a')).rejects.toThrow('Não foi possível carregar os vínculos');
        expect(db.queries.filter(q => q.table === 'deals')[0].filters).toContainEqual(['organization_id', 'tenant-a']);

        const second = mockDatabase({
            activities: { data: [activity], error: null },
            deals: { data: [{ id: 'deal-1', title: 'Opportunity' }], error: null },
            accounts: { data: null, error: { message: 'join failed' } },
        });
        await expect(ActivityService.getActivities('user-a', 'tenant-a')).rejects.toThrow('Não foi possível carregar os vínculos');
        expect(second.queries.filter(q => q.table === 'accounts')[0].filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('does not claim success for a zero-row update or delete', async () => {
        const db = mockDatabase({
            'activities:update': { data: null, error: null },
            'activities:delete': { data: null, error: null },
        });
        await expect(ActivityService.updateActivity('user-a', 'absent-id', 'tenant-a', { title: 'Test' }))
            .rejects.toThrow('Não foi possível atualizar a atividade.');
        await expect(ActivityService.deleteActivity('user-a', 'absent-id', 'tenant-a'))
            .rejects.toThrow('Não foi possível excluir a atividade.');
        for (const operation of db.queries.filter(q => q.table === 'activities')) {
            expect(operation.filters).toContainEqual(['organization_id', 'tenant-a']);
            expect(operation.filters).toContainEqual(['id', 'absent-id']);
        }
    });

    it('rejects foreign-tenant linked records before inserting activities', async () => {
        const db = mockDatabase({ deals: { data: null, error: null } });
        await expect(ActivityService.createActivity('user-a', 'tenant-a', {
            title: 'Follow up', dealId: 'foreign-deal', type: 'task', assignedTo: 'user-a',
        })).rejects.toThrow('Referência de atividade não encontrada nesta organização.');
        expect(db.queries.some(q => q.table === 'activities' && q.mode === 'insert')).toBe(false);
        expect(db.queries.find(q => q.table === 'deals')?.filters).toContainEqual(['organization_id', 'tenant-a']);
    });

    it('permits valid links and preserves internal automation task origin', async () => {
        const db = mockDatabase({
            deals: { data: { id: 'deal-1' }, error: null },
            'activities:insert': { data: { id: 'activity-1' }, error: null },
        });
        await expect(ActivityService.createActivity('user-a', 'tenant-a', {
            title: 'follow up', type: 'task', dealId: 'deal-1',
            assignedTo: 'user-a', source: 'automation',
        })).resolves.toMatchObject({ id: 'activity-1' });
        const write = db.queries.find(q => q.table === 'activities' && q.mode === 'insert');
        expect(write?.payload).toEqual([expect.objectContaining({
            title: 'Follow Up', organization_id: 'tenant-a', deal_id: 'deal-1', source: 'automation',
        })]);
    });

    it('validates new activity titles before writing', async () => {
        const db = mockDatabase();
        await expect(ActivityService.createActivity('user-a', 'tenant-a', { title: '   ' }))
            .rejects.toThrow('Título de atividade inválido.');
        expect(db.queries).toHaveLength(0);
    });

    it('forces manually created activities to manual source in the public server action', () => {
        const source = readFileSync('src/app/(dashboard)/activities/actions.ts', 'utf8');
        expect(source).toContain("{ ...activity, source: 'manual' }");
        expect(source).toContain('requireSessionContext()');
    });
});
