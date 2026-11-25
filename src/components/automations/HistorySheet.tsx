'use client';

import { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { Button } from '@/components/ui/button';
import { type Automation } from '@/types/automation';
import { automationSummary } from './automation-presentation';

interface AutomationHistorySheetProps {
    automation: Automation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AutomationHistorySheet({ automation, open, onOpenChange }: AutomationHistorySheetProps) {
    const opener = useRef<HTMLElement | null>(null);
    useDialogBackgroundInert(open && Boolean(automation));
    if (!automation) return null;

    const summary = automationSummary([automation]);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] flex-col gap-0 overflow-hidden bg-card p-0"
                onOpenAutoFocus={() => {
                    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                }}
                onCloseAutoFocus={event => {
                    event.preventDefault();
                    const target = opener.current;
                    if (target?.isConnected) requestAnimationFrame(() => target.focus());
                }}
            >
                <div className="shrink-0 border-b border-border p-4 sm:p-6">
                    <DialogTitle className="leading-snug">Execuções de automação</DialogTitle>
                    <DialogDescription className="mt-1 break-words">{automation.name}</DialogDescription>
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3">
                            <dt className="text-label-ui text-muted-foreground">Status configurado</dt>
                            <dd className="mt-1 text-body-ui font-semibold text-foreground">{automation.enabled ? 'Habilitado' : 'Pausado'}</dd>
                        </div>
                        <div className="rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3">
                            <dt className="text-label-ui text-muted-foreground">Execuções registradas</dt>
                            <dd className="mt-1 text-section-title font-semibold text-foreground">{summary.executions}</dd>
                        </div>
                        <div className="rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3">
                            <dt className="text-label-ui text-muted-foreground">Taxa de sucesso</dt>
                            <dd className="mt-1 text-body-ui font-semibold text-foreground">{summary.successRate === null ? '—' : `${summary.successRate.toFixed(1)}%`}</dd>
                        </div>
                        <div className="rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3">
                            <dt className="text-label-ui text-muted-foreground">Falhas registradas</dt>
                            <dd className="mt-1 text-section-title font-semibold text-foreground">{automation.failureCount || 0}</dd>
                        </div>
                    </dl>
                    <section aria-label="Disponibilidade do histórico" className="space-y-2 rounded-[var(--radius-panel)] border border-border p-4">
                        <h3 className="text-section-title font-semibold text-foreground">Histórico detalhado indisponível</h3>
                        <p className="text-body-ui text-muted-foreground">Este módulo apresenta os contadores disponíveis no cadastro. A consulta aos registros individuais e a execução automática ainda não foram validadas.</p>
                    </section>
                </div>
                <div className="flex shrink-0 justify-end border-t border-border p-4 sm:px-6">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
