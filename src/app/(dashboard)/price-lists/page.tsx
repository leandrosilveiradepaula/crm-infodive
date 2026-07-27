import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";

export default function PriceListsPage() {
    return (
        <div className="space-y-8 pb-10">
            
            <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">Nenhuma tabela importada</h3>
                    <p>Importe planilhas de preços para atualizar o catálogo.</p>
                </CardContent>
            </Card>
        </div>
    );
}
