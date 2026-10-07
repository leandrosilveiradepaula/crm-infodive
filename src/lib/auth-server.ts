import { headers } from 'next/headers';
import { getSession } from './session';
import { createAdminClient } from './supabase/admin';
import { hasPermission } from './permissions';
import type { Permission } from '@/types/auth';

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

    // Authorization is revalidated against the server-side profile on every protected action.
    // The Iron Session organizationId is a cache/hint only and is never authoritative.
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

    if (session.organizationId !== organizationId) {
        session.organizationId = organizationId;
        await session.save();
    }

    return { userId: session.userId, organizationId };
}

export async function requirePermission(permission: Permission): Promise<{ userId: string; organizationId: string }> {
    const { userId, organizationId } = await requireSessionContext();
    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
        .from('profiles')
        .select('role, roles, status, organization_id')
        .eq('id', userId)
        .eq('organization_id', organizationId)
        .single();

    if (error || !profile || profile.status === 'inactive') {
        throw new Error('Forbidden: active profile required');
    }

    if (!hasPermission(profile.role, profile.roles, permission)) {
        throw new Error(`Forbidden: missing permission ${permission}`);
    }

    return { userId, organizationId };
}
