import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

export default function SalesOrdersPage() {
    return (
        <div className="space-y-8 pb-10">
            <PageHeader 
                title="Pedidos de Venda" 
                description="Acompanhe o status de faturamento e entrega." 
            />
            <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <Truck className="h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">Nenhum pedido recente</h3>
                    <p>Os pedidos de venda serão listados aqui.</p>
                </CardContent>
            </Card>
        </div>
    );
}
