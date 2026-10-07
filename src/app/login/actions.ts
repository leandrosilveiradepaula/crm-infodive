'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { UserService } from '@/services/UserService';

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
        if (error?.message === 'Email not confirmed') {
            return { error: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.' };
        }
        if (error?.message?.includes('Invalid login credentials')) {
            return { error: 'Email ou senha incorretos.' };
        }
        return { error: 'Email ou senha incorretos.' };
    }

    // Resolve tenant membership only from the server-side profile.
    // user_metadata is user-editable in Supabase and must never authorize tenant access.
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('organization_id, status')
        .eq('id', data.user.id)
        .single();

    if (profileError || !profile || profile.status === 'inactive' || !profile.organization_id) {
        await supabase.auth.signOut();
        return { error: 'Não foi possível validar o acesso desta conta.' };
    }

    const organizationId: string = profile.organization_id;

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

export async function validateInviteAction(token: string) {
    if (!token) return { success: false, error: 'Token não fornecido.' };
    return await UserService.validateInvitation(token);
}

export async function signup(formData: FormData) {
    const invite_token = formData.get('invite_token') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!invite_token) {
        return { error: 'Este sistema é exclusivo para convidados. Utilize um link de convite válido.' };
    }

    // 1. Validate the invite token securely on the server
    const inviteRes = await validateInviteAction(invite_token);
    
    if (!inviteRes.success || !('data' in inviteRes) || !inviteRes.data) {
        return { error: inviteRes.error || 'Convite inválido' };
    }

    const { email, role, organization_id } = inviteRes.data as any;

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );

    // Prepare user metadata with securely derived information
    const userMetadata: any = {
        full_name: name,
        role: role,
        organization_id: organization_id,
    };

    // 2. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userMetadata
        }
    });

    if (error) {
        return { error: 'Não foi possível concluir a autenticação.' };
    }

    if (data.user) {
        // 3. Create the profile in public.profiles using admin privileges
        const adminClient = createAdminClient();
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: data.user.id,
                full_name: name,
                role: role,
                organization_id: organization_id,
                status: 'active',
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('[LoginActions] profile creation during signup failed');
        } else {
            // 4. Mark invite as accepted only if profile is created successfully
            await UserService.acceptInvitation(invite_token);
        }
    }

    return { success: 'Conta criada! Verifique seu email ou faça login.' };
}

export async function logout() {
    const session = await getSession();
    session.destroy();
    
    const cookieStore = await cookies();
    cookieStore.delete('crm_access_token');
    cookieStore.delete('crm_provider_token');
    cookieStore.delete('crm_refresh_token');
    
    revalidatePath('/', 'layout');
}

export async function getSessionData() {
    const session = await getSession();
    return {
        isLoggedIn: !!session.isLoggedIn,
        userId: session.userId,
    };
}
