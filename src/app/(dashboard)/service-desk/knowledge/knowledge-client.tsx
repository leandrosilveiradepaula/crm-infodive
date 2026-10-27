'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createServiceDeskKnowledge,transitionServiceDeskKnowledge,
  updateServiceDeskKnowledge,type KnowledgeStatus,type KnowledgeVisibility} from '../actions';

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
 return <main className="space-y-6 p-6">
  <h1 className="text-2xl font-semibold">Base de conhecimento do CRM</h1>
  <p>Artigos são vinculados à organização e à autenticação já existentes no CRM.</p>
  {message&&<p role="status">{message}</p>}
  <form onSubmit={create} className="grid gap-3 rounded border p-4">
    <h2 className="font-semibold">{editing?'Editar revisão':'Novo rascunho'}</h2>
    <label>Título<input className="w-full rounded border p-2" required minLength={3}
      maxLength={240} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Conteúdo<textarea className="w-full rounded border p-2" required
      maxLength={100000} rows={5} value={content} onChange={e=>setContent(e.target.value)}/></label>
    <label>Visibilidade
      <select className="w-full rounded border p-2" value={visibility}
        onChange={e=>setVisibility(e.target.value as KnowledgeVisibility)}>
        <option value="tenant">Organização</option>
        <option value="private">Privado</option>
        <option value="public">Público interno da organização</option>
      </select>
    </label>
    <div className="flex gap-2"><button className="rounded border px-3 py-2"
      disabled={busy} type="submit">Salvar</button>
      {editing&&<button type="button" onClick={()=>{setEditing(null);setTitle('');setContent('');}}
        className="rounded border px-3 py-2">Cancelar</button>}</div>
  </form>
  <section className="space-y-3" aria-label="Artigos">
   {initialArticles.length===0?<p>Nenhum artigo disponível.</p>:
   initialArticles.map(a=><article key={a.id} className="rounded border p-4">
    <h2 className="font-semibold">{a.title}</h2>
    <p className="text-sm">Estado: {a.status} · Revisão: {a.revision} · {a.visibility}</p>
    <p className="whitespace-pre-wrap">{a.content}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {['draft','in_review'].includes(a.status)&&<button type="button" className="rounded border px-3 py-1"
       onClick={()=>{setEditing(a);setTitle(a.title);setContent(a.content);setVisibility(a.visibility);}}>
       Editar</button>}
      {flow[a.status].map(next=><button type="button" key={next} disabled={busy}
       className="rounded border px-3 py-1" onClick={()=>void move(a,next)}>Mover para {next}</button>)}
    </div>
   </article>)}
  </section>
 </main>;
}
