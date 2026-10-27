'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceDeskTicket,transitionServiceDeskTicket,
  listServiceDeskContracts } from './actions';

type Ticket = {id:string;ticket_number:number;subject:string;status:string;
  priority:string;account_name:string;contract_title:string|null;created_at:string};
type Account = {id:string;name:string};
type Contract = {id:string;title:string};

const transitions: Record<string, string[]> = {
  new:['open','in_progress','waiting_customer','waiting_third_party','resolved','closed'],
  open:['in_progress','waiting_customer','waiting_third_party','resolved','closed'],
  in_progress:['open','waiting_customer','waiting_third_party','resolved','closed'],
  waiting_customer:['open','in_progress','waiting_third_party','resolved','closed'],
  waiting_third_party:['open','in_progress','waiting_customer','resolved','closed'],
  resolved:['open','in_progress','closed','reopened'],
  closed:['reopened'],
  reopened:['open','in_progress','waiting_customer','waiting_third_party','resolved','closed']
};
export function ServiceDeskClient({tickets,accounts}:{tickets:Ticket[];accounts:Account[]}) {
  const router=useRouter();
  const [accountId,setAccountId]=useState('');
  const [contractId,setContractId]=useState('');
  const [contracts,setContracts]=useState<Contract[]>([]);
  const [subject,setSubject]=useState('');
  const [description,setDescription]=useState('');
  const [priority,setPriority]=useState<'low'|'normal'|'high'|'urgent'>('normal');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  async function onAccount(id:string) {
    setAccountId(id);setContractId('');setContracts([]);
    if (!id) return;
    try {setContracts(await listServiceDeskContracts(id));}
    catch {setMessage('Não foi possível consultar os contratos do CRM.');}
  }
  async function onCreate(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage('');
    try {
      await createServiceDeskTicket({accountId,contractId:contractId||null,
        subject,description,priority});
      setSubject('');setDescription('');setMessage('Chamado registrado no CRM.');
      router.refresh();
    } catch {setMessage('Falha ao criar chamado. Confira conta, contrato e permissões.');}
    finally {setBusy(false);}
  }
  async function advance(id:string,expected:string,next:string) {
    setBusy(true);setMessage('');
    try {await transitionServiceDeskTicket({id,expected,next});router.refresh();}
    catch {setMessage('Mudança rejeitada. Atualize a página e confira o chamado.');}
    finally {setBusy(false);}
  }
  return <main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-bold">Service Desk</h1>
      <p>Chamados associados aos mesmos clientes, contratos e usuários do CRM.</p></header>
    {message && <p role="status">{message}</p>}
    <form onSubmit={onCreate} className="grid gap-3 rounded-lg border p-4" aria-label="Novo chamado">
      <h2 className="font-semibold">Novo chamado</h2>
      <label>Cliente do CRM <select required value={accountId}
        onChange={e=>void onAccount(e.target.value)} className="w-full rounded border p-2">
        <option value="">Selecione</option>
        {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </select></label>
      <label>Contrato de serviço <select value={contractId} onChange={e=>setContractId(e.target.value)}
        className="w-full rounded border p-2">
        <option value="">Sem contrato</option>
        {contracts.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
      </select></label>
      <label>Assunto <input required minLength={3} maxLength={240} value={subject}
        onChange={e=>setSubject(e.target.value)} className="w-full rounded border p-2"/></label>
      <label>Descrição <textarea maxLength={5000} value={description}
        onChange={e=>setDescription(e.target.value)} className="w-full rounded border p-2"/></label>
      <label>Prioridade <select value={priority} onChange={e=>setPriority(e.target.value as typeof priority)}
        className="w-full rounded border p-2">
        <option value="low">Baixa</option><option value="normal">Normal</option>
        <option value="high">Alta</option><option value="urgent">Urgente</option>
      </select></label>
      <button type="submit" disabled={busy} className="rounded bg-primary px-4 py-2 text-primary-foreground">
        Criar chamado</button>
    </form>
    <section><h2 className="mb-3 text-lg font-semibold">Chamados</h2>
      {tickets.length===0?<p>Nenhum chamado nesta organização.</p>:
      <ul className="space-y-3">{tickets.map(t=><li key={t.id} className="rounded-lg border p-4">
        <strong>#{t.ticket_number} — {t.subject}</strong>
        <p>Cliente: {t.account_name} · {t.contract_title||'Sem contrato'}</p>
        <p>Status: {t.status} · Prioridade: {t.priority}</p>
        <div className="mt-2 flex flex-wrap gap-2">{(transitions[t.status]||[]).map(next=>
          <button key={next} type="button" disabled={busy}
            onClick={()=>void advance(t.id,t.status,next)} className="rounded border px-3 py-1">
            Mover para {next}</button>)}</div>
      </li>)}</ul>}
    </section>
  </main>;
}
