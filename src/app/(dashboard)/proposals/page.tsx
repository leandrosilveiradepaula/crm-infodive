'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

export default function ProposalsPage() {
    const router = useRouter();
    return (
        <div className="space-y-8 pb-10">
            
            <PremiumEmptyState 
                icon={FileText}
                title="Nenhuma proposta recente"
                description="Crie novas propostas diretamente no Pipeline (Oportunidades) para gerenciar o histórico aqui."
                actionLabel="Ir para Pipeline"
                onAction={() => router.push('/pipeline')}
            />
        </div>
    );
}
