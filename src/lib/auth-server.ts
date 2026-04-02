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

    // Fallback: look up organizationId and status from Supabase
    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('organization_id, status')
        .eq('id', session.userId)
        .single();
    
    if (profileError || !profile) {
        throw new Error('Unauthorized: Profile not found or database error.');
    }

    if (profile.status === 'inactive') {
        throw new Error('Unauthorized: This account has been deactivated. Contact your administrator.');
    }

    const organizationId = profile.organization_id;

    if (!organizationId) {
        throw new Error('Unauthorized: Could not determine organization for this user. Contact support.');
    }

    return { userId: session.userId, organizationId };
}
