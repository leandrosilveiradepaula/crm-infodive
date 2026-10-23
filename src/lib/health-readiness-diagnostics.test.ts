import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classifyReadinessFailure } from './health-readiness-diagnostics';
import { GET } from '../app/api/health/route';
import { createAdminClient } from './supabase/admin';
import { recordOperationalEvent } from './operational-events';

vi.mock('./supabase/admin', () => ({ createAdminClient: vi.fn() }));
vi.mock('./operational-events', () => ({ recordOperationalEvent: vi.fn() }));

const routeRequest = () => new Request('https://localhost/api/health');
const previousURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function simulateDb(result: { error: unknown; status: number }) {
    const limit = vi.fn().mockResolvedValue(result);
    const select = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ select });
    vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<typeof createAdminClient>);
    return { from, select, limit };
}

describe('database readiness classification, safe by construction', () => {
    it.each([
        [{ code: 'PGRST301', message: 'secret/invalid token' }, 401, 'db_credential_rejected'],
        [{ code: '42501', message: 'private schema name' }, 403, 'db_access_denied'],
        [{ code: 'PGRST205', message: 'missing public.profiles' }, 404, 'db_schema_unavailable'],
        [{ code: '42P01', message: 'missing internal table' }, 404, 'db_schema_unavailable'],
        [{ code: '08006', message: 'postgres connection details' }, 503, 'db_transport_unavailable'],
        [new TypeError('failed to fetch with private endpoint'), 0, 'db_transport_unavailable'],
        [{ code: 'unexpected', message: 'access_key=secret' }, 400, 'db_query_failed'],
    ] as const)('maps typed failure to a closed non-sensitive reason', (error, status, expected) => {
        expect(classifyReadinessFailure(error, status)).toBe(expected);
    });
});

describe('GET /api/health — preserve truthful health without leaking diagnostic details', () => {
    beforeEach(() => {
        vi.mocked(createAdminClient).mockReset();
        vi.mocked(recordOperationalEvent).mockReset();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only-not-a-credential';
    });
    afterEach(() => {
        if (previousURL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        else process.env.NEXT_PUBLIC_SUPABASE_URL = previousURL;
        if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    });

    it('checks the application table with a HEAD limit, without an exact COUNT', async () => {
        const probe = simulateDb({ error: null, status: 200 });
        const response = await GET(routeRequest());
        expect(response.status).toBe(200);
        expect((await response.json()).checks.database.status).toBe('ok');
        expect(probe.from).toHaveBeenCalledWith('profiles');
        expect(probe.select).toHaveBeenCalledWith('id', { head: true });
        expect(probe.limit).toHaveBeenCalledWith(1);
        expect(vi.mocked(recordOperationalEvent).mock.calls[0][0].scope).toBeUndefined();
    });

    it('keeps the raw error private; emits only a fixed enum in server logs', async () => {
        const secret = 'never-ever-log-this-example-credential';
        simulateDb({
            error: { code: 'PGRST205', message: secret, details: 'private/schemas', hint: 'private host' },
            status: 404,
        });
        const response = await GET(routeRequest());
        const body = await response.json();
        expect(response.status).toBe(503);
        expect(body.checks.database.status).toBe('failed');
        expect(body).not.toHaveProperty('databaseReason');
        expect(JSON.stringify(body)).not.toContain(secret);
        const event = vi.mocked(recordOperationalEvent).mock.calls[0][0];
        expect(event.scope).toBe('db_schema_unavailable');
        expect(event.level).toBe('warn');
        expect(JSON.stringify(event)).not.toContain(secret);
        expect(JSON.stringify(event)).not.toContain('private');
    });

    it('classifies credential errors without any key values in the public response', async () => {
        simulateDb({ error: { code: 'PGRST301', message: 'secret' }, status: 401 });
        const response = await GET(routeRequest());
        expect(response.status).toBe(503);
        expect((await response.json()).checks.database.status).toBe('failed');
        expect(vi.mocked(recordOperationalEvent).mock.calls[0][0].scope)
            .toBe('db_credential_rejected');
    });

    it('classifies network failures and keeps readiness degraded', async () => {
        vi.mocked(createAdminClient).mockImplementation(() => {
            throw new TypeError('private network endpoint');
        });
        const response = await GET(routeRequest());
        expect(response.status).toBe(503);
        expect(vi.mocked(recordOperationalEvent).mock.calls[0][0].scope)
            .toBe('db_transport_unavailable');
    });

    it('reports missing required admin-client key as configuration failure, not database failure', async () => {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
        const response = await GET(routeRequest());
        const body = await response.json();
        expect(response.status).toBe(503);
        expect(body.checks.configuration.status).toBe('failed');
        expect(body.checks.database).toBeUndefined();
        expect(createAdminClient).not.toHaveBeenCalled();
        expect(vi.mocked(recordOperationalEvent).mock.calls[0][0].scope)
            .toBe('configuration_missing');
    });
});
