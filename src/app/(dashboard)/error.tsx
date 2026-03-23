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
            <div className="bg-red-500/10 p-4 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Algo deu errado no sistema</h2>
            <p className="text-muted-foreground max-w-md">
                Encontramos um erro ao carregar esta página. Isso pode ser devido a uma falha de conexão ou configuração pendente (ex: Banco de Dados).
            </p>
            <div className="p-4 bg-black/20 rounded-lg border border-white/5 text-left w-full max-w-lg overflow-auto max-h-40">
                <code className="text-xs text-red-300 font-mono">
                    {error.message || "Erro desconhecido"}
                </code>
            </div>
            <div className="flex gap-4">
                <Button
                    onClick={() => reset()}
                    variant="default"
                    className="bg-primary hover:bg-primary font-bold"
                >
                    Tentar Novamente
                </Button>
                <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="border-white/10 hover:bg-card/5"
                >
                    Recarregar Página
                </Button>
            </div>
        </div>
    );
}
