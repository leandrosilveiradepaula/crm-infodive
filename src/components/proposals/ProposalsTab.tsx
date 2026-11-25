import React, { useEffect, useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
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
        <div className="flex min-w-0 flex-col h-full w-full gap-4 p-3 sm:p-5">
            {/* Header / Actions */}
            <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                    <h2 className="text-section-title font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Propostas
                    </h2>
                    <p className="text-body-ui text-muted-foreground mt-1">Gerencie e acompanhe o status das propostas.</p>
                </div>
                <Button
                    onClick={onGenerate}
                    type="button"
                >
                    <Plus className="h-4 w-4" /> Nova Proposta
                </Button>
            </div>

            {/* Dashboard / Status Filters */}
            {proposals.length > 0 && (
                <div role="group" aria-label="Filtrar propostas por status" className="flex flex-wrap gap-2">
                    {statusConfig.map(status => (
                        <Button
                            key={status.id || 'all'}
                            type="button"
                            size="sm"
                            variant={statusFilter === status.id ? 'default' : 'outline'}
                            aria-pressed={statusFilter === status.id}
                            onClick={() => setStatusFilter(status.id)}
                        >
                            <status.icon aria-hidden="true" />
                            {status.label}
                            {status.id !== null && status.count > 0 && <span>({status.count})</span>}
                        </Button>
                    ))}
                </div>
            )}

            {/* Search */}
            {proposals.length > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="Buscar propostas da oportunidade"
                        placeholder="Buscar por título ou número..."
                        className="pl-10 bg-background border-border rounded-[var(--radius-control)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 w-full bg-muted rounded-[var(--radius-panel)] animate-pulse" />)}
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <PremiumEmptyState
                        icon={FileText}
                        title="Nenhuma proposta encontrada"
                        description={proposals.length === 0 ? 'Use Nova Proposta para começar.' : 'Ajuste a busca ou os filtros de status para ver outras propostas.'}
                        variant="compact"
                    />
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
