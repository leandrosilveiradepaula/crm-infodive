import React from 'react';
import { FileText, Calendar, Eye, CheckCircle2, TrendingUp, Send, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Proposal } from '@/types/proposal';
import { Button } from '@/components/ui/button';

interface ProposalRowProps {
    proposal: Proposal;
    onView: (proposal: Proposal) => void;
}

export function ProposalRow({ proposal, onView }: ProposalRowProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'draft': return { color: 'bg-muted text-muted-foreground border-border', label: 'Rascunho', icon: Clock };
            case 'sent': return { color: 'bg-surface-subtle text-foreground border-border', label: 'Enviada', icon: Send };
            case 'viewed': return { color: 'bg-surface-subtle text-foreground border-border', label: 'Visualizada', icon: Eye };
            case 'signed': return { color: 'bg-success-subtle text-success-readable border-border', label: 'Assinada', icon: CheckCircle2 };
            case 'rejected': return { color: 'bg-destructive-subtle text-destructive-readable border-border', label: 'Recusada', icon: AlertCircle };
            default: return { color: 'bg-muted text-muted-foreground border-border', label: status, icon: FileText };
        }
    };

    const status = getStatusConfig(proposal.status);
    const StatusIcon = status.icon;

    return (
        <article className="group min-w-0 bg-card border border-border rounded-[var(--radius-panel)] p-3 sm:p-4 shadow-control-ui">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Icon + Info */}
                <div className="flex min-w-0 items-start gap-3 flex-1">
                    <div className="h-9 w-9 rounded-[var(--radius-control)] bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all shadow-inner">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-metadata-ui font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                                #{proposal.number}
                            </span>
                            <span className={`text-metadata-ui font-medium px-2 py-0.5 rounded-[var(--radius-control)] border flex items-center gap-1 leading-none ${status.color}`}>
                                <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                            </span>
                        </div>
                        <h4 className="text-body-ui font-bold text-foreground mb-1 break-words tracking-tight">
                            {proposal.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-metadata-ui text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            {proposal.template && (
                                <span className="flex items-center gap-1 px-1.5 py-0 rounded bg-muted border border-border">
                                    <TrendingUp className="h-2.5 w-2.5" />
                                    {proposal.template}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <div className="text-right">
                        <p className="text-label-ui text-muted-foreground font-medium mb-0.5">
                            Valor Total
                        </p>
                        <p className="text-section-title font-semibold text-foreground">
                            {formatCurrency(proposal.total)}
                        </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" aria-label={`Abrir proposta ${proposal.title || proposal.number}`} onClick={() => onView(proposal)}>
                        <Eye aria-hidden="true" /> Abrir
                    </Button>
                </div>
            </div>
        </article>
    );
}
