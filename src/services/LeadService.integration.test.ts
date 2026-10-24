import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mocks.createAdminClient }));
import { LeadService } from './LeadService';

type DbResult = { data: unknown; error: { message?: string } | null };
type Op = { table: string; mode: 'read' | 'insert' | 'update' | 'delete'; payload?: unknown; filters: [string, unknown][] };
function fakeDb(overrides: Record<string, DbResult> = {}) {
    const ops: Op[] = [];
    const from = vi.fn((table: string) => {
        const op: Op = { table, mode: 'read', filters: [] };
        ops.push(op);
        const builder = {
            select() { return builder; },
            eq(key: string, value: unknown) { op.filters.push([key, value]); return builder; },
            order() { return builder; },
            insert(payload: unknown) { op.mode = 'insert'; op.payload = payload; return builder; },
            update(payload: unknown) { op.mode = 'update'; op.payload = payload; return builder; },
            delete() { op.mode = 'delete'; return builder; },
            single() { return Promise.resolve(take()); },
            maybeSingle() { return Promise.resolve(take()); },
            then(ok: (result: DbResult) => unknown, fail?: (error: unknown) => unknown) {
                return Promise.resolve(take()).then(ok, fail);
            },
        };
        const take = (): DbResult => overrides[table + ':' + op.mode] || overrides[table] ||
            { data: op.mode === 'read' ? [] : { id: 'saved' }, error: null };
        return builder;
    });
    mocks.createAdminClient.mockReturnValue({ from });
    return { ops, from };
}

describe('LeadService offline integrity guards', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fails closed on database errors and malformed lead list data', async () => {
        fakeDb({ 'leads:read': { data: null, error: { message: 'unavailable' } } });
        await expect(LeadService.getLeads('user', 'tenant')).rejects.toThrow('Não foi possível carregar os leads.');
        fakeDb({ 'leads:read': { data: null, error: null } });
        await expect(LeadService.getLeads('user', 'tenant')).rejects.toThrow('Não foi possível carregar os leads.');
        fakeDb({ 'leads:read': { data: { invalid: true }, error: null } });
        await expect(LeadService.getLeads('user', 'tenant')).rejects.toThrow('Não foi possível carregar os leads.');
    });

    it('rejects missing company before writing and requires a persisted row', async () => {
        const db = fakeDb();
        await expect(LeadService.createLead('user', 'tenant', { company: ' ' }))
            .rejects.toThrow('Empresa do lead inválida.');
        expect(db.ops).toHaveLength(0);

        fakeDb({ 'leads:insert': { data: null, error: null } });
        await expect(LeadService.createLead('user', 'tenant', { company: 'Acme' }))
            .rejects.toThrow('Não foi possível salvar o lead.');
    });

    it('whitelists create fields and forces current tenant over caller input', async () => {
        const db = fakeDb();
        await LeadService.createLead('user', 'tenant', {
            company: 'acme ltda', contact_name: 'ana de souza', id: 'forged',
            organization_id: 'foreign', created_at: 'forged', updated_at: 'forged',
        });
        const mutation = db.ops.find(op => op.mode === 'insert');
        expect(mutation?.payload).toEqual([expect.objectContaining({
            organization_id: 'tenant', company: 'Acme Ltda', contact_name: 'Ana de Souza',
        })]);
        const row = (mutation?.payload as Record<string, unknown>[])[0];
        expect(row).not.toHaveProperty('id');
        expect(row).not.toHaveProperty('created_at');
        expect(row).not.toHaveProperty('updated_at');
    });

    it('whitelists update fields and rejects immutable-only payloads', async () => {
        const db = fakeDb({ 'leads:update': { data: { id: 'lead-a' }, error: null } });
        await LeadService.updateLead('user', 'lead-a', 'tenant', {
            company: 'acme', id: 'spoof', organization_id: 'foreign', created_at: 'spoof',
        });
        const operation = db.ops.find(op => op.mode === 'update');
        expect(operation?.payload).toEqual({ company: 'Acme' });
        expect(operation?.filters).toContainEqual(['organization_id', 'tenant']);

        const empty = fakeDb();
        await expect(LeadService.updateLead('user', 'lead-a', 'tenant', {
            id: 'forged', organization_id: 'other',
        })).rejects.toThrow('Nenhuma alteração permitida.');
        expect(empty.ops).toHaveLength(0);
    });

    it('does not report update success if no tenant-scoped row changed', async () => {
        fakeDb({ 'leads:update': { data: null, error: null } });
        await expect(LeadService.updateLead('user', 'missing', 'tenant', { company: 'Acme' }))
            .rejects.toThrow('Não foi possível atualizar o lead.');
    });

    it('does not report deletion success without a tenant-scoped affected row', async () => {
        const db = fakeDb({ 'leads:delete': { data: null, error: null } });
        await expect(LeadService.deleteLead('user', 'missing', 'tenant'))
            .rejects.toThrow('Não foi possível excluir o lead.');
        const deletion = db.ops.find(op => op.mode === 'delete');
        expect(deletion?.filters).toContainEqual(['organization_id', 'tenant']);
        expect(deletion?.filters).toContainEqual(['id', 'missing']);
    });
});
