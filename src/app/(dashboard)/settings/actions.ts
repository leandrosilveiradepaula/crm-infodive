'use server';

import { revalidatePath } from 'next/cache';
import { UserService } from '../../../services/UserService';
import { SettingsService, type PipelineStage } from '../../../services/SettingsService';
import { requirePermission, requireSessionContext } from '../../../lib/auth-server';

// ─── USERS ──────────────────────────────────────────────────────────────────

export async function getUsers() {
    const { organizationId } = await requirePermission('settings:manage_users');
    return await UserService.getUsers(organizationId);
}

export async function updateUserRole(userId: string, role: string) {
    const { organizationId } = await requirePermission('settings:manage_users');
    const result = await UserService.updateUserRole(userId, organizationId, role);
    if (result.success) revalidatePath('/settings');
    return result;
}

export async function archiveUserAction(userId: string, newOwnerId?: string) {
    const { organizationId, userId: actorUserId } = await requirePermission('settings:manage_users');
    if (typeof userId !== 'string' || !userId.trim() || userId === actorUserId ||
        (newOwnerId !== undefined && (typeof newOwnerId !== 'string' || !newOwnerId.trim())) ||
        (newOwnerId && newOwnerId !== 'none' && (newOwnerId === userId || newOwnerId === actorUserId))) {
        return { success: false, error: 'Usuário de arquivamento inválido.' };
    }
    const result = await UserService.archiveUser(userId, organizationId, newOwnerId, actorUserId);
    if (result.success) revalidatePath('/settings');
    return result;
}

export async function updateUserProfile(userId: string, updates: {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    roles?: string[];
}) {
    const { organizationId } = await requirePermission('settings:manage_users');
    if (typeof userId !== 'string' || !userId.trim() || !updates ||
        typeof updates !== 'object' || Array.isArray(updates) ||
        Object.keys(updates).some(key => !['name', 'phone', 'email', 'role', 'roles'].includes(key))) {
        return { success: false, error: 'Alteração de usuário inválida.' };
    }
    const normalized = {
        ...(updates.name !== undefined ? { full_name: updates.name } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.role !== undefined ? { role: updates.role } : {}),
        ...(updates.roles !== undefined ? { roles: updates.roles } : {}),
    };
    if (!Object.keys(normalized).length) {
        return { success: false, error: 'Nenhuma alteração válida.' };
    }
    const result = await UserService.updateUserProfile(userId.trim(), organizationId, normalized);
    if (result.success) revalidatePath('/settings');
    return result;
}

export async function createInvitationAction(email: string, role: string) {
    const { organizationId, userId } = await requirePermission('settings:manage_users');
    return await UserService.createInvitation(email, role, organizationId, userId);
}


// ─── MY PROFILE ─────────────────────────────────────────────────────────────

export async function updateMyProfile(data: { full_name?: string; phone?: string }) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await UserService.updateMyProfile(userId, organizationId, data);
    if (result.success) revalidatePath('/settings');
    return result;
}

// ─── ORGANIZATION SETTINGS ───────────────────────────────────────────────────

export async function getOrgSettings() {
    const { organizationId } = await requireSessionContext();
    return await SettingsService.getOrgSettings(organizationId);
}

export async function saveOrgSettings(settings: any) {
    const { organizationId } = await requirePermission('settings:configure_pipeline');
    const result = await SettingsService.saveOrgSettings(organizationId, settings);
    if (result.success) revalidatePath('/settings');
    return result;
}

// ─── PIPELINE STAGES ─────────────────────────────────────────────────────────

export async function getPipelineStages(): Promise<PipelineStage[]> {
    const { organizationId } = await requireSessionContext();
    return await SettingsService.getPipelineStages(organizationId);
}

export async function savePipelineStages(stages: PipelineStage[]) {
    const { organizationId } = await requirePermission('settings:configure_pipeline');
    const result = await SettingsService.savePipelineStages(organizationId, stages);
    if (result.success) {
        revalidatePath('/settings');
        revalidatePath('/pipeline');
    }
    return result;
}
