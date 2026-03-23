'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Use raw supabase-js to avoid setting SSR cookies
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user || !data.session) {
        return { error: 'Email ou senha incorretos.' };
    }

    // Get organizationId from user metadata (set at signup)
    let organizationId: string | undefined = data.user.user_metadata?.organization_id;

    // Fallback: if not in JWT metadata, look up from profiles table
    if (!organizationId) {
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('organization_id')
            .eq('id', data.user.id)
            .single();
        organizationId = profile?.organization_id || undefined;
    }

    // Also try auth.users raw_user_meta_data via admin
    if (!organizationId) {
        const adminClient = createAdminClient();
        const { data: authUser } = await adminClient.auth.admin.getUserById(data.user.id);
        organizationId = authUser?.user?.user_metadata?.organization_id;
    }

    // Save session
    const session = await getSession();
    session.destroy();

    const newSession = await getSession();
    newSession.userId = data.user.id;
    newSession.organizationId = organizationId;
    newSession.isLoggedIn = true;
    await newSession.save();

    // Store JWT in httpOnly cookie (used by middleware to build X-Supabase-Token header)
    const cookieStore = await cookies();
    cookieStore.set('crm_access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string || 'vendedor';
    const organization_id = formData.get('organization_id') as string | null;

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );

    // Prepare user metadata
    const userMetadata: any = {
        full_name: name,
        role: role,
    };
    if (organization_id) {
        userMetadata.organization_id = organization_id;
    }

    // Create user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userMetadata
        }
    });

    if (error) {
        return { error: error.message };
    }

    return { success: 'Conta criada! Verifique seu email ou faça login.' };
}
