import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const session = await getIronSession<SessionData>(
        request,
        response,
        sessionOptions
    )

    const { pathname } = request.nextUrl

    // Allow public routes
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api/auth') || // Para login/logout route
        pathname.startsWith('/api/proposals/public') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'
    ) {
        return response;
    }

    // Protect routes
    if (!session.isLoggedIn || !session.userId) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Build new request headers forwarding auth context
    const requestHeaders = new Headers(request.headers)

    // Inject userId for BFF security layer
    requestHeaders.set('X-User-Id', session.userId)

    // Inject the Supabase JWT from cookie so Server Actions can build an authenticated client
    const accessToken = request.cookies.get('crm_access_token')?.value
    if (accessToken) {
        requestHeaders.set('X-Supabase-Token', accessToken)
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    })
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
