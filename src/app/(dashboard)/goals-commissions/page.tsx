import { Suspense } from 'react';
import { GoalsCommissionsClientPage } from './client-page';
import { getUsersWithGoals, getCampaigns, getScenarios, getCommissionDeals } from './actions';
import { requireSessionContext } from '@/lib/auth-server';

export const metadata = {
    title: 'Metas e Comissões | CRM Next Gen',
};

export default async function GoalsCommissionsPage() {
    const { userId } = await requireSessionContext();

    const [users, campaigns, scenarios, statementDeals] = await Promise.all([
        getUsersWithGoals(),
        getCampaigns(),
        getScenarios(userId),
        getCommissionDeals()
    ]);

    return (
        <Suspense fallback={<div className="text-white p-8">Carregando metas...</div>}>
            <GoalsCommissionsClientPage
                userData={users}
                campaigns={campaigns}
                scenarios={scenarios}
                statementDeals={statementDeals}
                currentUserId={userId}
            />
        </Suspense>
    );
}
