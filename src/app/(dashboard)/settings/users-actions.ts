'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { UserProfile } from '@/hooks/useUsers';
import { requireUserId, requireSessionContext } from '@/lib/auth-server';

export async function getUsers() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', organizationId);

        if (error) throw error;

        const mapRole = (r: string) => {
            if (r === 'vendedor') return 'sales';
            if (r === 'admin') return 'admin';
            if (r === 'manager') return 'manager';
            return 'sales'; // Default to sales if unknown
        };

        const mapped: UserProfile[] = (data || []).map((item: any) => ({
            id: item.id,
            name: item.full_name || 'Usuário Sem Nome',
            email: item.email || (item.raw_user_meta_data?.email) || '',
            phone: item.phone || '',
            role: mapRole(item.role), // Legacy support
            roles: (item.roles || []).map((r: string) => mapRole(r)), // New multi-role
            status: item.status || 'active',
            lastLogin: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'N/A',
            avatar: item.full_name ? item.full_name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase() : 'U',
            monthly_goal: item.monthly_goal || 0,
            yearly_goal: item.yearly_goal || 0,
            commission_rate: item.commission_rate || 0,
            commission_rules: item.commission_rules || {
                hardware: { new: 0, base: 0 },
                software: { new: 0, base: 0 },
                services: { new: 0, base: 0 },
                campaigns: []
            },
            quarterly_goals: item.quarterly_goals || { q1: 0, q2: 0, q3: 0, q4: 0 }
        }));

        return { success: true, data: mapped };
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUserAction(updateId: string, updates: Partial<UserProfile>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    try {
        // Reverse map role for DB
        const dbUpdates: any = {
            full_name: updates.name,
            phone: updates.phone,
            email: updates.email,
        };

        if (updates.role) {
            if (updates.role === 'sales') dbUpdates.role = 'vendedor';
            else dbUpdates.role = updates.role;
        }

        if (updates.roles) {
            dbUpdates.roles = updates.roles.map(r => r === 'sales' ? 'vendedor' : r);
            // Optionally sync single 'role' for legacy support
            dbUpdates.role = dbUpdates.roles[0] || 'vendedor';
        }

        if (updates.status) dbUpdates.status = updates.status;

        // Remove undefined keys to avoid overriding with nulls if partial
        Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', updateId)
            .eq('organization_id', organizationId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error updating user caught in action:', error);
        return { success: false, error: error.message };
    }
}

export async function archiveUserAction(archiveId: string, newOwnerId?: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    try {
        // 1. Transfer deals if requested
        if (newOwnerId && newOwnerId !== 'none') {
            const { error: transferError } = await supabase
                .from('deals')
                .update({ owner_id: newOwnerId })
                .eq('owner_id', archiveId)
                .eq('organization_id', organizationId);
            
            if (transferError) throw transferError;
        }

        // 2. Archive user
        const { error: archiveError } = await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', archiveId)
            .eq('organization_id', organizationId);

        if (archiveError) throw archiveError;

        return { success: true };
    } catch (error: any) {
        console.error('Error archiving user:', error);
        return { success: false, error: error.message };
    }
}
