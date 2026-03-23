import { Suspense } from 'react';
import { EmailClient } from '@/components/email/EmailClient';
import { PageHeader } from '@/components/layout/PageHeader';

export default function InboxPage() {
    return (
        <div className="flex-1 space-y-8 pb-10">
            <PageHeader 
                title="Caixa de Entrada" 
                description="Gerencie suas mensagens e notificações." 
            />

            <Suspense fallback={<div>Carregando emails...</div>}>
                <EmailClient />
            </Suspense>
        </div>
    );
}
