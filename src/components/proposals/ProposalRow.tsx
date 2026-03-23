import React from 'react';
import { FileText, Calendar, Eye, CheckCircle2, TrendingUp, Send, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Proposal } from '@/types/proposal';

interface ProposalRowProps {
    proposal: Proposal;
    onView: (proposal: Proposal) => void;
}

export function ProposalRow({ proposal, onView }: ProposalRowProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'draft': return { color: 'bg-muted text-muted-foreground border-border', label: 'Rascunho', icon: Clock };
            case 'sent': return { color: 'bg-primary/10 text-primary border-primary/20', label: 'Enviada', icon: Send };
            case 'viewed': return { color: 'bg-stage-proposal/10 text-stage-proposal border-stage-proposal/20', label: 'Visualizada', icon: Eye };
            case 'signed': return { color: 'bg-success/10 text-success border-success/20', label: 'Assinada', icon: CheckCircle2 };
            case 'rejected': return { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Recusada', icon: AlertCircle };
            default: return { color: 'bg-muted text-muted-foreground border-border', label: status, icon: FileText };
        }
    };

    const status = getStatusConfig(proposal.status);
    const StatusIcon = status.icon;

    return (
        <div
            onClick={() => onView(proposal)}
            className="group bg-card border border-border hover:border-primary/50 hover:shadow-2xl rounded-2xl p-6 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start justify-between gap-6">
                {/* Left: Icon + Info */}
                <div className="flex items-start gap-4 flex-1 relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all shadow-inner">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                                #{proposal.number}
                            </span>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${status.color}`}>
                                <StatusIcon className="h-3 w-3" /> {status.label}
                            </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors truncate tracking-tight">
                            {proposal.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            {proposal.template && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border capitalize">
                                    <TrendingUp className="h-3 w-3" />
                                    {proposal.template}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black mb-1">
                            Valor Total
                        </p>
                        <p className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter">
                            {formatCurrency(proposal.total)}
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground group-hover:text-white group-hover:bg-primary group-hover:border-primary transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <Eye className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
