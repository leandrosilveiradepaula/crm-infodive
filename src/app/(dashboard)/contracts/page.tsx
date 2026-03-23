import { Suspense } from 'react';
import { getContracts } from './actions';
import { ContractsClientPage } from './client-page';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function ContractsPage() {
    const contracts = await getContracts();

    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><LoadingSpinner /></div>}>
            <ContractsClientPage initialContracts={contracts} />
        </Suspense>
    );
}
