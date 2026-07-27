import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export const createClient = async () => {
    const headersList = await headers()
    const accessToken = headersList.get('X-Supabase-Token')

    const clientHeaders: Record<string, string> = {}
    if (accessToken) {
        clientHeaders['Authorization'] = `Bearer ${accessToken}`
    }

    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            global: {
                headers: clientHeaders,
                fetch: (url, options) => {
                    return fetch(url, { ...options, cache: 'no-store' })
                }
            }
        }
    )
}
