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
                console.log('🔄 Microsoft token expired (send). Attempting refresh...');
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
                } catch (refreshErr) {
                    console.error('❌ Failed to refresh Microsoft token:', refreshErr);
                    return NextResponse.json({ error: 'Session expired. Please reconnect your Office 365 account.' }, { status: 401 });
                }
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Graph API Error (Send):', errorText);
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

    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
