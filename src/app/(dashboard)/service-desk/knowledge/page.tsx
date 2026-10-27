import { listServiceDeskKnowledge } from '../actions';
import { KnowledgeClient } from './knowledge-client';
export const dynamic='force-dynamic';
export default async function KnowledgePage(){
  try{return <KnowledgeClient initialArticles={await listServiceDeskKnowledge()}/>;}
  catch{return <main className="p-6"><h1>Conhecimento</h1>
    <p role="alert">Não autorizado ou conhecimento indisponível.</p></main>;}
}
