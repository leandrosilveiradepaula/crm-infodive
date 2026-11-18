import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/app/globals.css';
import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import DesignPreviewPage from '@/app/(dashboard)/design-preview/page';
import { GoalsTab } from '@/components/goals/tabs/GoalsTab';
import AutomationsClientPage from '@/app/(dashboard)/automations/client-page';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const theme = new URLSearchParams(window.location.search).get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.classList.toggle('dark', theme === 'dark');

function App() {
    const syntheticGoals = Array.from({ length: 6 }, (_, i) => ({
        user_id: 'qa-synthetic-user-' + i,
        name: 'Operador QA ' + (i + 1),
        yearly_goal: 400000,
        monthly_goal: 35000,
        quarterly_goals: { q1: 100000, q2: 100000, q3: 100000, q4: 100000 },
        commission_rules: {
            hardware: { base: 1, new: 2 },
            software: { base: 1, new: 2 },
            services: { base: 1, new: 2 },
        },
    }));
    const syntheticAutomations = [
        {
            id: 'qa-automation-1', name: 'Follow-up QA fictício', description: 'Lembrete automático de exemplo',
            enabled: true, category: 'followup', trigger: { type: 'deal_created', config: {} },
            conditions: [], actions: [{ type: 'send_notification', config: {} }], createdBy: 'qa-synthetic',
            createdAt: '2026-01-01', updatedAt: '2026-01-01', executionCount: 10, successCount: 8, failureCount: 2,
        },
        {
            id: 'qa-automation-2', name: 'Fluxo pausado de teste', description: 'Validação de contraste do fluxo pausado',
            enabled: false, category: 'alert', trigger: { type: 'deal_stagnant', config: {} },
            conditions: [], actions: [{ type: 'create_task', config: {} }], createdBy: 'qa-synthetic',
            createdAt: '2026-01-01', updatedAt: '2026-01-01', executionCount: 0, successCount: 0, failureCount: 0,
        },
    ];
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
                <section aria-label="Metas reais com dados sintéticos" className="min-w-0 lg:col-span-2 rounded-xl border border-border bg-card p-3">
                    <GoalsTab users={syntheticGoals} deals={[]} />
                </section>
                <section aria-label="Automações reais com dados sintéticos" className="min-w-0 lg:col-span-2 rounded-xl border border-border bg-card p-3">
                    <AutomationsClientPage initialAutomations={syntheticAutomations as any} />
                </section>
            </div>
        </main>
    );
}
createRoot(document.getElementById('root')!).render(<App />);
