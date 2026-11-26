'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import SalesList from '../sales/SalesList';

export default function SalesOrdersPage() {
    return (
        <div className="space-y-6 pb-10">
            <PageHeader title="Pedidos de Venda" description="Acompanhe o status de faturamento e entrega." />
            <SalesList initialTab="orders" />
        </div>
    );
}
