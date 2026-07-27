import React from 'react';
import SalesList from './SalesList';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";

export const metadata = {
    title: 'Vendas | CRM Next Gen',
    description: 'Gerenciamento de pedidos e ciclo de vida de vendas.',
};

export default function SalesPage() {
    return (
        <div className="flex-1 space-y-8 pb-10">
            

            <SalesList />
        </div>
    );
}
