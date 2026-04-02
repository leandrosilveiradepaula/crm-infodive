'use server';

import { revalidatePath } from 'next/cache';
import { UserService } from '@/services/UserService';
import { SettingsService, type PipelineStage } from '@/services/SettingsService';
import { requireSessionContext } from '@/lib/auth-server';

// ─── USERS ──────────────────────────────────────────────────────────────────

export async function getUsers() {
    const { organizationId } = await requireSessionContext();
    return await UserService.getUsers(organizationId);
}

export async function updateUserRole(userId: string, role: string) {
    const { organizationId } = await requireSessionContext();
    const result = await UserService.updateUserRole(userId, organizationId, role);
    if (result.success) revalidatePath('/settings');
    return result;
}

export async function archiveUserAction(userId: string, newOwnerId?: string) {
    const { organizationId } = await requireSessionContext();
    const result = await UserService.archiveUser(userId, organizationId, newOwnerId);
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
    const { organizationId } = await requireSessionContext();
    const result = await UserService.updateUserProfile(userId, organizationId, updates);
    if (result.success) revalidatePath('/settings');
    return result;
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
    const { organizationId } = await requireSessionContext();
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
    const { organizationId } = await requireSessionContext();
    const result = await SettingsService.savePipelineStages(organizationId, stages);
    if (result.success) {
        revalidatePath('/settings');
        revalidatePath('/pipeline');
    }
    return result;
}
