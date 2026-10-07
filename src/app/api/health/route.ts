import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const startedAt = Date.now();
    const requestId = getRequestId(request.headers.get('X-Request-Id'));
    const checks: Record<string, { status: 'ok' | 'failed'; latencyMs?: number }> = {};
    let status: 'ok' | 'degraded' = 'ok';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        checks.configuration = { status: 'failed' };
        status = 'degraded';
    } else {
        checks.configuration = { status: 'ok' };
        const dbStartedAt = Date.now();
        try {
            const supabase = createAdminClient();
            const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1);
            if (error) throw error;
            checks.database = { status: 'ok', latencyMs: Date.now() - dbStartedAt };
        } catch {
            checks.database = { status: 'failed', latencyMs: Date.now() - dbStartedAt };
            status = 'degraded';
        }
    }

    const body = {
        status,
        service: 'crm-infodive',
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || process.env.GIT_COMMIT_SHA?.slice(0, 12) || 'unknown',
        requestId,
        checks,
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(body, {
        status: status === 'ok' ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store',
            'X-Request-Id': requestId,
        },
    });
}
