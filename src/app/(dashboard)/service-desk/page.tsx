import { listServiceDeskAccounts, listServiceDeskTickets } from './actions';
import { ServiceDeskClient } from './service-desk-client';

export const dynamic = 'force-dynamic';

export default async function ServiceDeskPage() {
  try {
    const [tickets, accounts] = await Promise.all([
      listServiceDeskTickets(),listServiceDeskAccounts()
    ]);
    return <ServiceDeskClient tickets={tickets} accounts={accounts}/>;
  } catch {
    return <main className="p-6"><h1 className="text-2xl font-bold">Service Desk</h1>
      <p role="alert" className="mt-4">Módulo indisponível ou acesso não autorizado.
      Nenhum banco alternativo será utilizado.</p></main>;
  }
}
