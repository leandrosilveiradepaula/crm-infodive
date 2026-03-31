import { createAdminClient } from '@/lib/supabase/admin';
import { USER_ROLES } from '@/lib/constants';
import type { Profile } from '@/types/profile';

export class UserService {
    static async getUserProfile(userId: string, organizationId: string) {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .single();

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    }

    static async getUsers(organizationId: string): Promise<{ users: any[], error: string | null }> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', organizationId)
            .order('full_name');

        if (error) return { users: [], error: error.message };

        const mapRole = (r: string) => {
            if (r === USER_ROLES.VENDEDOR) return USER_ROLES.SALES;
            if (r === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
            if (r === USER_ROLES.MANAGER) return USER_ROLES.MANAGER;
            return USER_ROLES.SALES;
        };

        const users = (data as Profile[]).map((item) => ({
            id: item.id,
            name: item.full_name || 'Usuário Sem Nome',
            email: item.email || '',
            phone: item.phone || '',
            role: mapRole(item.role || ''),
            lastLogin: item.updated_at ? new Date(item.updated_at).toLocaleDateString('pt-BR') : 'N/A',
            avatar: item.full_name
                ? item.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                : 'U',
            monthly_goal: item.monthly_goal || 0,
            yearly_goal: item.yearly_goal || 0,
            commission_rules: item.commission_rules || { hardware: { new: 0, base: 0 }, software: { new: 0, base: 0 }, services: { new: 0, base: 0 } },
            quarterly_goals: item.quarterly_goals || { q1: 0, q2: 0, q3: 0, q4: 0 },
        }));

        return { users, error: null };
    }

    static async updateUserRole(userId: string, organizationId: string, role: string) {
        const supabase = createAdminClient();
        const dbRole = role === USER_ROLES.SALES ? USER_ROLES.VENDEDOR : role;
        const { error } = await supabase
            .from('profiles')
            .update({ role: dbRole })
            .eq('id', userId)
            .eq('organization_id', organizationId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    }

    static async updateUserProfile(userId: string, organizationId: string, updates: Partial<Profile>) {
        const supabase = createAdminClient();
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) {
            dbUpdates.role = updates.role === USER_ROLES.SALES ? USER_ROLES.VENDEDOR : updates.role;
        }
        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', userId)
            .eq('organization_id', organizationId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    }

    // userId is passed explicitly from the session — no auth.getUser() needed
    static async updateMyProfile(userId: string, organizationId: string, data: { full_name?: string; phone?: string }) {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('profiles')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .eq('organization_id', organizationId);

        if (error) return { success: false, error: error.message };
        return { success: true };
    }
}
