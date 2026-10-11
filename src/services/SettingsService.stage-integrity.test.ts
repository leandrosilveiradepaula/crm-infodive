import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SettingsService, type PipelineStage } from './SettingsService';

type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: Array<[string, unknown]>; payload?: unknown };
const initial: PipelineStage = { id: '1', name: 'Qualificação', color: '#abcdef', order_index: 0 };
const uuid = '11111111-1111-4111-8111-111111111111';
function db(results: Record<string, Result | Result[]> = {}) {
    const operations: Op[] = [];
    const queued = new Map(Object.entries(results).map(([k, v]) => [k, Array.isArray(v) ? [...v] : [v]]));
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        operations.push(op);
        const take = (): Result => {
            const key = table + ':' + op.mode;
            const queue = queued.get(key) ?? queued.get(table);
            if (queue && queue.length) return queue.shift()!;
            if (op.mode === 'upsert') {
                return { data: (op.payload as Array<{ id: string }>).map(x => ({ id: x.id })), error: null };
            }
            return { data: [], error: null };
        };
        const q = {
            select() { return q; },
            eq(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            in(k: string, v: unknown) { op.filters.push([k, v]); return q; },
            delete() { op.mode = 'delete'; return q; },
            upsert(payload: unknown) { op.mode = 'upsert'; op.payload = payload; return q; },
            then(ok: (v: Result) => unknown) { return Promise.resolve(take()).then(ok); },
        };
        return q;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations, from };
}
describe('pipeline stages fail-closed persistence', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects invalid CSS colors and case-folded duplicate names without database writes', async () => {
        const x = db();
        for (const input of [
            [{ ...initial, color: 'url(http://example.test)' }],
            [initial, { ...initial, id: '2', name: ' qualificação ' }],
        ]) {
            await expect(SettingsService.savePipelineStages('tenant-a', input))
                .resolves.toMatchObject({ success: false });
        }
        expect(x.from).not.toHaveBeenCalled();
    });

    it('converts UI-only default stage IDs to real UUIDs before persistence', async () => {
        const x = db();
        await expect(SettingsService.savePipelineStages('tenant-a', [initial]))
            .resolves.toMatchObject({ success: true });
        const record = (x.operations.find(op => op.mode === 'upsert')?.payload as Array<PipelineStage & { organization_id: string }>)[0];
        expect(record.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(record.id).not.toBe('1');
        expect(record.organization_id).toBe('tenant-a');
    });

    it('refuses a duplicate or malformed database stage list before any write', async () => {
        const x = db({ 'pipeline_stages:read': { data: [{ id: uuid }, { id: uuid }], error: null } });
        await expect(SettingsService.savePipelineStages('tenant-a', [initial]))
            .resolves.toMatchObject({ success: false });
        expect(x.operations.every(op => op.mode === 'read')).toBe(true);
    });

    it('refuses stale placeholder IDs after another session persisted real stages', async () => {
        const x = db({ 'pipeline_stages:read': { data: [{ id: uuid }], error: null } });
        await expect(SettingsService.savePipelineStages('tenant-a', [initial]))
            .resolves.toMatchObject({ success: false });
        expect(x.operations.every(op => op.mode === 'read')).toBe(true);
    });

    it('rejects an unexpected collision result even when it names the current tenant', async () => {
        const x = db({ 'pipeline_stages:read': [
            { data: [], error: null },
            { data: [{ id: 'unexpected', organization_id: 'tenant-a' }], error: null },
        ] });
        await expect(SettingsService.savePipelineStages('tenant-a', [initial]))
            .resolves.toMatchObject({ success: false });
        expect(x.operations.every(op => op.mode === 'read')).toBe(true);
    });

    it('requires exact deleted IDs, not just the expected number of affected rows', async () => {
        const x = db({
            'pipeline_stages:read': [
                { data: [{ id: uuid }], error: null },
                { data: [], error: null },
            ],
            'pipeline_stages:delete': { data: [{ id: 'wrong' }], error: null },
        });
        await expect(SettingsService.savePipelineStages('tenant-a', [
            { ...initial, id: '22222222-2222-4222-8222-222222222222' },
        ])).resolves.toMatchObject({ success: false });
        expect(x.operations.some(op => op.mode === 'upsert')).toBe(false);
        expect(x.operations.find(op => op.mode === 'delete')?.filters)
            .toContainEqual(['organization_id', 'tenant-a']);
    });

    it('rejects mismatched upsert IDs even with an equal row count', async () => {
        db({
            'pipeline_stages:read': { data: [], error: null },
            'pipeline_stages:upsert': { data: [{ id: 'wrong' }], error: null },
        });
        await expect(SettingsService.savePipelineStages('tenant-a', [initial]))
            .resolves.toMatchObject({ success: false });
    });

    it('preserves real stage IDs and verifies exact persistence for an update', async () => {
        const x = db({ 'pipeline_stages:read': { data: [{ id: uuid }], error: null } });
        await expect(SettingsService.savePipelineStages('tenant-a', [
            { ...initial, id: uuid, name: ' Proposta ' },
        ])).resolves.toMatchObject({ success: true });
        const payload = (x.operations.find(op => op.mode === 'upsert')?.payload as PipelineStage[])[0];
        expect(payload.id).toBe(uuid);
        expect(payload.name).toBe('Proposta');
    });
});
