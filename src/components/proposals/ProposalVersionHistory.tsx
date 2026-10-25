import React, { useEffect, useState } from 'react';
import { Proposal } from '@/types/proposal';
import { getProposals } from '@/app/(dashboard)/proposals/proposals-actions';
import { Loader2, History, GitCommit, ArrowRight, Copy, Plus, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProposalVersionHistoryProps {
    dealId: string;
    currentProposalId: string;
}

export function ProposalVersionHistory({ dealId, currentProposalId }: ProposalVersionHistoryProps) {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchHistory() {
            try {
                const data = await getProposals(dealId);
                // Sort by version descending
                const sorted = data.sort((a, b) => (b.version || 0) - (a.version || 0));
                setProposals(sorted);
            } catch (error) {
                console.error('Error fetching proposal version history:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [dealId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Carregando histórico...</span>
            </div>
        );
    }

    if (proposals.length <= 1) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-border text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                    <History className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Apenas uma versão</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                    Esta é a primeira e única versão da proposta para esta oportunidade até o momento.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-border shadow-sm p-4 overflow-hidden relative">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-teal-600" />
                Histórico de Versões
            </h3>

            <div className="absolute left-8 top-[60px] bottom-8 w-px bg-border/50 hidden md:block" />

            <div className="space-y-4 relative z-10">
                {proposals.map((prop, index) => {
                    const isCurrent = prop.id === currentProposalId;
                    const prevProp = proposals[index + 1]; // The older version

                    // Simple Diff computation if there is an older version
                    let valueDiff = 0;
                    if (prevProp) {
                        valueDiff = (prop.total || 0) - (prevProp.total || 0);
                    }

                    return (
                        <div key={prop.id} className="relative flex items-start gap-4 group">
                            {/* Timeline Node */}
                            <div className="hidden md:flex flex-col items-center pt-2 shrink-0">
                                <div className={`h-3 w-3 rounded-full border-2 bg-background flex items-center justify-center relative z-10
                                    ${isCurrent ? 'border-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]' : 'border-border'}`}
                                >
                                    {isCurrent && <div className="h-1 w-1 bg-teal-500 rounded-full" />}
                                </div>
                            </div>

                            {/* Content */}
                            <div className={`flex-1 rounded-2xl border p-3.5 transition-all
                                ${isCurrent ? 'bg-teal-50/50 border-teal-200' : 'bg-card border-border hover:border-teal-300'}`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 leading-none mb-1">
                                                <h4 className="text-[13px] font-bold">
                                                    Versão {prop.version || 1}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="bg-teal-100 text-teal-700 text-[8px] font-black px-1.5 py-0 rounded-full uppercase tracking-widest">
                                                        Atual
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-60">
                                                {new Date(prop.createdAt).toLocaleString('pt-BR')} • #{prop.number || 'Draft'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[13px] font-black leading-tight tracking-tighter">{formatCurrency(prop.total || 0)}</p>
                                        {prevProp && valueDiff !== 0 && (
                                            <p className={`text-xs font-bold ${valueDiff > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {valueDiff > 0 ? '+' : ''}{formatCurrency(valueDiff)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions for historical versions */}
                                {!isCurrent && (
                                    <div className="mt-2.5 pt-2.5 border-t border-border/50 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Create duplicate by opening editor with proposal param
                                                // Currently editor only takes dealId. We can pass proposalId as query param
                                                router.push(`/pipeline/proposals/editor/${dealId}?sourceProposalId=${prop.id}`);
                                            }}
                                            className="h-7 px-2 text-xs uppercase font-black tracking-widest text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-teal-100"
                                        >
                                            <Copy className="h-3 w-3 mr-1.5" />
                                            Restaurar Versão
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
