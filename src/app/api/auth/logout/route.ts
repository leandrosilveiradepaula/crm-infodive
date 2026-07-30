import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const session = await getSession();
        session.destroy();

        const cookieStore = await cookies();
        cookieStore.delete('crm_access_token');
        cookieStore.delete('crm_provider_token');
        cookieStore.delete('crm_refresh_token');

        return NextResponse.json({ success: true });
    } catch {
        console.error('[AuthLogoutRoute] logout failed');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
