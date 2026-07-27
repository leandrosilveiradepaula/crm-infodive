import { NextRequest, NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';
import { refreshMicrosoftToken } from '@/lib/microsoft-auth';

export async function POST(request: NextRequest) {
    // Auth guard (iron-session)
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider token from cookie (set during OAuth callback)
    const providerToken = request.cookies.get('crm_provider_token')?.value;

    if (!providerToken) {
        return NextResponse.json({ error: 'Not authenticated or missing provider token.' }, { status: 401 });
    }

    try {
        const { to, subject, body } = await request.json();

        const sendMail = {
            message: {
                subject: subject,
                body: {
                    contentType: "Text",
                    content: body
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to
                        }
                    }
                ]
            },
            saveToSentItems: "true"
        };

        const sendMailUrl = 'https://graph.microsoft.com/v1.0/me/sendMail';

        let response = await fetch(sendMailUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendMail)
        });

        let newTokens = null;

        if (response.status === 401) {
            const refreshToken = request.cookies.get('crm_refresh_token')?.value;
            if (refreshToken) {
                console.info('Microsoft token refresh started', {
                    operation: 'email.send.refresh',
                    provider: 'microsoft',
                    status: 'started',
                });
                try {
                    newTokens = await refreshMicrosoftToken(refreshToken);
                    response = await fetch(sendMailUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${newTokens.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sendMail)
                    });
                } catch {
                    console.error('Microsoft token refresh failed', {
                        operation: 'email.send.refresh',
                        provider: 'microsoft',
                        status: 'failed',
                        errorCode: 'token_refresh_failed',
                    });
                    return NextResponse.json({ error: 'Session expired. Please reconnect your Office 365 account.' }, { status: 401 });
                }
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Microsoft Graph send failed', {
                operation: 'email.send',
                provider: 'microsoft_graph',
                status: response.status,
                errorCode: 'graph_send_failed',
            });
            throw new Error(`Graph API returned ${response.status}: ${errorText}`);
        }

        const finalResponse = NextResponse.json({ success: true });

        // Update cookies if refreshed
        if (newTokens) {
            finalResponse.cookies.set('crm_provider_token', newTokens.accessToken, {
                path: '/',
                maxAge: 3600,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
            });
            if (newTokens.refreshToken) {
                finalResponse.cookies.set('crm_refresh_token', newTokens.refreshToken, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'lax',
                });
            }
        }

        return finalResponse;

    } catch (error: unknown) {
        const sendError = error as { code?: string; name?: string; message?: string };
        console.error('Email send failed', {
            operation: 'email.send',
            provider: 'microsoft_graph',
            status: 'failed',
            errorCode: sendError?.code || sendError?.name || 'email_send_failed',
        });
        return NextResponse.json({ error: sendError.message }, { status: 500 });
    }
}
