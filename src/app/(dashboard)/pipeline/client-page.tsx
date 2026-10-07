'use client';

import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Filter, MoreHorizontal, TrendingUp, Loader2, X, AlertCircle, Trash2, CalendarDays } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DealCard } from '@/components/pipeline/DealCard';
import { CommissionWidget } from '@/components/pipeline/CommissionWidget';
import { calculateDealCommission } from '@/utils/commissionCalculator';
import { updateDealStage, createDeal } from './actions';
import { toast } from 'sonner';
import { ViewDealModal } from '@/components/pipeline/ViewDealModal';
import { DealFormModal } from '@/components/pipeline/DealFormModal';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeals } from '@/hooks/useDeals';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { DollarSign, Sparkles } from 'lucide-react';
import { Deal } from '@/types/deal';
import { Profile } from '@/types/profile';
import { Account } from '@/types/account';

interface PipelineClientPageProps {
    initialDeals: Deal[];
    userProfile: Profile | null;
    distributors: Account[];
    allAccounts: Account[];
}

const DEFAULT_STAGES = [
    { id: 'qualification', title: 'Qualificação', color: 'border-info', bg: 'bg-info/5', probability: 30 },
    { id: 'proposal', title: 'Proposta', color: 'border-teal-500', bg: 'bg-teal-500/5', probability: 50 },
    { id: 'negotiation', title: 'Negociação', color: 'border-warning', bg: 'bg-warning/5', probability: 75 },
    { id: 'won', title: 'Ganho', color: 'border-success', bg: 'bg-success/5', probability: 100 },
    { id: 'lost', title: 'Perdido', color: 'border-destructive', bg: 'bg-destructive/5', probability: 0 }
];

export const PipelineClientPage = ({ initialDeals, userProfile, distributors, allAccounts }: PipelineClientPageProps) => {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [isBrowser, setIsBrowser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('Todos');
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]); // Array of 'YYYY-QX' e.g. ['2026-Q4', '2027-Q1']
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showNewDealModal, setShowNewDealModal] = useState(false);

    // View Modal State
    const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);

    const router = useRouter();
    const { duplicateDeal } = useDeals();

    const searchParams = useSearchParams();

    useEffect(() => {
        setIsBrowser(true);
        // Auto-open deal modal from URL
        const dealIdFromUrl = searchParams.get('dealId');
        if (dealIdFromUrl && initialDeals.length > 0) {
            const foundDeal = initialDeals.find(d => d.id === dealIdFromUrl);
            if (foundDeal && !viewingDeal) {
                setViewingDeal(foundDeal);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, initialDeals]);

    // Sync deals state when server props change (e.g. after router.refresh())
    useEffect(() => {
        setDeals(initialDeals);
    }, [initialDeals]);

    // Synchronize viewingDeal with latest data from the deals list
    useEffect(() => {
        if (viewingDeal) {
            const updatedDeal = deals.find(d => d.id === viewingDeal.id);
            if (updatedDeal) {
                // Only update if it's actually different (to avoid loops)
                if (JSON.stringify(updatedDeal.deal_products) !== JSON.stringify(viewingDeal.deal_products) ||
                    updatedDeal.value !== viewingDeal.value ||
                    updatedDeal.stage !== viewingDeal.stage) {
                    setViewingDeal(updatedDeal);
                }
            }
        }
    }, [deals, viewingDeal?.id]);

    // Filter Logic
    const filteredDeals = useMemo(() => {
        return deals.filter(d => {
            const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.company || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesOwner = ownerFilter === 'Todos' || d.owner === ownerFilter; // Simplified

            let matchesQuarter = true;
            if (selectedQuarters.length > 0) {
                if (!d.expected_close_date) {
                    matchesQuarter = false; // Hide if filtering by specific Qs but no date exists
                } else {
                    const date = new Date(d.expected_close_date);
                    const year = date.getUTCFullYear();
                    const month = date.getUTCMonth(); // 0-11
                    const quarter = Math.floor(month / 3) + 1; // 1-4

                    matchesQuarter = selectedQuarters.includes(`${year}-Q${quarter}`);
                }
            }

            return matchesSearch && matchesOwner && matchesQuarter;
        });
    }, [deals, searchTerm, ownerFilter, selectedQuarters]);

    // Group by Stage
    const columns = useMemo(() => {
        const cols: Record<string, Deal[]> = {};
        DEFAULT_STAGES.forEach(s => cols[s.id] = []);

        filteredDeals.forEach(deal => {
            const stage = deal.stage || 'qualification';
            if (cols[stage]) {
                cols[stage].push(deal);
            } else {
                // Fallback for unknown stages
                if (!cols['qualification']) cols['qualification'] = [];
                cols['qualification'].push(deal);
            }
        });
        return cols;
    }, [filteredDeals]);

    // Metrics Logic (Now computes based ONLY on filtered deals so the Top Cards match the Quarter)
    const metrics = useMemo(() => {
        let totalValue = 0;
        let weightedValue = 0;
        let count = 0;

        filteredDeals.forEach(d => {
            if (d.stage !== 'won' && d.stage !== 'lost') {
                totalValue += Number(d.value || 0);
                weightedValue += (Number(d.value || 0) * (d.probability || 0) / 100);
                count++;
            }
        });

        // Commission Logic
        const commissionCalc = filteredDeals.reduce((acc, deal) => {
            const isActive = deal.stage !== 'won' && deal.stage !== 'lost';
            const isWon = deal.stage === 'won';

            const { commission } = calculateDealCommission(
                deal,
                userProfile?.commission_rules,
                0
            );

            if (isActive) {
                acc.projected += commission * ((deal.probability || 0) / 100);
            } else if (isWon) {
                acc.guaranteed += commission;
            }
            return acc;
        }, { projected: 0, guaranteed: 0 });

        return { totalValue, weightedValue, count, ...commissionCalc };
    }, [filteredDeals, userProfile]);


    // Drag End Handler
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const dealId = draggableId;
        const newStage = destination.droppableId;
        const targetStageConfig = DEFAULT_STAGES.find(s => s.id === newStage);
        const newProbability = targetStageConfig ? targetStageConfig.probability : undefined;

        // Optimistic Update
        const updatedDeals = deals.map(d =>
            d.id === dealId ? { ...d, stage: newStage, probability: newProbability ?? d.probability } : d
        );
        setDeals(updatedDeals);

        try {
            await updateDealStage(dealId, newStage, newProbability);
            toast.success('Oportunidade atualizada!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar oportunidade.');
            setDeals(initialDeals); // Revert on error
        }
    };

    const handleDuplicate = async (dealId: string) => {
        toast.loading('Duplicando oportunidade...', { id: 'duplicating' });
        try {
            const newDeal = await duplicateDeal(dealId);
            if (newDeal) {
                toast.success('Oportunidade duplicada com sucesso!', { id: 'duplicating' });
                // Note: fetchDeals inside useDeals happens too late sometimes to trigger the initialDeals update automatically
                // we trigger router refresh to re-fetch Server Components instead
                router.refresh();
            } else {
                toast.error('Ocorreu um erro ao duplicar a oportunidade', { id: 'duplicating' });
            }
        } catch (error) {
            toast.error('Ocorreu um erro ao duplicar a oportunidade', { id: 'duplicating' });
        }
    };

    const formatCompact = (val: number) => new Intl.NumberFormat('pt-BR', { notation: "compact", style: 'currency', currency: 'BRL' }).format(val);

    if (!isBrowser) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    const stats: StatItem[] = [
        {
            label: "Total Pipeline",
            value: formatCompact(metrics.totalValue),
            description: "Valor bruto total",
            icon: TrendingUp,
            color: "text-primary",
            gradient: "from-primary/5 to-white dark:from-primary/10",
            border: "border-primary/10"
        },
        {
            label: "Ponderado",
            value: formatCompact(metrics.weightedValue),
            description: "Valor real estimado",
            icon: Sparkles,
            color: "text-emerald-600 dark:text-emerald-400",
            gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/50"
        },
        {
            label: "Comissão Garantida",
            value: formatCompact(metrics.guaranteed),
            description: "Negócios ganhos",
            icon: DollarSign,
            color: "text-amber-600 dark:text-amber-400",
            gradient: "from-amber-50 to-white dark:from-amber-950/20",
            border: "border-amber-100 dark:border-amber-900/50"
        },
        {
            label: "Comissão Projetada",
            value: formatCompact(metrics.projected),
            description: "Baseada em probabilidade",
            icon: TrendingUp,
            color: "text-teal-600 dark:text-teal-400",
            gradient: "from-teal-50 to-white dark:from-teal-950/20",
            border: "border-teal-100 dark:border-teal-900/50"
        }
    ];

    return (
        <div className="min-h-full flex flex-col relative space-y-6 pb-20">
            {/* Header */}
            <PageHeader 
                title="Funil de Vendas" 
                description="Gestão de Pipeline estratégico e acompanhamento de metas."
            >
                <button
                    onClick={() => setShowNewDealModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold h-[38px] px-5 rounded-xl flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" /> Nova Oportunidade
                </button>
            </PageHeader>

            <StatsGrid items={stats} />
            
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar deals por nome ou empresa..."
                        aria-label="Buscar oportunidades"
                        className="pl-11 w-full h-[38px] bg-muted/30 border-border focus:bg-background transition-all rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Advanced Multi-Year Pill Selector */}
                <div className="flex flex-col sm:flex-row gap-2 bg-muted/20 p-1 rounded-xl border border-border w-full sm:w-auto h-auto sm:h-[38px] items-center">
                    {/* View Year Selector */}
                    <div className="flex items-center gap-1 px-3 border-r border-border shrink-0 h-full">
                        <CalendarDays className="h-4 w-4 text-primary opacity-50" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            aria-label="Selecionar ano"
                            className="bg-transparent text-xs font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none py-1 pl-1 pr-4 min-h-[36px]"
                        >
                            {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <svg className="h-3 w-3 text-muted-foreground -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>

                    <div className="flex gap-1 items-center px-1">
                        <button
                            onClick={() => setSelectedQuarters([])}
                            className={`px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${selectedQuarters.length === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                            Tempo Todo
                        </button>
                        {[
                            { id: 'Q1', label: 'Q1' },
                            { id: 'Q2', label: 'Q2' },
                            { id: 'Q3', label: 'Q3' },
                            { id: 'Q4', label: 'Q4' },
                        ].map((tab) => {
                            const val = `${selectedYear}-${tab.id}`;
                            const isSelected = selectedQuarters.includes(val);
                            return (
                                <button
                                    key={tab.id}
                                    aria-label={`Filtrar por ${tab.label}`}
                                    onClick={() => {
                                        setSelectedQuarters(prev =>
                                            prev.includes(val)
                                                ? prev.filter(q => q !== val)
                                                : [...prev, val].sort()
                                        );
                                    }}
                                    className={`relative px-4 py-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${isSelected
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </FilterBar>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex space-x-4 h-full min-w-max">
                        {DEFAULT_STAGES.map(stage => {
                            const stageDeals = columns[stage.id] || [];
                            const totalStageValue = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

                            return (
                                <div key={stage.id} className="w-72 flex flex-col h-full">
                                    <div className={`p-4 rounded-t-2xl border-b-2 ${stage.color} bg-card flex justify-between items-center shadow-sm mb-2`}>
                                        <div>
                                            <h3 className="font-black text-foreground text-xs uppercase tracking-widest">{stage.title}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs bg-muted px-1.5 rounded text-muted-foreground">{stageDeals.length}</span>
                                                <span className="text-xs text-primary font-bold">{formatCompact(totalStageValue)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Droppable droppableId={stage.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 rounded-2xl px-2 py-2 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-accent/50' : ''}`}
                                                style={{ minHeight: '200px' }}
                                            >
                                                {stageDeals.map((deal, index) => (
                                                    <DealCard
                                                        key={deal.id}
                                                        deal={deal}
                                                        index={index}
                                                        onClick={() => setViewingDeal(deal)}
                                                        onDuplicate={handleDuplicate}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            {/* New Deal Modal */}
            <DealFormModal
                open={showNewDealModal}
                onOpenChange={setShowNewDealModal}
            />

            {viewingDeal && (
                <ViewDealModal
                    isOpen={!!viewingDeal}
                    onClose={() => {
                        setViewingDeal(null);
                        if (searchParams.has('dealId')) {
                            router.replace('/pipeline', { scroll: false });
                        }
                    }}
                    deal={viewingDeal}
                    distributors={distributors}
                    allAccounts={allAccounts}
                    initialTab={searchParams.get('tab') || 'overview'}
                />
            )}
        </div>
    );
};
