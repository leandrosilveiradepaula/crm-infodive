'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
            <div className="bg-destructive-subtle p-4 rounded-full">
                <AlertCircle className="h-10 w-10 text-destructive-readable" />
            </div>
            <h2 className="text-page-title font-bold text-foreground">Algo deu errado no sistema</h2>
            <p className="text-muted-foreground max-w-md">
                Encontramos um erro ao carregar esta página. Isso pode ser devido a uma falha de conexão ou configuração pendente (ex: Banco de Dados).
            </p>
            <div className="p-4 bg-card rounded-[var(--radius-panel)] border border-border text-left w-full max-w-lg overflow-auto max-h-40">
                <code className="text-metadata-ui text-destructive-readable font-mono">
                    {error.message || "Erro desconhecido"}
                </code>
            </div>
            <div className="flex gap-4">
                <Button
                    onClick={() => reset()}
                    variant="default"
                    className="min-h-[var(--ds-control-height-large)]"
                    aria-label="Tentar novamente"
                >
                    Tentar Novamente
                </Button>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="min-h-[var(--ds-control-height-large)]"
                    aria-label="Recarregar página"
                >
                    Recarregar Página
                </Button>
            </div>
        </div>
    );
}
