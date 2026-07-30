
/**
 * Utility to refresh Microsoft Graph API tokens.
 * Requires AZURE_CLIENT_ID and AZURE_CLIENT_SECRET in .env.local
 */
export async function refreshMicrosoftToken(refreshToken: string) {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('[MicrosoftAuth] token refresh configuration failed');
        throw new Error('Microsoft token refresh configuration missing');
    }

    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'offline_access Mail.Read Mail.Send User.Read',
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('[MicrosoftAuth] token refresh failed');
        throw new Error('Microsoft token refresh failed');
    }

    const data = await response.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Refresh can return a new refresh token
        expiresIn: data.expires_in,
    };
}
