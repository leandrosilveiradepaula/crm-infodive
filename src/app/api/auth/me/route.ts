import { NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { UserService } from '@/services/UserService';

/** The session's cached organizationId is NOT a source of authority. */
export async function GET() {
    try {
        const { userId, organizationId } = await requireSessionContext();
        const profileRes = await UserService.getUserProfile(userId, organizationId);
        if (!profileRes.success || !profileRes.data) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ isLoggedIn: true, userId, profile: profileRes.data });
    } catch {
        // Revoked/invalid profiles and unavailable backends always fail closed.
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
