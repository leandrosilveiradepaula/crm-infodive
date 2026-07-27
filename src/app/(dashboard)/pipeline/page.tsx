import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
import { getPipelineData } from './actions';
import { PipelineClientPage } from './client-page';

export default async function PipelinePage() {
    const { deals, profile, distributors, allAccounts } = await getPipelineData();

    return (
        <Suspense fallback={<div className="text-white p-8">Carregando pipeline...</div>}>
            <PipelineClientPage
                initialDeals={deals}
                userProfile={profile}
                distributors={distributors || []}
                allAccounts={allAccounts || []}
            />
        </Suspense>
    );
}
