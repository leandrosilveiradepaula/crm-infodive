import { Suspense } from 'react';
import { getAutomations } from './actions';
import AutomationsClientPage from './client-page';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function AutomationsPage() {
    const automations = await getAutomations();

    return (
        <div className="pb-20">
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
                <AutomationsClientPage initialAutomations={automations} />
            </Suspense>
        </div>
    );
}
