'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Campaign, Scenario, UserGoalData } from '@/types/goal';

export async function getUsersWithGoals() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');

    if (error) { console.error('Error fetching users:', error); return []; }

    return data.map((user: any) => ({
        user_id: user.id || user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url || user.name?.charAt(0).toUpperCase(),
        monthly_goal: user.monthly_goal || 0,
        yearly_goal: user.yearly_goal || 0,
        quarterly_goals: user.quarterly_goals || { q1: 0, q2: 0, q3: 0, q4: 0 },
        commission_rules: user.commission_rules || {
            hardware: { base: 0, new: 0 }, software: { base: 0, new: 0 }, services: { base: 0, new: 0 }
        },
        status: user.status
    }));
}

export async function updateUserGoals(userId: string, data: Partial<UserGoalData>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .eq('organization_id', organizationId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function getCampaigns(): Promise<Campaign[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('campaigns').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data.map((c: any) => ({ ...c, start_date: c.start_date, end_date: c.end_date }));
}

export async function createCampaign(campaign: Partial<Campaign>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase.from('campaigns').insert([{ ...campaign, organization_id: organizationId }]);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', organizationId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function deleteCampaign(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function getScenarios(userId: string): Promise<Scenario[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) return [];
    return data as Scenario[];
}

export async function saveScenario(scenario: Partial<Scenario>) {
    const { userId, organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase.from('scenarios').insert([{ ...scenario, user_id: userId, organization_id: organizationId }]);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function deleteScenario(id: string) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function getCommissionDeals() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('deals').select('*, deal_products(*), customer:accounts!deals_account_id_fkey(name)')
        .eq('organization_id', organizationId)
        .eq('stage', 'won')
        .order('won_at', { ascending: false });
    if (error) return [];
    return data;
}

export async function updateDealCommissionStatus(dealId: string, updates: any) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId)
        .eq('organization_id', organizationId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals-commissions');
    return { success: true };
}

