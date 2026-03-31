'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { SettingsService } from '@/services/SettingsService';

export async function updateUserTheme(theme: 'light' | 'dark') {
    const { userId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: theme })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user theme:', error);
        throw new Error('Failed to update theme preference');
    }

    revalidatePath('/');
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
