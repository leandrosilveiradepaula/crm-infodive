'use client';

import { FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

export default function PriceListsPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                title="Tabelas de Preço" 
                description="Gerencie listas de preços de fornecedores." 
            />
            <PremiumEmptyState icon={FileSpreadsheet} title="Nenhuma tabela importada" description="Importe planilhas de preços para atualizar o catálogo." />
        </div>
    );
}
