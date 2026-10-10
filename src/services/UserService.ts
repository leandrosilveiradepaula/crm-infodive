import { createAdminClient } from '../lib/supabase/admin';
import { USER_ROLES } from '../lib/constants';
import type { Profile } from '../types/profile';

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

        if (error || !Array.isArray(data)) return { users: [], error: 'Não foi possível carregar os usuários.' };

        const mapRole = (r: string) => {
            if (r === USER_ROLES.VENDEDOR) return USER_ROLES.SALES;
            if (r === USER_ROLES.ADMIN) return USER_ROLES.ADMIN;
            if (r === USER_ROLES.MANAGER) return USER_ROLES.MANAGER;
            if (r === 'support') return 'support';
            throw new Error('Invalid profile role');
        };

        let users;
        try {
            users = data.map((item) => ({
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
        } catch {
            return { users: [], error: 'Não foi possível carregar os usuários.' };
        }
        return { users, error: null };
    }

    static async updateUserRole(userId: string, organizationId: string, role: string) {
        if (typeof userId !== 'string' || !userId.trim() ||
            !['admin', 'manager', 'vendedor', 'sales', 'support'].includes(role)) {
            return { success: false, error: 'Papel ou usuário inválido.' };
        }
        const supabase = createAdminClient();
        const dbRole = role === USER_ROLES.SALES ? USER_ROLES.VENDEDOR : role;
        const { data, error } = await supabase.from('profiles')
            .update({ role: dbRole }).eq('id', userId)
            .eq('organization_id', organizationId).select('id').maybeSingle();
        if (error || !data) return { success: false, error: 'Não foi possível atualizar o usuário.' };
        return { success: true };
    }

    static async updateUserProfile(userId: string, organizationId: string, updates: Partial<Profile>) {
        if (typeof userId !== 'string' || !userId.trim() ||
            !updates || typeof updates !== 'object' || Array.isArray(updates)) {
            return { success: false, error: 'Dados inválidos.' };
        }
        const validRole = (role: unknown) =>
            typeof role === 'string' && ['admin', 'manager', 'vendedor', 'sales', 'support'].includes(role);
        if ((updates.role !== undefined && !validRole(updates.role)) ||
            (updates.roles !== undefined && (!Array.isArray(updates.roles) ||
                updates.roles.length === 0 || updates.roles.some(role => !validRole(role))))) {
            return { success: false, error: 'Papel inválido.' };
        }
        const dbUpdates: Record<string, unknown> = {};
        if (updates.full_name !== undefined) {
            if (typeof updates.full_name !== 'string' || !updates.full_name.trim() || updates.full_name.length > 200) {
                return { success: false, error: 'Nome inválido.' };
            }
            dbUpdates.full_name = updates.full_name.trim();
        }
        if (updates.phone !== undefined) {
            if (typeof updates.phone !== 'string' || updates.phone.length > 50) return { success: false, error: 'Telefone inválido.' };
            dbUpdates.phone = updates.phone;
        }
        if (updates.email !== undefined) {
            if (typeof updates.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email) || updates.email.length > 254) {
                return { success: false, error: 'E-mail inválido.' };
            }
            dbUpdates.email = updates.email;
        }
        const mapRole = (role: string) => role === 'sales' ? 'vendedor' : role;
        if (updates.roles !== undefined) {
            dbUpdates.roles = updates.roles.map(mapRole);
            dbUpdates.role = mapRole(updates.roles[0]);
        } else if (updates.role !== undefined) {
            dbUpdates.role = mapRole(updates.role);
        }
        if (!Object.keys(dbUpdates).length) return { success: false, error: 'Nenhuma alteração válida.' };
        dbUpdates.updated_at = new Date().toISOString();
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('profiles').update(dbUpdates)
            .eq('id', userId).eq('organization_id', organizationId).select('id').maybeSingle();
        if (error || !data) return { success: false, error: 'Não foi possível atualizar o perfil.' };
        return { success: true };
    }

    // userId is passed explicitly from the session — no auth.getUser() needed
    static async updateMyProfile(userId: string, organizationId: string, data: { full_name?: string; phone?: string }) {
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            (data.full_name !== undefined && (typeof data.full_name !== 'string' || !data.full_name.trim() || data.full_name.length > 200)) ||
            (data.phone !== undefined && (typeof data.phone !== 'string' || data.phone.length > 50)) ||
            (data.full_name === undefined && data.phone === undefined)) {
            return { success: false, error: 'Dados inválidos.' };
        }
        const changes = {
            ...(data.full_name !== undefined ? { full_name: data.full_name.trim() } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            updated_at: new Date().toISOString(),
        };
        const supabase = createAdminClient();
        const { data: updated, error } = await supabase.from('profiles').update(changes)
            .eq('id', userId).eq('organization_id', organizationId).select('id').maybeSingle();
        if (error || !updated) return { success: false, error: 'Não foi possível atualizar o perfil.' };
        return { success: true };
    }

    static async archiveUser(userId: string, organizationId: string, newOwnerId?: string, actorUserId?: string) {
        // The service uses a privileged database client. Do not rely on validation
        // in a particular caller, since multiple Server Actions can invoke it.
        if (typeof userId !== 'string' || !userId.trim() ||
            typeof organizationId !== 'string' || !organizationId.trim() ||
            typeof actorUserId !== 'string' || !actorUserId.trim() ||
            userId === actorUserId ||
            (newOwnerId !== undefined && (typeof newOwnerId !== 'string' || !newOwnerId.trim())) ||
            (newOwnerId && newOwnerId !== 'none' && (newOwnerId === userId || newOwnerId === actorUserId))) {
            return { success: false, error: 'Usuário de arquivamento inválido.' };
        }

        const supabase = createAdminClient();
        try {
            const { data: target, error: targetError } = await supabase.from('profiles')
                .select('id, status').eq('id', userId)
                .eq('organization_id', organizationId).maybeSingle();
            if (targetError || !target || target.status !== 'active') {
                throw new Error('Archive target unavailable');
            }

            if (newOwnerId && newOwnerId !== 'none') {
                const { data: replacement, error: replacementError } = await supabase.from('profiles')
                    .select('id, status').eq('id', newOwnerId)
                    .eq('organization_id', organizationId).maybeSingle();
                if (replacementError || !replacement || replacement.status !== 'active') {
                    throw new Error('Replacement owner unavailable');
                }

                // Count the tenant-scoped records before and after transfer to
                // detect silent no-op/partial persistence. This is NOT atomic.
                const { data: owned, error: ownedError } = await supabase.from('deals')
                    .select('id').eq('owner_id', userId)
                    .eq('organization_id', organizationId);
                if (ownedError || !Array.isArray(owned) ||
                    owned.some(row => !row || typeof row.id !== 'string')) {
                    throw new Error('Unable to enumerate transferred deals');
                }
                if (owned.length > 0) {
                    const { data: transferred, error: transferError } = await supabase.from('deals')
                        .update({ owner_id: newOwnerId })
                        .eq('owner_id', userId).eq('organization_id', organizationId)
                        .in('id', owned.map(row => row.id)).select('id');
                    if (transferError || !Array.isArray(transferred) ||
                        transferred.length !== owned.length ||
                        new Set(transferred.map(row => row.id)).size !== owned.length) {
                        throw new Error('Deal ownership transfer not persisted');
                    }
                }
            }

            const { data: archived, error: archiveError } = await supabase.from('profiles')
                .update({ status: 'inactive', updated_at: new Date().toISOString() })
                .eq('id', userId).eq('organization_id', organizationId)
                .eq('status', 'active').select('id').maybeSingle();
            if (archiveError || !archived || archived.id !== userId) {
                throw new Error('Archive not persisted');
            }
            return { success: true };
        } catch {
            // A failed transfer/archive may have partial effects until the
            // transaction RPC from issue #119 is implemented and verified.
            return { success: false, error: 'Não foi possível arquivar o usuário.' };
        }
    }

    static async createInvitation(email: string, role: string, organizationId: string, invitedBy: string) {
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
            !['admin', 'manager', 'vendedor', 'sales', 'support'].includes(role)) {
            return { success: false, error: 'Convite inválido.' };
        }
        const supabase = createAdminClient();
        const { data: existing, error: lookupError } = await supabase.from('profiles')
            .select('id').eq('email', email.trim()).maybeSingle();
        if (lookupError) return { success: false, error: 'Não foi possível verificar o cadastro.' };
        if (existing) return { success: false, error: 'Usuário já cadastrado no sistema.' };
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const { data, error } = await supabase.from('invitations').insert({
            email: email.trim(), role: role === 'sales' ? 'vendedor' : role,
            organization_id: organizationId, invited_by: invitedBy,
            expires_at: expiresAt.toISOString(),
        }).select('id').maybeSingle();
        if (error || !data) return { success: false, error: 'Não foi possível enviar o convite.' };
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
