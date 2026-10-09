'use server';

import { createAdminClient } from '../../../lib/supabase/admin';
import { UserProfile } from '../../../hooks/useUsers';
import { requirePermission } from '../../../lib/auth-server';

export async function getUsers() {
    const { organizationId } = await requirePermission('settings:manage_users');
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('organization_id', organizationId);

        if (error || !Array.isArray(data)) throw new Error('Invalid profiles result');

        const mapRole = (r: string) => {
            if (r === 'vendedor') return 'sales';
            if (r === 'admin') return 'admin';
            if (r === 'manager') return 'manager';
            if (r === 'support') return 'support';
            throw new Error('Invalid user role');
        };

        const mapped: UserProfile[] = data.map((item: Record<string, unknown>) => ({
            id: item.id,
            name: String(item.full_name || 'Usuário Sem Nome'),
            email: String(item.email || ((item.raw_user_meta_data as { email?: string } | null)?.email) || ''),
            phone: String(item.phone || ''),
            role: mapRole(String(item.role ?? '')) as UserProfile['role'], // Legacy support
            roles: (Array.isArray(item.roles) ? item.roles : []).map((r: string) => mapRole(r) as UserProfile['role']), // New multi-role
            status: (item.status === 'active' || item.status === 'inactive' ? item.status : 'active'),
            lastLogin: item.updated_at ? new Date(String(item.updated_at)).toLocaleDateString() : 'N/A',
            avatar: item.full_name ? String(item.full_name).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U',
            monthly_goal: Number(item.monthly_goal || 0),
            yearly_goal: Number(item.yearly_goal || 0),
            commission_rate: Number(item.commission_rate || 0),
            commission_rules: (item.commission_rules as UserProfile['commission_rules']) || {
                hardware: { new: 0, base: 0 },
                software: { new: 0, base: 0 },
                services: { new: 0, base: 0 },
                campaigns: []
            },
            quarterly_goals: (item.quarterly_goals as UserProfile['quarterly_goals']) || { q1: 0, q2: 0, q3: 0, q4: 0 }
        }));

        return { success: true, data: mapped };
    } catch (error: unknown) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Não foi possível carregar os usuários.' };
    }
}

export async function updateUserAction(updateId: string, updates: Partial<UserProfile>) {
    const { organizationId } = await requirePermission('settings:manage_users');
    if (typeof updateId !== 'string' || !updateId.trim() || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return { success: false, error: 'Dados do usuário inválidos.' };
    }
    const validRoles = new Set(['admin', 'manager', 'sales', 'support']);
    const normalizeRole = (role: string) => role === 'sales' ? 'vendedor' : role;
    if ((updates.role !== undefined && !validRoles.has(updates.role)) ||
        (updates.roles !== undefined && (!Array.isArray(updates.roles) || updates.roles.length === 0 || updates.roles.some(r => !validRoles.has(r)))) ||
        (updates.status !== undefined && !['active', 'inactive'].includes(updates.status))) {
        return { success: false, error: 'Papel ou situação inválidos.' };
    }
    const changes: Record<string, unknown> = {};
    if (updates.name !== undefined) {
        if (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.length > 200) return { success: false, error: 'Nome inválido.' };
        changes.full_name = updates.name.trim();
    }
    if (updates.phone !== undefined) {
        if (typeof updates.phone !== 'string' || updates.phone.length > 50) return { success: false, error: 'Telefone inválido.' };
        changes.phone = updates.phone;
    }
    if (updates.email !== undefined) {
        if (typeof updates.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email) || updates.email.length > 254) return { success: false, error: 'E-mail inválido.' };
        changes.email = updates.email;
    }
    if (updates.roles !== undefined) {
        changes.roles = updates.roles.map(normalizeRole);
        changes.role = normalizeRole(updates.roles[0]);
    } else if (updates.role !== undefined) {
        changes.role = normalizeRole(updates.role);
    }
    if (updates.status !== undefined) changes.status = updates.status;
    if (Object.keys(changes).length === 0) return { success: false, error: 'Nenhuma alteração válida.' };

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('profiles').update(changes)
            .eq('id', updateId.trim()).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !data) throw new Error('No tenant-scoped profile updated');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível atualizar o usuário.' };
    }
}

export async function archiveUserAction(archiveId: string, newOwnerId?: string) {
    const { organizationId, userId } = await requirePermission('settings:manage_users');
    if (typeof archiveId !== 'string' || !archiveId.trim() || archiveId === userId ||
        (newOwnerId !== undefined && typeof newOwnerId !== 'string') ||
        (newOwnerId && newOwnerId !== 'none' && (newOwnerId === archiveId || !newOwnerId.trim()))) {
        return { success: false, error: 'Usuário de arquivamento inválido.' };
    }
    const supabase = createAdminClient();
    try {
        const { data: subject, error: subjectError } = await supabase.from('profiles')
            .select('id').eq('id', archiveId).eq('organization_id', organizationId).maybeSingle();
        if (subjectError || !subject) throw new Error('Archive target not found');

        if (newOwnerId && newOwnerId !== 'none') {
            const { data: owner, error: ownerError } = await supabase.from('profiles')
                .select('id').eq('id', newOwnerId).eq('organization_id', organizationId)
                .eq('status', 'active').maybeSingle();
            if (ownerError || !owner) throw new Error('Replacement owner not valid');
            const { error: transferError } = await supabase.from('deals')
                .update({ owner_id: newOwnerId }).eq('owner_id', archiveId)
                .eq('organization_id', organizationId);
            if (transferError) throw transferError;
        }
        const { data: archived, error: archiveError } = await supabase.from('profiles')
            .update({ status: 'inactive' }).eq('id', archiveId)
            .eq('organization_id', organizationId).select('id').maybeSingle();
        if (archiveError || !archived) throw new Error('Archive not persisted');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível arquivar o usuário.' };
    }
}
