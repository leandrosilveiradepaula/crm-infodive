import { NextRequest, NextResponse } from 'next/server';
import { requireSessionContext } from '@/lib/auth-server';

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

        const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendMail)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Graph API Error (Send):', errorText);
            throw new Error(`Graph API returned ${response.status}: ${errorText}`);
        }

        // Graph API returns 202 Accepted on success with no body
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
