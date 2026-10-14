'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <section
            role="alert"
            aria-live="assertive"
            className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 text-center text-foreground"
        >
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Não foi possível carregar o dashboard</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
                Os indicadores não foram atualizados. Não vamos apresentar valores zerados
                enquanto a consulta estiver indisponível. Tente carregar novamente.
            </p>
            <Button type="button" onClick={reset} className="min-h-11 gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Tentar novamente
            </Button>
        </section>
    );
}
