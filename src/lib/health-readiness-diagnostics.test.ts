import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyReadinessFailure } from './health-readiness-diagnostics';

describe('database readiness — closed and non-sensitive error classification', () => {
    it.each([
        [{ code: 'PGRST301', message: 'secret/invalid token' }, 401, 'db_credential_rejected'],
        [{ code: '28P01', message: 'private password' }, 401, 'db_credential_rejected'],
        [{ code: '42501', message: 'private schema name' }, 403, 'db_access_denied'],
        [{ code: 'PGRST205', message: 'missing public.profiles' }, 404, 'db_schema_unavailable'],
        [{ code: '42P01', message: 'missing internal table' }, 404, 'db_schema_unavailable'],
        [{ code: '08006', message: 'postgres connection details' }, 503, 'db_transport_unavailable'],
        [new TypeError('failed to fetch with private endpoint'), 0, 'db_transport_unavailable'],
        [{ message: 'fetch failed without provider code' }, 0, 'db_transport_unavailable'],
        [{ code: 'unexpected', message: 'access_key=secret' }, 400, 'db_query_failed'],
    ] as const)('classifies a provider failure without forwarding raw text', (error, status, expected) => {
        expect(classifyReadinessFailure(error, status)).toBe(expected);
        expect(classifyReadinessFailure(error, status)).not.toContain('private');
        expect(classifyReadinessFailure(error, status)).not.toContain('secret');
    });

    it('falls back to safe fixed categories for HTTP 401/403/500 without provider codes', () => {
        expect(classifyReadinessFailure({ message: 'secret' }, 401)).toBe('db_credential_rejected');
        expect(classifyReadinessFailure({ message: 'secret' }, 403)).toBe('db_access_denied');
        expect(classifyReadinessFailure({ message: 'secret' }, 503)).toBe('db_transport_unavailable');
        expect(classifyReadinessFailure({ message: 'secret' })).toBe('db_query_failed');
    });

    it('does not accept arbitrary provider data as part of operational category', () => {
        const message = 'SECRET abc@example.com https://private.internal/schema?q=1';
        for (const error of [
            { message }, { code: message, details: message }, new Error(message),
        ]) {
            const output = classifyReadinessFailure(error);
            expect(output).toMatch(/^db_(credential_rejected|access_denied|schema_unavailable|transport_unavailable|query_failed)$/);
            expect(output).not.toContain('SECRET');
            expect(output).not.toContain('example.com');
        }
    });
});

describe('public readiness route source contract', () => {
    // The CRM Vitest runner does not resolve Next.js '@/...' module aliases.
    // Confirm the wiring contract here; TypeScript/build compile the route.
    // A deployed Preview HTTP probe separately verifies its real runtime.
    const source = readFileSync('src/app/api/health/route.ts', 'utf8');

    it('makes a bounded HEAD check of the real profiles table without exact count', () => {
        expect(source).toContain("from('profiles').select('id', { head: true }).limit(1)");
        expect(source).not.toContain("count: 'exact'");
        expect(source).toContain('if (error) {');
        expect(source).toContain('failureReason = classifyReadinessFailure(error, databaseStatus);');
        expect(source).toContain('failureReason ??= classifyReadinessFailure(error);');
    });

    it('keeps the public response minimal and preserves real 503 on database failure', () => {
        expect(source).toContain("status: status === 'ok' ? 200 : 503");
        expect(source).toContain('scope: failureReason,');
        expect(source).toContain("level: status === 'degraded' ? 'warn' : 'info'");
        const body = source.slice(source.indexOf('const body = {'), source.indexOf('return NextResponse.json'));
        expect(body).not.toContain('failureReason');
        expect(body).not.toContain('error');
        expect(body).toContain('checks,');
        expect(body).toContain('requestId,');
        expect(source).not.toContain('console.error(error)');
        expect(source).not.toContain('JSON.stringify(error)');
    });

    it('checks the credential actually required by the admin client', () => {
        expect(source).toContain('!process.env.SUPABASE_SERVICE_ROLE_KEY');
        expect(source).toContain("failureReason = 'configuration_missing'");
        expect(source).toContain("checks.configuration = { status: 'failed' }");
    });
});
