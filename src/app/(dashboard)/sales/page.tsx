import React from 'react';
import SalesList from './SalesList';
import { PageHeader } from '@/components/layout/PageHeader';

export const metadata = {
    title: 'Vendas | CRM Next Gen',
    description: 'Gerenciamento de pedidos e ciclo de vida de vendas.',
};

export default function SalesPage() {
    return (
        <div className="flex-1 space-y-8 pb-10">
            <PageHeader 
                title="Gestão de Vendas" 
                description="Acompanhe o ciclo completo desde a geração do pedido até o pagamento da comissão." 
            />

            <SalesList />
        </div>
    );
}
