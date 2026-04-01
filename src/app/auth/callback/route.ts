import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            
            let redirectUrl: string;
            if (isLocalEnv) {
                redirectUrl = `${origin}${next}`;
            } else if (forwardedHost) {
                redirectUrl = `https://${forwardedHost}${next}`;
            } else {
                redirectUrl = `${origin}${next}`;
            }

            const response = NextResponse.redirect(redirectUrl);

            // Store provider tokens for email sync (Office 365 / Azure)
            const providerToken = data.session.provider_token;
            const refreshToken = data.session.provider_refresh_token;

            if (providerToken) {
                response.cookies.set('crm_provider_token', providerToken, {
                    path: '/',
                    maxAge: 3600, // 1 hour (default Access Token expiration for MS Graph)
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });
            }

            if (refreshToken) {
                response.cookies.set('crm_refresh_token', refreshToken, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });
            }

            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
