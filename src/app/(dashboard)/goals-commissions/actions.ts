'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext, requirePermission } from '@/lib/auth-server';
import { getAiDealScope } from '@/lib/ai-deal-scope';
import { sanitizeGoalWrite, sanitizeScenarioWrite } from '@/lib/goal-mutation-integrity';
import { revalidatePath } from 'next/cache';
import { Campaign, Scenario, UserGoalData } from '@/types/goal';
import { sanitizeCampaignWrite, sanitizeCommissionPayment } from '@/lib/commission-campaign-integrity';

export async function getUsersWithGoals() {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const { canViewAll } = await getAiDealScope(userId, organizationId);
    const supabase = createAdminClient();

    let query = supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, monthly_goal, yearly_goal, quarterly_goals, commission_rules, status')
        .eq('organization_id', organizationId);
    if (!canViewAll) query = query.eq('id', userId);
    const { data, error } = await query.order('full_name');

    if (error) { console.error('[GoalsCommissionsActions] users fetch failed'); throw new Error('Não foi possível carregar metas da equipe.'); }

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
    const { organizationId } = await requirePermission('deals:view_all');
    try {
        const fields = sanitizeGoalWrite(data);
        const supabase = createAdminClient();
        const { data: changed, error } = await supabase
            .from('profiles')
            .update(fields)
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();
        if (error || !changed) throw new Error('Goal not updated');
        revalidatePath('/goals-commissions');
        revalidatePath('/goals');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível atualizar as metas.' };
    }
}

export async function getCampaigns(): Promise<Campaign[]> {
    const { organizationId } = await requirePermission('deals:edit');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('campaigns').select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar as campanhas.');
    return data.map((c: any) => ({ ...c, start_date: c.start_date, end_date: c.end_date }));
}

export async function createCampaign(campaign: Partial<Campaign>) {
    const { organizationId } = await requirePermission('deals:view_all');
    try {
        const fields = sanitizeCampaignWrite(campaign, true);
        const supabase = createAdminClient();
        const { error } = await supabase.from('campaigns').insert([{ ...fields, organization_id: organizationId }]);
        if (error) throw error;
        revalidatePath('/goals-commissions');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível salvar a campanha.' };
    }
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
    const { organizationId } = await requirePermission('deals:view_all');
    try {
        const fields = sanitizeCampaignWrite(updates);
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('campaigns')
            .update(fields)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();
        if (error || !data) throw new Error('Campaign not updated');
        revalidatePath('/goals-commissions');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível atualizar a campanha.' };
    }
}

export async function deleteCampaign(id: string) {
    const { organizationId } = await requirePermission('deals:view_all');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select('id')
        .maybeSingle();
    if (error || !data) return { success: false, error: 'Campanha não encontrada ou não excluída.' };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function getScenarios(requestedUserId: string): Promise<Scenario[]> {
    const { userId, organizationId } = await requirePermission('deals:edit');
    if (requestedUserId !== userId) throw new Error('Cenários de terceiros não autorizados.');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar os cenários.');
    return data as Scenario[];
}

export async function saveScenario(scenario: Partial<Scenario>) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    let safe: Partial<Scenario>;
    try { safe = sanitizeScenarioWrite(scenario); }
    catch { return { success: false, error: 'Cenário inválido.' }; }
    const supabase = createAdminClient();
    const { error } = await supabase.from('scenarios').insert([{ ...safe, user_id: userId, organization_id: organizationId }]);
    if (error) return { success: false, error: 'Não foi possível processar a comissão.' };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function deleteScenario(id: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .select('id')
        .maybeSingle();
    if (error || !data) return { success: false, error: 'Cenário não encontrado ou não excluído.' };
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function getCommissionDeals() {
    const { userId, organizationId } = await requirePermission('deals:edit');
    const { canViewAll } = await getAiDealScope(userId, organizationId);
    const supabase = createAdminClient();
    let query = supabase
        .from('deals').select('*, deal_products(*), customer:accounts!deals_account_id_fkey(name)')
        .eq('organization_id', organizationId)
        .eq('stage', 'won');
    if (!canViewAll) query = query.eq('owner_id', userId);
    const { data, error } = await query.order('won_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar o extrato de comissões.');
    return data;
}

export async function updateDealCommissionStatus(dealId: string, updates: unknown) {
    // Paying commissions is an administrative financial operation.
    const { organizationId } = await requirePermission('settings:manage_users');
    try {
        const fields = sanitizeCommissionPayment(updates);
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('deals')
            .update(fields)
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .eq('stage', 'won')
            .select('id')
            .maybeSingle();
        if (error || !data) throw new Error('Commission not updated');
        revalidatePath('/goals-commissions');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível atualizar o pagamento da comissão.' };
    }
}

