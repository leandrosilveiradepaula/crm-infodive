'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { SettingsService } from '@/services/SettingsService';

export async function updateUserTheme(theme: 'light' | 'dark') {
    // A theme is an individual preference. Preserve trusted session identity;
    // service-role writes must still target the authenticated profile only.
    let userId: string;
    try {
        ({ userId } = await requireSessionContext());
    } catch {
        console.error('CRM_THEME_WRITE_DIAGNOSTIC=AUTH');
        throw new Error('Failed to authorize theme preference');
    }

    let supabase: ReturnType<typeof createAdminClient>;
    try {
        supabase = createAdminClient();
    } catch {
        console.error('CRM_THEME_WRITE_DIAGNOSTIC=CLIENT');
        throw new Error('Failed to initialize theme preference storage');
    }

    let data: { id: string; theme_preference: string | null } | null = null;
    let error: { code?: string } | null = null;
    try {
        const result = await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('id', userId)
            .select('id,theme_preference')
            .maybeSingle();
        data = result.data;
        error = result.error;
    } catch {
        console.error('CRM_THEME_WRITE_DIAGNOSTIC=TRANSPORT');
        throw new Error('Failed to contact theme preference storage');
    }

    // Update without a returned row is NOT proof of persistence; fail closed.
    if (error || !data || data.theme_preference !== theme) {
        // Safe bounded code only, never user IDs, SQL, content or credentials.
        const storageCode = error?.code && /^[A-Z0-9_]{2,32}$/i.test(error.code)
            ? error.code : !data ? 'NO_ROW' : 'WRITE_MISMATCH';
        console.error('CRM_THEME_WRITE_DIAGNOSTIC=' + storageCode);
        throw new Error('Failed to persist theme preference');
    }

    // A root-layout revalidation can race the already-applied client theme and
    // reset it from an older Server Component payload. The next navigation
    // or page reload reads the persisted profile preference as usual.
    return { success: true };
}

export async function updateOrgTheme(theme: 'light' | 'dark') {
    const { userId, organizationId } = await requireSessionContext();
    
    try {
        const settings = await SettingsService.getOrgSettings(organizationId);
        await SettingsService.saveOrgSettings(organizationId, {
            ...settings,
            // primary_color: settings.primary_color, // Keep existing
        });
        
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating org theme:', error);
        throw new Error('Failed to update organization theme');
    }
}

export async function getUserTheme() {
    const { userId, organizationId } = await requireSessionContext().catch(() => ({ userId: null, organizationId: null }));
    if (!userId) {
        return 'light';
    }
    const supabase = createAdminClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', userId)
        .single();

    let orgTheme = 'light';
    if (organizationId) {
        try {
            const settings = await SettingsService.getOrgSettings(organizationId);
            // In the future, we might have a 'default_theme' in settings
            // For now, return light as default
        } catch (e) {
            console.error('Error fetching org theme for user:', e);
        }
    }

    if (!profile) {
        return 'light';
    }

    // Priority: user preference > org default > system default
    return (profile.theme_preference || orgTheme || 'light') as 'light' | 'dark';
}

export async function getOrganizationTheme() {
    const { organizationId } = await requireSessionContext().catch(() => ({ organizationId: null }));
    
    if (!organizationId) {
        return { theme_primary: null, theme_accent: null };
    }

    try {
        const settings = await SettingsService.getOrgSettings(organizationId);
        
        return {
            theme_primary: settings.primary_color || null,
            theme_accent: settings.secondary_color || null
        };
    } catch (error) {
        console.error('Error fetching organization theme:', error);
        return { theme_primary: null, theme_accent: null };
    }
}
