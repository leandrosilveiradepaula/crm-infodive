'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface UserScore {
    user_id: string;
    total_score: number;
    deals_won_count: number;
    revenue_generated: number;
    current_streak: number;
    user?: { name: string; email: string; };
    badges?: Badge[];
}

export async function getLeaderboard(): Promise<UserScore[]> {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    try {
        const { data: scoresData, error: scoresError } = await supabase
            .from('user_scores')
            .select('*')
            .eq('organization_id', organizationId)
            .order('total_score', { ascending: false });

        if (scoresError) throw scoresError;
        if (!scoresData || scoresData.length === 0) return [];

        const userIds = scoresData.map(s => s.user_id);

        const { data: profilesData } = await supabase
            .from('profiles').select('id, full_name, email').in('id', userIds)
            .eq('organization_id', organizationId);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

        const { data: userBadgesData } = await supabase
            .from('user_badges')
            .select('user_id, badge_id, gamification_badges(name, description, icon)')
            .in('user_id', userIds)
            .eq('organization_id', organizationId);

        const badgesMap = new Map<string, Badge[]>();
        if (userBadgesData) {
            userBadgesData.forEach((ub: any) => {
                const badgeInfo = ub.gamification_badges;
                if (badgeInfo) {
                    const existing = badgesMap.get(ub.user_id) || [];
                    existing.push({ id: ub.badge_id, name: badgeInfo.name, description: badgeInfo.description, icon: badgeInfo.icon });
                    badgesMap.set(ub.user_id, existing);
                }
            });
        }

        return scoresData.map((s) => {
            const profile = profilesMap.get(s.user_id);
            return {
                ...s,
                user: { name: profile?.full_name || 'Usuário Desconhecido', email: profile?.email || '' },
                badges: badgesMap.get(s.user_id) || []
            };
        });
    } catch {
        console.error('[GamificationActions] leaderboard fetch failed');
        return [];
    }
}
