import { Suspense } from 'react';
import { EmailClient } from '@/components/email/EmailClient';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";

export default function InboxPage() {
    return (
        <div className="flex-1 space-y-8 pb-10">
            

            <Suspense fallback={<div>Carregando emails...</div>}>
                <EmailClient />
            </Suspense>
        </div>
    );
}
