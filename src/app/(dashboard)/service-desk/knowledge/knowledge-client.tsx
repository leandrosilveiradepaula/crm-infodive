'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createServiceDeskKnowledge,transitionServiceDeskKnowledge,
  updateServiceDeskKnowledge,type KnowledgeStatus,type KnowledgeVisibility} from '../actions';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { BookOpen } from 'lucide-react';

type Article={id:string;title:string;content:string;revision:number;
  status:KnowledgeStatus;visibility:KnowledgeVisibility;author_user_id:string;updated_at:string};
const flow:Record<KnowledgeStatus,KnowledgeStatus[]>={
 draft:['in_review','archived'],in_review:['draft','published','archived'],
 published:['in_review','archived'],archived:['draft']
};
export function KnowledgeClient({initialArticles}:{initialArticles:Article[]}) {
 const router=useRouter();
 const [title,setTitle]=useState('');
 const [content,setContent]=useState('');
 const [visibility,setVisibility]=useState<KnowledgeVisibility>('tenant');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [editing,setEditing]=useState<Article|null>(null);
 async function create(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage('');
  try{
    if(editing) await updateServiceDeskKnowledge({id:editing.id,
      expectedRevision:editing.revision,title,content,visibility});
    else await createServiceDeskKnowledge({title,content,visibility});
    setTitle('');setContent('');setEditing(null);
    setMessage('Revisão salva.');router.refresh();
  }catch{setMessage('Alteração recusada: revisão, organização ou permissão inválida.');}
  finally{setBusy(false);}
 }
 async function move(a:Article,next:KnowledgeStatus){
  setBusy(true);setMessage('');
  try{
    await transitionServiceDeskKnowledge({id:a.id,expectedRevision:a.revision,next});
    router.refresh();setMessage('Estado atualizado.');
  }catch{setMessage('Transição recusada; atualize a página.');}
  finally{setBusy(false);}
 }
 return <main className="space-y-6 pb-10">
  <PageHeader title="Base de conhecimento" description="Artigos vinculados à organização e à autenticação existentes no CRM." />
  {message&&<p role="status" className="rounded-[var(--radius-control)] border border-border bg-muted px-3 py-2 text-body-ui text-muted-foreground">{message}</p>}
  <Card><CardHeader><CardTitle>{editing?'Editar revisão':'Novo rascunho'}</CardTitle></CardHeader><CardContent><form onSubmit={create} className="grid gap-4">
    <label className="text-body-ui font-medium">Título<Input className="mt-1" required minLength={3}
      maxLength={240} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label className="text-body-ui font-medium">Conteúdo<Textarea className="mt-1" required
      maxLength={100000} rows={5} value={content} onChange={e=>setContent(e.target.value)}/></label>
    <label className="text-body-ui font-medium">Visibilidade
      <ThemeSelect className="mt-1" value={visibility}
        onChange={e=>setVisibility(e.target.value as KnowledgeVisibility)}>
        <option value="tenant">Organização</option>
        <option value="private">Privado</option>
        <option value="public">Público interno da organização</option>
      </ThemeSelect>
    </label>
    <div className="flex gap-2"><Button disabled={busy} type="submit">Salvar</Button>
      {editing&&<Button type="button" variant="outline" onClick={()=>{setEditing(null);setTitle('');setContent('');}}>Cancelar</Button>}</div>
  </form></CardContent></Card>
  <section className="space-y-3" aria-label="Artigos">
   {initialArticles.length===0?<PremiumEmptyState icon={BookOpen} title="Nenhum artigo" description="Crie um rascunho para iniciar a base de conhecimento."/>:
   initialArticles.map(a=><article key={a.id} className="rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
    <h2 className="font-semibold">{a.title}</h2>
    <p className="text-body-ui">Estado: {a.status} · Revisão: {a.revision} · {a.visibility}</p>
    <p className="whitespace-pre-wrap">{a.content}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {['draft','in_review'].includes(a.status)&&<Button type="button" size="sm" variant="outline"
       onClick={()=>{setEditing(a);setTitle(a.title);setContent(a.content);setVisibility(a.visibility);}}>
       Editar</Button>}
      {flow[a.status].map(next=><Button type="button" size="sm" variant="outline" key={next} disabled={busy}
       onClick={()=>void move(a,next)}>Mover para {next}</Button>)}
    </div>
   </article>)}
  </section>
 </main>;
}
