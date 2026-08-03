import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { UserService } from '@/services/UserService';

export async function GET() {
    try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.userId || !session.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profileRes = await UserService.getUserProfile(session.userId, session.organizationId);

        return NextResponse.json({
            isLoggedIn: session.isLoggedIn,
            userId: session.userId,
            profile: profileRes.success ? profileRes.data : null,
        });
    } catch {
        console.error('[AuthMeRoute] me request failed');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
