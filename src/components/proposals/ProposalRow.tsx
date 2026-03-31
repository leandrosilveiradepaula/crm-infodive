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
            className="group bg-card border border-border hover:border-primary/50 hover:shadow-2xl rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start justify-between gap-4">
                {/* Left: Icon + Info */}
                <div className="flex items-start gap-3 flex-1 relative z-10">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all shadow-inner">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">
                                #{proposal.number}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border flex items-center gap-1 leading-none ${status.color}`}>
                                <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                            </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate tracking-tight">
                            {proposal.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
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

                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-right">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-0.5 opacity-60">
                            Valor Total
                        </p>
                        <p className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tighter">
                            {formatCurrency(proposal.total)}
                        </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground group-hover:text-white group-hover:bg-primary group-hover:border-primary transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <Eye className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
