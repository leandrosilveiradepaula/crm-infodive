'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceDeskTicket,transitionServiceDeskTicket,
  listServiceDeskContracts,addServiceDeskComment,recordServiceDeskTime,
  requestServiceDeskAttachmentUpload,completeServiceDeskAttachmentUpload,
  listServiceDeskAttachments,getServiceDeskAttachmentUrl } from './actions';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { Inbox } from 'lucide-react';

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
  const [commentText,setCommentText]=useState<Record<string,string>>({});
  const [minutes,setMinutes]=useState<Record<string,string>>({});
  const [workNotes,setWorkNotes]=useState<Record<string,string>>({});
  const [attachmentFiles,setAttachmentFiles]=useState<Record<string,File|undefined>>({});
  const [attachments,setAttachments]=useState<Record<string,Array<{id:string;filename:string}>>>({});
  const fieldClass='mt-1 w-full';

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
  async function addComment(ticketId:string) {
    setBusy(true);setMessage('');
    try {
      await addServiceDeskComment({ticketId,body:commentText[ticketId]||'',visibility:'internal'});
      setCommentText(p=>({...p,[ticketId]:''}));setMessage('Comentário interno registrado.');
      router.refresh();
    } catch {setMessage('Comentário não autorizado ou indisponível.');}
    finally {setBusy(false);}
  }
  async function recordTime(ticketId:string) {
    setBusy(true);setMessage('');
    try {
      await recordServiceDeskTime({ticketId,minutes:Number(minutes[ticketId]),
        description:workNotes[ticketId]||''});
      setMinutes(p=>({...p,[ticketId]:''}));setWorkNotes(p=>({...p,[ticketId]:''}));
      setMessage('Apontamento de horas registrado.');
      router.refresh();
    } catch {setMessage('Apontamento rejeitado. Verifique os minutos e a descrição.');}
    finally {setBusy(false);}
  }
  async function refreshAttachments(ticketId:string){
    try {const records=await listServiceDeskAttachments(ticketId);
      setAttachments(p=>({...p,[ticketId]:records}));}
    catch {setMessage('Não foi possível listar anexos.');}
  }
  async function uploadAttachment(ticketId:string){
    const file=attachmentFiles[ticketId];if(!file)return;
    setBusy(true);setMessage('');
    try{
      if(file.size<1||file.size>5*1024*1024)
        throw new Error('File size out of bounds');
      const request={ticketId,filename:file.name,mimeType:file.type,size:file.size};
      const upload=await requestServiceDeskAttachmentUpload(request);
      // File goes straight to Supabase Storage with a path-scoped short-lived
      // token, not via Next.js Server Actions or a public bucket.
      const {createClient}=await import('@supabase/supabase-js');
      const client=createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const {error}=await client.storage.from('documents')
        .uploadToSignedUrl(upload.path,upload.token,file,{
          contentType:file.type,upsert:false
        });
      if(error)throw new Error('Upload rejected');
      await completeServiceDeskAttachmentUpload({...request,path:upload.path});
      setAttachmentFiles(p=>({...p,[ticketId]:undefined}));
      await refreshAttachments(ticketId);
      setMessage('Anexo registrado.');
    }catch{setMessage('Falha ao anexar arquivo. Verifique tamanho e formato.');}
    finally{setBusy(false);}
  }
  async function openAttachment(id:string){
    // Open only after the trusted CRM server authorizes a short-lived URL.
    try {const url=await getServiceDeskAttachmentUrl(id);
      window.open(url,'_blank','noopener,noreferrer');
    }catch{setMessage('Acesso ao anexo negado.');}
  }
  return <main className="space-y-6 pb-10">
    <PageHeader title="Service Desk" description="Chamados vinculados aos clientes e contratos já autorizados no CRM." />
    {message && <p role="status" className="rounded-[var(--radius-control)] border border-border bg-muted px-3 py-2 text-body-ui text-muted-foreground">{message}</p>}
    <Card><CardHeader><CardTitle>Novo chamado</CardTitle></CardHeader><CardContent><form onSubmit={onCreate} className="grid gap-4" aria-label="Novo chamado">
      <label className="text-body-ui font-medium">Cliente do CRM <ThemeSelect required value={accountId}
        onChange={e=>void onAccount(e.target.value)} className={fieldClass}>
        <option value="">Selecione</option>
        {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
      </ThemeSelect></label>
      <label className="text-body-ui font-medium">Contrato de serviço <ThemeSelect value={contractId} onChange={e=>setContractId(e.target.value)} className={fieldClass}>
        <option value="">Sem contrato</option>
        {contracts.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
      </ThemeSelect></label>
      <label className="text-body-ui font-medium">Assunto <Input required minLength={3} maxLength={240} value={subject} onChange={e=>setSubject(e.target.value)} className={fieldClass}/></label>
      <label className="text-body-ui font-medium">Descrição <Textarea maxLength={5000} value={description} onChange={e=>setDescription(e.target.value)} className={fieldClass}/></label>
      <label className="text-body-ui font-medium">Prioridade <ThemeSelect value={priority} onChange={e=>setPriority(e.target.value as typeof priority)} className={fieldClass}>
        <option value="low">Baixa</option><option value="normal">Normal</option>
        <option value="high">Alta</option><option value="urgent">Urgente</option>
      </ThemeSelect></label>
      <Button type="submit" disabled={busy} className="w-fit">Criar chamado</Button>
    </form></CardContent></Card>
    <section className="space-y-3"><h2 className="text-section-title font-semibold">Chamados</h2>
      {tickets.length===0?<PremiumEmptyState icon={Inbox} title="Nenhum chamado" description="Não há chamados nesta organização."/>:
      <ul className="space-y-3">{tickets.map(t=><li key={t.id} className="rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <strong>#{t.ticket_number} — {t.subject}</strong>
        <p>Cliente: {t.account_name} · {t.contract_title||'Sem contrato'}</p>
        <p>Status: {t.status} · Prioridade: {t.priority}</p>
        <div className="mt-2 flex flex-wrap gap-2">{(transitions[t.status]||[]).map(next=>
          <button key={next} type="button" disabled={busy}
            onClick={()=>void advance(t.id,t.status,next)} className="focus-ring rounded-[var(--radius-control)] border border-border px-3 py-1 text-metadata-ui hover:bg-muted">
            Mover para {next}</button>)}</div>
        <div className="mt-3 grid gap-2 border-t pt-3">
          <label className="text-body-ui">Anexo privado (PDF, PNG, JPEG ou TXT, até 5 MB)
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt"
              className="mt-1 w-full rounded-[var(--radius-control)] border border-input bg-surface-raised p-2 text-body-ui"
              onChange={e=>setAttachmentFiles(p=>({...p,[t.id]:e.target.files?.[0]}))}/>
          </label>
          <Button type="button" size="sm" disabled={busy||!attachmentFiles[t.id]}
            onClick={()=>void uploadAttachment(t.id)}
            className="w-fit">Enviar anexo</Button>
          <Button type="button" size="sm" disabled={busy}
            onClick={()=>void refreshAttachments(t.id)}
            className="w-fit" variant="outline">Listar anexos</Button>
          {(attachments[t.id]||[]).map(a=><button type="button" key={a.id}
            onClick={()=>void openAttachment(a.id)}
            className="w-fit text-left underline">{a.filename}</button>)}

          <label className="text-body-ui">Comentário interno
            <Textarea maxLength={5000} value={commentText[t.id]||''}
              onChange={e=>setCommentText(p=>({...p,[t.id]:e.target.value}))}
              className={fieldClass}/></label>
          <Button type="button" size="sm" variant="outline" disabled={busy||!(commentText[t.id]||'').trim()}
            onClick={()=>void addComment(t.id)} className="w-fit">Registrar comentário</Button>
          <label className="text-body-ui">Minutos trabalhados
            <Input type="number" min="1" max="1440" step="1"
              value={minutes[t.id]||''} onChange={e=>setMinutes(p=>({...p,[t.id]:e.target.value}))}
              className={fieldClass}/></label>
          <label className="text-body-ui">Descrição do trabalho
            <Textarea maxLength={5000} value={workNotes[t.id]||''}
              onChange={e=>setWorkNotes(p=>({...p,[t.id]:e.target.value}))}
              className={fieldClass}/></label>
          <Button type="button" size="sm" variant="outline" disabled={busy||!Number.isInteger(Number(minutes[t.id]))||
            Number(minutes[t.id])<1||!(workNotes[t.id]||'').trim()}
            onClick={()=>void recordTime(t.id)} className="w-fit">Registrar tempo</Button>
        </div>
      </li>)}</ul>}
    </section>
  </main>;
}
