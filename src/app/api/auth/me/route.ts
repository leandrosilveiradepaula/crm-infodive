import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { requireSessionContext } from '@/lib/auth-server';
import { UserService } from '@/services/UserService';

export async function GET() {
    try {
        const session = await getSession();
        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, organizationId } = await requireSessionContext();
        const profileRes = await UserService.getUserProfile(userId, organizationId);
        if (!profileRes.success || !profileRes.data) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
            isLoggedIn: true,
            userId,
            profile: profileRes.data,
        });
    } catch {
        console.error('[AuthMeRoute] me request failed');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
