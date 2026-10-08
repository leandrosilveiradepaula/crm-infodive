'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Zap, History, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { type Automation, type AutomationExecution } from "@/types/automation";

interface AutomationHistorySheetProps {
    automation: Automation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    executions: AutomationExecution[];
    loading: boolean;
    error?: string | null;
}

function statusLabel(status: AutomationExecution['status']) {
    if (status === 'success') return 'Sucesso';
    if (status === 'failed') return 'Falhou';
    if (status === 'running') return 'Em andamento';
    return 'Ignorada';
}

function statusIcon(status: AutomationExecution['status']) {
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === 'running') return <History className="h-5 w-5 text-amber-500" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
    return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
}

export function AutomationHistorySheet({
    automation,
    open,
    onOpenChange,
    executions,
    loading,
    error,
}: AutomationHistorySheetProps) {
    if (!automation) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl bg-card/95 backdrop-blur-2xl border-l border-white/10 p-0 overflow-hidden">
                <div className="relative h-full flex flex-col">
                    <SheetHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-foreground tracking-tight">{automation.name}</SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium">
                                    Execuções verificadas deste fluxo
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-8 pb-8">
                        {loading ? (
                            <div className="rounded-2xl border border-border bg-muted/20 p-8 text-center" role="status">
                                Carregando histórico...
                            </div>
                        ) : error ? (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6" role="alert">
                                <h4 className="font-bold text-foreground">Não foi possível carregar o histórico</h4>
                                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                                <p className="mt-2 text-sm text-muted-foreground">Feche e abra o histórico para tentar novamente.</p>
                            </div>
                        ) : executions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                                <History className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                                <h4 className="font-bold text-foreground">Nenhuma execução verificada</h4>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                    O histórico aparece aqui somente depois que um evento real do CRM é processado pelo runtime.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {executions.map((execution) => (
                                    <article key={execution.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {statusIcon(execution.status)}
                                                <div>
                                                    <strong className="text-sm text-foreground">{statusLabel(execution.status)}</strong>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(execution.executedAt).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold uppercase text-muted-foreground">{execution.trigger}</span>
                                        </div>
                                        <div className="mt-3 text-sm text-muted-foreground">
                                            {execution.actions.length
                                                ? 'Ações planejadas: ' + execution.actions.join(', ')
                                                : 'Nenhuma ação executada.'}
                                        </div>
                                        {execution.error ? (
                                            <div className="mt-2 text-sm text-red-500">
                                                Falha registrada: {execution.error}
                                            </div>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
