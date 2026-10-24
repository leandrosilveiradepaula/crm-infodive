import { Suspense } from 'react';
import { getContacts } from './actions';
import { ContactsClientPage } from './client-page';
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Ensure this exists or use standard loader

export const metadata = {
    title: 'Contatos | CRM Infodive',
};

export default async function ContactsPage() {
    const response = await getContacts();
    const contacts = response.contacts || [];

    return (
        <Suspense fallback={<div className="text-white p-8">Carregando contatos...</div>}>
            <ContactsClientPage initialContacts={contacts || []} />
        </Suspense>
    );
}
