import { headers } from 'next/headers';
import { getSession } from './session';
import { createAdminClient } from './supabase/admin';

/**
 * Reads the X-User-Id header injected by middleware.
 * Acts as a fast-path security layer for API routes.
 */
export async function requireUserId(): Promise<string> {
    const headersList = await headers();
    const headerUserId = headersList.get('X-User-Id');

    if (!headerUserId) {
        throw new Error('Unauthorized API Access: Missing X-User-Id header');
    }

    return headerUserId;
}

/**
 * Returns the full server-side auth context from Iron Session.
 * Use this in all Server Actions / Services that need tenant context.
 *
 * organizationId comes from Iron Session (set at login).
 * If not in session (old sessions), it is fetched from auth.users via admin client
 * and saved back to the session automatically — no logout required.
 */
export async function requireSessionContext(): Promise<{ userId: string; organizationId: string }> {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
        throw new Error('Unauthorized: No active session');
    }

    // Fast path: organizationId already in session
    if (session.organizationId) {
        return { userId: session.userId, organizationId: session.organizationId };
    }

    // Fallback: look up organizationId from Supabase (for sessions created before this fix)
    const adminClient = createAdminClient();

    // 1. Try auth.users metadata first (most authoritative)
    const { data: authUser } = await adminClient.auth.admin.getUserById(session.userId);
    let organizationId: string | undefined = authUser?.user?.user_metadata?.organization_id;

    // 2. Fallback: try profiles table
    if (!organizationId) {
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', session.userId)
            .single();
        organizationId = profile?.organization_id;
    }

    if (!organizationId) {
        throw new Error('Unauthorized: Could not determine organization for this user. Contact support.');
    }

    // Note: we don't call session.save() here because this function may be called
    // from Server Component context where cookies are read-only.
    // The DB lookup runs per-request until the user logs in fresh and gets a
    // new session with organizationId already stored.
    return { userId: session.userId, organizationId };
}
