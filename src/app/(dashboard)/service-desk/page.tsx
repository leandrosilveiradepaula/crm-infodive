import { PageHeader } from '@/components/layout/PageHeader';
import { UnavailableWorkspaceState } from '@/components/layout/UnavailableWorkspaceState';
import { listServiceDeskAccounts, listServiceDeskTickets } from './actions';
import { ServiceDeskClient } from './service-desk-client';

export const dynamic = 'force-dynamic';

export default async function ServiceDeskPage() {
  try {
    const [tickets, accounts] = await Promise.all([
      listServiceDeskTickets(),listServiceDeskAccounts()
    ]);
    return <><nav className="p-6"><a className="underline" href="/service-desk/knowledge">Abrir base de conhecimento</a></nav><ServiceDeskClient tickets={tickets} accounts={accounts}/></>;
  } catch {
    return <div className="space-y-6 pb-10">
      <PageHeader title="Service Desk" />
      <UnavailableWorkspaceState description="Módulo indisponível ou acesso não autorizado. Nenhum banco alternativo será utilizado." />
    </div>;
  }
}
