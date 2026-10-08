'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { Campaign, Scenario, UserGoalData } from '@/types/goal';
import { sanitizeGoalWrite, sanitizeScenarioWrite, validateGoalDistribution } from '@/lib/goal-mutation-integrity';
import {
    getCampaigns as readCanonicalCampaigns,
    createCampaign as createCanonicalCampaign,
    updateCampaign as updateCanonicalCampaign,
    deleteCampaign as deleteCanonicalCampaign,
} from '../goals-commissions/actions';

export async function getUsersWithGoals() {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');

    if (error) { console.error('[GoalsActions] users fetch failed'); throw new Error('Não foi possível carregar as metas da equipe.'); }

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
    try {
        const safe = sanitizeGoalWrite(data);
        const supabase = createAdminClient();
        const { data: changed, error } = await supabase
            .from('profiles')
            .update(safe)
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();
        if (error || !changed) throw new Error('No profile updated');
        revalidatePath('/goals');
        revalidatePath('/goals-commissions');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível atualizar as metas.' };
    }
}

export async function getCampaigns(): Promise<Campaign[]> {
    return readCanonicalCampaigns();
}

export async function createCampaign(campaign: Partial<Campaign>) {
    const result = await createCanonicalCampaign(campaign);
    if (result.success) revalidatePath('/goals');
    return result;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>) {
    const result = await updateCanonicalCampaign(id, updates);
    if (result.success) revalidatePath('/goals');
    return result;
}

export async function deleteCampaign(id: string) {
    const result = await deleteCanonicalCampaign(id);
    if (result.success) revalidatePath('/goals');
    return result;
}

export async function getScenarios(requestedUserId: string): Promise<Scenario[]> {
    const { userId, organizationId } = await requireSessionContext();
    if (requestedUserId !== userId) throw new Error('Não autorizado a ler cenários de outro usuário.');
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
    const { userId, organizationId } = await requireSessionContext();
    try {
        const safe = sanitizeScenarioWrite(scenario);
        const supabase = createAdminClient();
        const { error } = await supabase.from('scenarios').insert([{
            ...safe,
            user_id: userId,
            organization_id: organizationId,
        }]);
        if (error) throw error;
        revalidatePath('/goals');
        revalidatePath('/goals-commissions');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível salvar o cenário.' };
    }
}

export async function deleteScenario(id: string) {
    const { userId, organizationId } = await requireSessionContext();
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
    revalidatePath('/goals');
    revalidatePath('/goals-commissions');
    return { success: true };
}

export async function applyScenarioToGoals(
    scenarioId: string,
    customWeights?: { user_id: string; weight: number }[]
) {
    const { userId, organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();
    if (scenarioError || !scenario) return { success: false, error: 'Cenário não encontrado.' };

    const { data: users, error: usersError } = await supabase
        .from('profiles').select('id').eq('organization_id', organizationId);
    if (usersError || !users || users.length === 0)
        return { success: false, error: 'Nenhum usuário encontrado.' };

    let allocation: ReturnType<typeof validateGoalDistribution>;
    try {
        allocation = validateGoalDistribution(
            scenario.revenue_goal, scenario.quarterly_percentages,
            users.map(user => user.id), customWeights,
        );
    } catch {
        return { success: false, error: 'Distribuição inválida. Revise as metas e os pesos dos usuários.' };
    }

    const updatePromises = users.map(async (user) => {
        const ratio = allocation.weights.get(user.id);
        if (ratio === undefined) throw new Error('Missing distribution member');
        const individualMonthly = allocation.totalGoal * ratio;
        const individualYearly = individualMonthly * 12;
        const payload = {
            monthly_goal: individualMonthly,
            yearly_goal: individualYearly,
            quarterly_goals: {
                q1: individualYearly * (allocation.quarters.q1 / 100),
                q2: individualYearly * (allocation.quarters.q2 / 100),
                q3: individualYearly * (allocation.quarters.q3 / 100),
                q4: individualYearly * (allocation.quarters.q4 / 100),
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
            return { success: false, error: 'Não foi possível processar a meta.' };
        }
        const totalRowsAffected = results.reduce((sum, res) => sum + (res.data?.length || 0), 0);
        if (totalRowsAffected !== users.length)
            return { success: false, error: 'Não foi possível confirmar a atualização de todos os perfis.' };
    } catch {
        return { success: false, error: 'Não foi possível processar a meta.' };
    }

    revalidatePath('/goals');
    revalidatePath('/goals-commissions');
    return { success: true };
}
