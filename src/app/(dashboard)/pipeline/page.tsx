import { Suspense } from 'react';
import { getPipelineData } from './actions';
import { PipelineClientPage } from './client-page';
import { SettingsService } from '@/services/SettingsService';
import { requireSessionContext } from '@/lib/auth-server';

export default async function PipelinePage() {
    const { deals, profile, distributors, allAccounts } = await getPipelineData();
    const { organizationId } = await requireSessionContext();
    // Missing stage configuration is an error; never silently show a stale board.
    const configuredStages = await SettingsService.getPipelineStages(organizationId);

    return (
        <Suspense fallback={<div className="text-foreground p-8">Carregando pipeline...</div>}>
            <PipelineClientPage
                initialDeals={deals}
                configuredStages={configuredStages}
                userProfile={profile}
                distributors={distributors || []}
                allAccounts={allAccounts || []}
            />
        </Suspense>
    );
}
