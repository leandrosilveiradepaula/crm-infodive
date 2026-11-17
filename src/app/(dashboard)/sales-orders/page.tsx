'use client';

import { Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

export default function SalesOrdersPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader 
                title="Pedidos de Venda" 
                description="Acompanhe o status de faturamento e entrega." 
            />
            <PremiumEmptyState icon={Truck} title="Nenhum pedido recente" description="Os pedidos de venda serão listados aqui." />
        </div>
    );
}
