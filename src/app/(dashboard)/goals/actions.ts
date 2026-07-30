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

    if (error) { console.error('[GoalsActions] users fetch failed'); return []; }

    return data.map((user: any) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url || user.name?.charAt(0).toUpperCase(),
        monthly_goal: user.monthly_goal,
        yearly_goal: user.yearly_goal,
        quarterly_goals: user.quarterly_goals,
        commission_rules: user.commission_rules,
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
    revalidatePath('/goals');
    return { success: true };
}

export async function getCampaigns(): Promise<Campaign[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
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
    revalidatePath('/goals');
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
    revalidatePath('/goals');
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
    revalidatePath('/goals');
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
    const { error } = await supabase.from('scenarios').insert([{
        ...scenario,
        user_id: userId,
        organization_id: organizationId
    }]);
    if (error) return { success: false, error: error.message };
    revalidatePath('/goals');
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
    revalidatePath('/goals');
    return { success: true };
}

export async function applyScenarioToGoals(
    scenarioId: string,
    customWeights?: { user_id: string; weight: number }[]
) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('organization_id', organizationId)
        .single();
    if (scenarioError || !scenario) return { success: false, error: 'Cenário não encontrado.' };

    const { data: users, error: usersError } = await supabase
        .from('profiles').select('id').eq('organization_id', organizationId);
    if (usersError || !users || users.length === 0)
        return { success: false, error: 'Nenhum usuário encontrado.' };

    const totalGoal = Number(scenario.revenue_goal) || 0;
    if (totalGoal <= 0) return { success: false, error: 'Cenário sem meta de faturamento definida.' };

    const qPct = scenario.quarterly_percentages || { q1: 25, q2: 25, q3: 25, q4: 25 };
    const useCustomWeights = customWeights && customWeights.length > 0 &&
        Math.abs(customWeights.reduce((s, w) => s + w.weight, 0) - 100) < 0.5;

    const weightMap = new Map<string, number>();
    if (useCustomWeights) for (const w of customWeights!) weightMap.set(w.user_id, w.weight / 100);

    const updatePromises = users.map(async (user) => {
        const ratio = useCustomWeights ? (weightMap.get(user.id) ?? 0) : 1 / users.length;
        const individualMonthly = totalGoal * ratio;
        const individualYearly = individualMonthly * 12;
        const payload = {
            monthly_goal: individualMonthly,
            yearly_goal: individualYearly,
            quarterly_goals: {
                q1: individualYearly * (qPct.q1 / 100),
                q2: individualYearly * (qPct.q2 / 100),
                q3: individualYearly * (qPct.q3 / 100),
                q4: individualYearly * (qPct.q4 / 100),
            }
        };
        return supabase
            .from('profiles')
            .update(payload)
            .eq('id', user.id)
            .eq('organization_id', organizationId)
            .select();
    });

    try {
        const results = await Promise.all(updatePromises);
        const hasErrors = results.some(r => r.error);
        if (hasErrors) {
            const errorDetails = results.filter(r => r.error).map(r => r.error?.message).join('; ');
            return { success: false, error: 'O Banco rejeitou: ' + errorDetails };
        }
        const totalRowsAffected = results.reduce((sum, res) => sum + (res.data?.length || 0), 0);
        if (totalRowsAffected === 0)
            return { success: false, error: 'Nenhum perfil foi alterado. Verifique as permissões.' };
    } catch (err: any) {
        return { success: false, error: 'Erro inesperado: ' + err.message };
    }

    revalidatePath('/goals');
    revalidatePath('/goals-commissions');
    return { success: true };
}
