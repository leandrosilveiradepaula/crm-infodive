import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('❌ Supabase Auth Callback Error:', error.message, error.status);
            return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
        }

        if (data?.session) {
            const forwardedHost = request.headers.get('x-forwarded-host')
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
                    maxAge: 3600,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                });
            }

            if (refreshToken) {
                response.cookies.set('crm_refresh_token', refreshToken, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                });
            }

            return response;
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
