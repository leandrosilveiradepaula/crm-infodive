'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';

export const AiActionsWidget = () => {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full">
            <AiSuggestionsPanel compact maxItems={5} />

            <button
                onClick={() => router.push('/activities')}
                className="w-full mt-4 py-3 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center gap-2 group shrink-0"
            >
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Ver Todas as Sugestões
            </button>
        </div>
    );
};
