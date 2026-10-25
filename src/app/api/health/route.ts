import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestId } from '@/lib/request-context';
import { recordOperationalEvent } from '@/lib/operational-events';
import { classifyReadinessFailure, type ReadinessFailureReason } from '@/lib/health-readiness-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const startedAt = Date.now();
    const requestId = getRequestId(request.headers.get('X-Request-Id'));
    const checks: Record<string, { status: 'ok' | 'failed'; latencyMs?: number }> = {};
    let status: 'ok' | 'degraded' = 'ok';
    let failureReason: ReadinessFailureReason | 'configuration_missing' | undefined;

    // createAdminClient currently requires the legacy service role key. Do
    // not report configuration ready when only an unsupported key is present.
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        checks.configuration = { status: 'failed' };
        failureReason = 'configuration_missing';
        status = 'degraded';
    } else {
        checks.configuration = { status: 'ok' };
        const dbStartedAt = Date.now();
        try {
            const supabase = createAdminClient();
            // HEAD with a small row limit probes the actual application table
            // without an unnecessary exact table-wide COUNT on every health GET.
            const { error, status: databaseStatus } = await supabase
                .from('profiles').select('id', { head: true }).limit(1);
            if (error) {
                failureReason = classifyReadinessFailure(error, databaseStatus);
                throw error;
            }
            checks.database = { status: 'ok', latencyMs: Date.now() - dbStartedAt };
        } catch (error: unknown) {
            failureReason ??= classifyReadinessFailure(error);
            checks.database = { status: 'failed', latencyMs: Date.now() - dbStartedAt };
            status = 'degraded';
        }
    }

    const durationMs = Date.now() - startedAt;
    const databaseLatencyMs = checks.database?.latencyMs;

    // Logs contain only enum values, never raw PostgREST messages, auth keys,
    // database URLs or row data. The public health response remains minimal.
    recordOperationalEvent({
        level: status === 'degraded' ? 'warn' : 'info',
        area: 'health',
        operation: 'readiness',
        outcome: status,
        scope: failureReason,
        requestId,
        durationMs,
        statusCode: status === 'ok' ? 200 : 503,
    });

    const body = {
        status,
        service: 'crm-infodive',
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.GIT_COMMIT_SHA?.slice(0, 12) || 'unknown',
        requestId,
        checks,
        durationMs,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(body, {
        status: status === 'ok' ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
            'X-Request-Id': requestId,
            'Server-Timing': [
                databaseLatencyMs !== undefined ? `db;dur=${databaseLatencyMs}` : null,
                `total;dur=${durationMs}`,
            ].filter(Boolean).join(', '),
        },
    });
}
