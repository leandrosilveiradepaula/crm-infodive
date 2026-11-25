import { PageHeader } from '@/components/layout/PageHeader';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { AlertCircle } from 'lucide-react';
import { listServiceDeskKnowledge } from '../actions';
import { KnowledgeClient } from './knowledge-client';
export const dynamic='force-dynamic';
export default async function KnowledgePage(){
  try{return <KnowledgeClient initialArticles={await listServiceDeskKnowledge()}/>;}
  catch{return <div className="space-y-6 pb-10">
    <PageHeader title="Base de conhecimento" />
    <div role="alert"><PremiumEmptyState icon={AlertCircle} title="Acesso indisponível" description="Não autorizado ou conhecimento indisponível." /></div>
  </div>;}
}
