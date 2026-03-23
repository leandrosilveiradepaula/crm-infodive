import { Suspense } from 'react';
import { getIntegrations, getApiKeys, getWebhooks } from './actions';
import IntegrationsClientPage from './client-page';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function IntegrationsPage() {
    const [integrations, keys, webhooks] = await Promise.all([
        getIntegrations(),
        getApiKeys(),
        getWebhooks()
    ]);

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
            <IntegrationsClientPage
                initialIntegrations={integrations}
                initialKeys={keys}
                initialWebhooks={webhooks}
            />
        </Suspense>
    );
}
