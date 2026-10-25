import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { decideServiceDeskEntry } from '@/lib/service-desk/entry-guard';

export default async function ServiceDeskPage() {
    const session = await getSession();
    const entryDecision = decideServiceDeskEntry(session);

    if (!entryDecision.admitted) {
        redirect('/login');
    }

    return (
        <main className="space-y-4 p-6 md:p-8">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Service Desk</h1>
                <p className="text-muted-foreground">
                    A abertura e a consulta de chamados ainda não estão habilitadas enquanto o backend do Service Desk não for integrado.
                </p>
            </div>
        </main>
    );
}
