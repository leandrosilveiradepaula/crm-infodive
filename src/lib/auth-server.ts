import { headers } from 'next/headers';
import { getSession } from './session';
import { createAdminClient } from './supabase/admin';

export interface AuthorizedSessionContext {
    userId: string;
    organizationId: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fail closed on every privileged request. The signed Iron Session proves who
 * signed in, NOT whether that profile remains active or belongs to the same
 * organization. Always use the trusted server-side profiles row.
 *
 * Never use JWT user_metadata, an X-User-Id supplied by a client or the old
 * organizationId cached in an Iron Session for authorization.
 */
export async function requireSessionContext(): Promise<AuthorizedSessionContext> {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId || !UUID.test(session.userId)) {
        throw new Error('Unauthorized: No active session');
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
        .from('profiles')
        .select('organization_id,status')
        .eq('id', session.userId)
        .maybeSingle();

    if (error || !profile || profile.status !== 'active' ||
        typeof profile.organization_id !== 'string' ||
        !UUID.test(profile.organization_id)) {
        throw new Error('Unauthorized: Profile unavailable, inactive or without organization');
    }

    return {
        userId: session.userId,
        organizationId: profile.organization_id,
    };
}

/** A middleware-injected header is an assertion, not an authority. */
export async function requireUserId(): Promise<string> {
    const context = await requireSessionContext();
    const requestHeaders = await headers();
    if (requestHeaders.get('X-User-Id') !== context.userId) {
        throw new Error('Unauthorized: Invalid user header');
    }
    return context.userId;
}
