import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { isPublicRoute } from '@/lib/public-routes'
import { getRequestId } from '@/lib/request-context'

function withRequestId<T extends NextResponse>(response: T, requestId: string): T {
    response.headers.set('X-Request-Id', requestId)
    return response
}

export async function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    // Never forward client-supplied identity or service credential headers.
    // Recreate them exclusively from the authenticated server session below.
    requestHeaders.delete('X-User-Id')
    requestHeaders.delete('X-Supabase-Token')
    const requestId = getRequestId(requestHeaders.get('X-Request-Id'))
    requestHeaders.set('X-Request-Id', requestId)

    const response = withRequestId(
        NextResponse.next({
            request: {
                headers: requestHeaders,
            }
        }),
        requestId
    )

    const session = await getIronSession<SessionData>(
        request,
        response,
        sessionOptions
    )

    const { pathname } = request.nextUrl

    // Allow only the public routes intentionally exposed by the app.
    if (isPublicRoute(pathname)) {
        return response
    }

    // Protect routes
    if (!session.isLoggedIn || !session.userId) {
        if (pathname.startsWith('/api/')) {
            return withRequestId(
                NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
                requestId
            )
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return withRequestId(NextResponse.redirect(url), requestId)
    }

    // Inject userId for BFF security layer
    requestHeaders.set('X-User-Id', session.userId)

    // Inject the Supabase JWT from cookie so Server Actions can build an authenticated client
    const accessToken = request.cookies.get('crm_access_token')?.value
    if (accessToken) {
        requestHeaders.set('X-Supabase-Token', accessToken)
    }

    return withRequestId(
        NextResponse.next({
            request: {
                headers: requestHeaders,
            }
        }),
        requestId
    )
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
