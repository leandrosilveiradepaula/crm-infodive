'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Initiates the Office 365 OAuth flow on the server side to ensure 
 * the PKCE code_verifier is correctly stored in cookies.
 */
export async function connectEmailAction() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    
    // Determine site URL (development vs production)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
            scopes: 'Mail.Read Mail.Send User.Read offline_access',
            redirectTo: `${siteUrl}/auth/callback?next=/inbox`,
            queryParams: {
                prompt: 'select_account'
            }
        },
    });

    if (error) {
        console.error('[EmailConnectActions] email connection failed');
        throw new Error('Não foi possível iniciar a conexão com o email.');
    }

    if (data.url) {
        redirect(data.url);
    }
}
