import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchProposals } from '@/app/(dashboard)/pipeline/actions';
import { ProposalRow } from './ProposalRow';
import type { Proposal } from '@/types/proposal';
import { PROPOSAL_STATUS } from '@/lib/constants';
import { ShieldCheck, Send, User, Ban } from 'lucide-react';


interface ProposalsTabProps {
    dealId: string;
    onGenerate: () => void;
    onView: (proposal: Proposal) => void;
}

export function ProposalsTab({ dealId, onGenerate, onView }: ProposalsTabProps) {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        loadProposals();
    }, [dealId]);

    const loadProposals = async () => {
        try {
            setIsLoading(true);
            const data = await fetchProposals(dealId);
            setProposals(data as unknown as Proposal[]);
        } catch (error) {
            console.error('Error loading proposals:', error);
        } finally {
            setIsLoading(false);
        }
    };


    // Calculate status counts
    const statusCounts = proposals.reduce((acc, p) => {
        acc[p.status as string] = (acc[p.status as string] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Filter logic
    const filteredProposals = proposals.filter(p => {
        const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || p.number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? p.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const statusConfig = [
        { id: null, label: 'Todas', icon: FileText, color: 'text-foreground', bg: 'bg-muted/30 hover:bg-muted font-bold' },
        { id: PROPOSAL_STATUS.DRAFT, label: 'Rascunhos', icon: FileText, count: statusCounts[PROPOSAL_STATUS.DRAFT] || 0, color: 'text-muted-foreground', bg: 'bg-muted/50 hover:bg-muted border-border font-bold' },
        { id: PROPOSAL_STATUS.SENT, label: 'Enviadas', icon: Send, count: statusCounts[PROPOSAL_STATUS.SENT] || 0, color: 'text-primary', bg: 'bg-primary/10 hover:bg-primary/20 border-primary/20 font-bold' },
        { id: PROPOSAL_STATUS.VIEWED, label: 'Visualizadas', icon: User, count: statusCounts[PROPOSAL_STATUS.VIEWED] || 0, color: 'text-stage-proposal', bg: 'bg-stage-proposal/10 hover:bg-stage-proposal/20 border-stage-proposal/20 font-bold' },
        { id: PROPOSAL_STATUS.SIGNED, label: 'Assinadas', icon: ShieldCheck, count: statusCounts[PROPOSAL_STATUS.SIGNED] || 0, color: 'text-success', bg: 'bg-success/10 hover:bg-success/20 border-success/20 font-bold' },
    ];

    return (
        <div className="flex flex-col h-full w-full px-8 pt-4 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        Propostas
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Gerencie e acompanhe o status das propostas.</p>
                </div>
                <Button
                    onClick={onGenerate}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 h-10 flex items-center gap-2 rounded-xl shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="h-4 w-4" /> Nova Proposta
                </Button>
            </div>

            {/* Dashboard / Status Filters */}
            {proposals.length > 0 && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                    {statusConfig.map(status => (
                        <button
                            key={status.id || 'all'}
                            onClick={() => setStatusFilter(status.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${statusFilter === status.id
                                ? 'ring-2 ring-primary/50 border-primary shadow-md ' + status.bg
                                : 'border-border shadow-sm ' + status.bg
                                }`}
                        >
                            <status.icon className={`w-4 h-4 ${status.color}`} />
                            <span className={`text-sm font-semibold ${statusFilter === status.id ? status.color : 'text-muted-foreground'}`}>
                                {status.label}
                            </span>
                            {status.id !== null && status.count > 0 && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusFilter === status.id ? 'bg-white/80' : 'bg-background'} ${status.color}`}>
                                    {status.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            {proposals.length > 0 && (
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título ou número..."
                        className="pl-10 bg-background border-border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted rounded-xl animate-pulse" />)}
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl bg-muted/30 space-y-4">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-foreground font-medium">Nenhuma proposta encontrada</p>
                            <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Proposta" para começar.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {filteredProposals.map((proposal) => (
                            <ProposalRow
                                key={proposal.id}
                                proposal={proposal}
                                onView={onView}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
