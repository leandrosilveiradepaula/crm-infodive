import { Suspense } from 'react';
import { EmailClient } from '@/components/email/EmailClient';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function InboxPage() {
    return (
        <div className="flex-1 space-y-6 pb-10">
            <PageHeader 
                title="Caixa de Entrada" 
                description="Gerencie suas mensagens e notificações." 
            />

            <Suspense fallback={<Card><CardContent className="p-6 text-sm text-muted-foreground">Carregando emails...</CardContent></Card>}>
                <EmailClient />
            </Suspense>
        </div>
    );
}
