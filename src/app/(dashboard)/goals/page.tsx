import { Suspense } from 'react';
import { requireSessionContext } from '@/lib/auth-server';
import { GoalsClientPage } from './client-page';
import { getUsersWithGoals, getCampaigns, getScenarios } from './actions';
import { getCommissionDeals } from '@/app/(dashboard)/goals-commissions/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function GoalsPage() {
    const { userId } = await requireSessionContext();

    const [rawUsers, campaigns, scenarios, deals] = await Promise.all([
        getUsersWithGoals(),
        getCampaigns(),
        getScenarios(userId),
        getCommissionDeals()
    ]);

    // Transform raw users to match UserGoalData
    const userData = rawUsers.map((u: any) => ({
        user_id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        monthly_goal: u.monthly_goal,
        yearly_goal: u.yearly_goal,
        quarterly_goals: u.quarterly_goals,
        commission_rules: u.commission_rules
    }));

    // Transform deals to match specific requirements if needed, or just pass
    const statementDeals = deals.map((d: any) => ({
        ...d,
        deal_products: d.deal_products || [] // Ensure array
    }));

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
            <GoalsClientPage
                userData={userData}
                campaigns={campaigns}
                scenarios={scenarios}
                statementDeals={statementDeals}
                currentUserId={userId}
            />
        </Suspense>
    );
}
