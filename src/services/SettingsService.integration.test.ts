import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { SettingsService } from './SettingsService';

type Result = { data: unknown; error: { message: string } | null };
type Op = { table: string; mode: string; filters: Array<[string, unknown]>; payload?: unknown };
function fakeDb(responses: Record<string, Result | Result[]> = {}) {
    const operations: Op[] = [];
    const queues = new Map(Object.entries(responses).map(([key, result]) =>
        [key, Array.isArray(result) ? [...result] : [result]]
    ));
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        operations.push(op);
        const builder = {
            select() { return builder; },
            eq(key: string, value: unknown) { op.filters.push([key, value]); return builder; },
            in(key: string, value: unknown) { op.filters.push([key, value]); return builder; },
            order() { return builder; },
            delete() { op.mode = 'delete'; return builder; },
            upsert(value: unknown) { op.mode = 'upsert'; op.payload = value; return builder; },
            maybeSingle() { return Promise.resolve(take()); },
            then(resolve: (value: Result) => unknown, reject?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(resolve, reject);
            },
        };
        function take(): Result {
            const queued = queues.get(table + ':' + op.mode) ?? queues.get(table);
            if (queued?.length) return queued.shift()!;
            return { data: op.mode === 'read' ? [] : [{ id: 'saved' }], error: null };
        }
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { operations };
}
const stage = { id: '1', name: 'Qualificação', color: '#abcdef', order_index: 0 };

describe('SettingsService tenant and persistence integrity', () => {
    beforeEach(() => vi.clearAllMocks());

    it('distinguishes missing org settings from database failures and malformed values', async () => {
        fakeDb({ 'app_settings:read': { data: null, error: null } });
        await expect(SettingsService.getOrgSettings('tenant')).resolves.toEqual({
            name: '', support_email: '',
        });
        fakeDb({ 'app_settings:read': { data: null, error: { message: 'DB down' } } });
        await expect(SettingsService.getOrgSettings('tenant'))
            .rejects.toThrow('Não foi possível carregar as configurações da organização.');
        fakeDb({ 'app_settings:read': { data: { value: [] }, error: null } });
        await expect(SettingsService.getOrgSettings('tenant'))
            .rejects.toThrow('Configurações da organização inválidas.');
    });

    it('rejects invalid org settings before I/O and strips unknown keys on valid save', async () => {
        const db = fakeDb({
            'app_settings:upsert': { data: { key: 'organization' }, error: null },
        });
        await expect(SettingsService.saveOrgSettings('tenant', null as never))
            .resolves.toMatchObject({ success: false });
        expect(db.operations).toHaveLength(0);

        await expect(SettingsService.saveOrgSettings('tenant', {
            name: 'Infodive', support_email: 'support@example.com', organization_id: 'forged',
        } as never)).resolves.toMatchObject({ success: true });
        const write = db.operations.find(op => op.mode === 'upsert');
        expect(write?.payload).toMatchObject({ organization_id: 'tenant' });
        expect((write?.payload as { value: Record<string, unknown> }).value)
            .not.toHaveProperty('organization_id');
    });

    it('refuses partial organization replacement before erasing existing mandatory fields', async () => {
        const db = fakeDb({});
        await expect(SettingsService.saveOrgSettings('tenant', {
            logo_url: 'https://example.test/logo.png',
        } as never)).resolves.toMatchObject({ success: false });
        expect(db.operations).toHaveLength(0);
    });

    it('does not report org-setting save success when no row was persisted', async () => {
        fakeDb({ 'app_settings:upsert': { data: null, error: null } });
        await expect(SettingsService.saveOrgSettings('tenant', {
            name: 'Infodive', support_email: 'support@example.com',
        })).resolves.toMatchObject({ success: false });
    });

    it('returns default stages only for a legitimate empty list', async () => {
        fakeDb({ 'pipeline_stages:read': { data: [], error: null } });
        const defaults = await SettingsService.getPipelineStages('tenant');
        expect(defaults.length).toBeGreaterThan(0);
        fakeDb({ 'pipeline_stages:read': { data: null, error: null } });
        await expect(SettingsService.getPipelineStages('tenant'))
            .rejects.toThrow('Não foi possível carregar as etapas do pipeline.');
    });

    it('rejects duplicate, empty, malformed or excessive stages before database writes', async () => {
        const db = fakeDb({});
        for (const input of [
            [], [stage, stage],
            [{ ...stage, name: ' ' }],
            Array.from({ length: 31 }, (_, i) => ({ ...stage, id: String(i) })),
        ]) {
            await expect(SettingsService.savePipelineStages('tenant', input))
                .resolves.toMatchObject({ success: false });
        }
        expect(db.operations).toHaveLength(0);
    });

    it('does not delete stages when reading existing tenant stages failed', async () => {
        const db = fakeDb({
            'pipeline_stages:read': { data: null, error: { message: 'DB down' } },
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: false });
        expect(db.operations.every(op => op.mode !== 'delete' && op.mode !== 'upsert')).toBe(true);
    });

    it('rejects a new stage ID already belonging to another tenant before writes', async () => {
        const db = fakeDb({
            'pipeline_stages:read': [
                { data: [], error: null },
                { data: [{ id: '1', organization_id: 'foreign-tenant' }], error: null },
            ],
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: false });
        const reads = db.operations.filter(op => op.table === 'pipeline_stages' && op.mode === 'read');
        expect(reads[1]?.filters).toContainEqual(['id', ['1']]);
        expect(db.operations.every(op => op.mode !== 'delete' && op.mode !== 'upsert')).toBe(true);
    });

    it('does not proceed if cross-tenant stage collision detection fails', async () => {
        const db = fakeDb({
            'pipeline_stages:read': [
                { data: [], error: null },
                { data: null, error: { message: 'DB lookup failed' } },
            ],
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: false });
        expect(db.operations.every(op => op.mode !== 'delete' && op.mode !== 'upsert')).toBe(true);
    });

    it('scopes deletion by tenant and rejects missing deleted rows', async () => {
        const db = fakeDb({
            'pipeline_stages:read': { data: [{ id: 'old' }], error: null },
            'pipeline_stages:delete': { data: [], error: null },
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: false });
        const deletion = db.operations.find(op => op.mode === 'delete');
        expect(deletion?.filters).toContainEqual(['organization_id', 'tenant']);
        expect(deletion?.filters).toContainEqual(['id', ['old']]);
        expect(db.operations.every(op => op.mode !== 'upsert')).toBe(true);
    });

    it('requires all pipeline upserts to return persisted rows', async () => {
        fakeDb({
            'pipeline_stages:read': { data: [], error: null },
            'pipeline_stages:upsert': { data: [], error: null },
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: false });

        const db = fakeDb({
            'pipeline_stages:read': { data: [], error: null },
            'pipeline_stages:upsert': { data: [{ id: '1' }], error: null },
        });
        await expect(SettingsService.savePipelineStages('tenant', [stage]))
            .resolves.toMatchObject({ success: true });
        expect(db.operations.find(op => op.mode === 'upsert')?.payload)
            .toEqual([{ id: '1', name: 'Qualificação', color: '#abcdef', order_index: 0, organization_id: 'tenant' }]);
    });
});
