import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/app/globals.css';
import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import DesignPreviewPage from '@/app/(dashboard)/design-preview/page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const theme = new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.classList.toggle('dark', theme === 'dark');

function App() {
    const performers = [
        { owner: 'Operador Sintético A', count: 8, value: 78500, won: 4 },
        { owner: 'Operador Sintético B', count: 2, value: 45000, won: 1 },
    ];
    return (
        <main className="min-h-screen bg-background p-6 text-foreground">
            <h1 className="mb-4 text-xl font-bold">Auditoria de componentes CRM B4</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section aria-label="Sugestões vazias" className="min-w-0">
                    <AiSuggestionsPanel compact maxItems={5} />
                </section>
                <section aria-label="Sugestões presentes" className="min-w-0">
                    <AiSuggestionsPanel dealId="synthetic-active" maxItems={5} />
                </section>
                <section aria-label="Líderes de desempenho" className="min-w-0">
                    <TopPerformersWidget data={performers} />
                </section>
                <section aria-label="Campos em ambos os temas" className="min-w-0 rounded-xl border border-border bg-card p-3">
                    <Input aria-label="Campo sintético" placeholder="Nome sintético" value="Entrada de teste" readOnly />
                </section>
                <section aria-label="Navegação de vendas responsiva" className="min-w-0 lg:col-span-2">
                    <Tabs defaultValue="dashboard">
                        <TabsList aria-label="Navegação comercial" className="grid w-full grid-cols-2 gap-1 p-1 sm:inline-flex sm:w-auto sm:flex-wrap">
                            <TabsTrigger value="dashboard">Visão Geral</TabsTrigger>
                            <TabsTrigger value="orders">Pedidos <span className="rounded-md border border-border bg-surface-raised px-1.5 py-0.5 text-foreground">8</span></TabsTrigger>
                            <TabsTrigger value="installments">Financeiro</TabsTrigger>
                            <TabsTrigger value="commissions">Comissões</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dashboard">Painel de vendas demonstrativo</TabsContent>
                        <TabsContent value="orders">Pedidos demonstrativos</TabsContent>
                        <TabsContent value="installments">Financeiro demonstrativo</TabsContent>
                        <TabsContent value="commissions">Comissões demonstrativas</TabsContent>
                    </Tabs>
                </section>
                <section aria-label="Prévia real do sistema de design" className="min-w-0 lg:col-span-2">
                    <DesignPreviewPage />
                </section>
            </div>
        </main>
    );
}
createRoot(document.getElementById('root')!).render(<App />);
