import { Suspense } from 'react';
import { getLeads } from './actions';
import { LeadsClientPage } from './client-page';

export const metadata = {
    title: 'Leads | CRM Next Gen',
};

export default async function LeadsPage() {
    const leads = await getLeads();

    return (
        <Suspense fallback={<div className="text-white p-8">Carregando leads...</div>}>
            <LeadsClientPage initialLeads={leads} />
        </Suspense>
    );
}
