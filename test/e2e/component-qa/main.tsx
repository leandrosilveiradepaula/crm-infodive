import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/app/globals.css';
import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';

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
            </div>
        </main>
    );
}
createRoot(document.getElementById('root')!).render(<App />);
