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

        if (error) return { success: false, error: 'Não foi possível carregar o usuário.' };
        return { success: true, data };
    }

    static async getUsers(organizationId: string): Promise<{ users: any[], error: string | null }> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', organizationId)
            .order('full_name');

        if (error) return { users: [], error: 'Não foi possível carregar os usuários.' };

        const mapRole = (r: string) => {
            if (r === USER_ROLES.VENDEDOR) return USER_ROLES.SALES;
            if (r === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
            if (r === USER_ROLES.MANAGER) return USER_ROLES.MANAGER;
            return USER_ROLES.SALES;
        };

        const users = (data as any[]).map((item) => ({
            id: item.id,
            name: item.full_name || 'Usuário Sem Nome',
            email: item.email || '',
            phone: item.phone || '',
            role: mapRole(item.role || ''),
            roles: item.roles || [],
            status: item.status || 'active',
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
        if (error) return { success: false, error: 'Não foi possível atualizar o usuário.' };
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
        if (updates.roles !== undefined) {
            dbUpdates.roles = updates.roles;
            // Sincronizar compatibilidade caso o array venha primeiro
            if (updates.roles.length > 0) {
                dbUpdates.role = updates.roles[0] === USER_ROLES.SALES ? USER_ROLES.VENDEDOR : updates.roles[0];
            }
        }
        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', userId)
            .eq('organization_id', organizationId);
        if (error) return { success: false, error: 'Não foi possível atualizar o perfil.' };
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

        if (error) return { success: false, error: 'Não foi possível atualizar o perfil.' };
        return { success: true };
    }

    static async archiveUser(userId: string, organizationId: string, newOwnerId?: string) {
        const supabase = createAdminClient();

        try {
            // 1. Transfer deals if requested
            if (newOwnerId && newOwnerId !== 'none') {
                const { error: transferError } = await supabase
                    .from('deals')
                    .update({ owner_id: newOwnerId })
                    .eq('owner_id', userId)
                    .eq('organization_id', organizationId);
                
                if (transferError) throw transferError;
            }

            // 2. Archive user
            const { error: archiveError } = await supabase
                .from('profiles')
                .update({ status: 'inactive', updated_at: new Date().toISOString() })
                .eq('id', userId)
                .eq('organization_id', organizationId);

            if (archiveError) throw archiveError;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    static async createInvitation(email: string, role: string, organizationId: string, invitedBy: string) {
        const supabase = createAdminClient();
        
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
            
        if (existingUser) {
            return { success: false, error: 'Usuário já cadastrado no sistema.' };
        }

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { data, error } = await supabase
            .from('invitations')
            .insert({
                email,
                role,
                organization_id: organizationId,
                invited_by: invitedBy,
                expires_at: expiresAt.toISOString(),
            })
            .select('id')
            .single();

        if (error) return { success: false, error: 'Não foi possível enviar o convite.' };
        return { success: true, inviteId: data.id };
    }

    static async validateInvitation(inviteId: string) {
        const supabase = createAdminClient();
        
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('id', inviteId)
            .eq('status', 'pending')
            .single();

        if (error || !data) {
            return { success: false, error: 'Convite inválido ou não encontrado.' };
        }

        if (new Date(data.expires_at) < new Date()) {
            return { success: false, error: 'Este convite expirou.' };
        }

        return { success: true, data };
    }

    static async acceptInvitation(inviteId: string) {
        const supabase = createAdminClient();
        
        const { error } = await supabase
            .from('invitations')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', inviteId);

        if (error) return { success: false, error: 'Não foi possível aceitar o convite.' };
        return { success: true };
    }
}
