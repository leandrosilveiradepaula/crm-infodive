import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const PUBLIC_PATHS = new Set([
    '/login',
    '/auth/callback',
    '/api/auth/logout',
    '/api/proposals/sign',
])

const PUBLIC_PATTERNS = [
    /^\/proposals\/public\/[a-f0-9]{16,32}$/i,
    /^\/portal\/[a-f0-9]{32}$/i,
    /^\/api\/proposals\/public\/[a-f0-9]{16,32}$/i,
]

function isPublicRoute(pathname: string) {
    return PUBLIC_PATHS.has(pathname) || PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname))
}

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const session = await getIronSession<SessionData>(
        request,
        response,
        sessionOptions
    )

    const { pathname } = request.nextUrl

    // Allow only the public routes intentionally exposed by the app.
    if (isPublicRoute(pathname)) {
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
