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
import { statToneClasses } from '@/design-system/stat-tones';
import { FilterBar } from '@/components/layout/FilterBar';
import { DirectoryResults } from '@/components/layout/DirectoryResults';
import { Button } from '@/components/ui/button';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
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
    { id: 'qualification', title: 'Qualificação', accent: 'bg-stage-qualification', surface: 'bg-stage-qualification/5 border-stage-qualification/20', probability: 30 },
    { id: 'proposal', title: 'Proposta', accent: 'bg-stage-proposal', surface: 'bg-stage-proposal/5 border-stage-proposal/20', probability: 50 },
    { id: 'negotiation', title: 'Negociação', accent: 'bg-stage-negotiation', surface: 'bg-stage-negotiation/5 border-stage-negotiation/20', probability: 75 },
    { id: 'won', title: 'Ganho', accent: 'bg-stage-won', surface: 'bg-stage-won/5 border-stage-won/20', probability: 100 },
    { id: 'lost', title: 'Perdido', accent: 'bg-stage-lost', surface: 'bg-stage-lost/5 border-stage-lost/20', probability: 0 }
];

export const PipelineClientPage = ({ initialDeals, userProfile, distributors, allAccounts }: PipelineClientPageProps) => {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [isBrowser, setIsBrowser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('Todos');
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]); // Array of 'YYYY-QX' e.g. ['2026-Q4', '2027-Q1']
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [showNewDealModal, setShowNewDealModal] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('cards');

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

    const stats = [
        {
            label: "Total Pipeline",
            value: formatCompact(metrics.totalValue),
            description: "Valor bruto total",
            icon: TrendingUp,
            tone: 'primary',
        },
        {
            label: "Ponderado",
            value: formatCompact(metrics.weightedValue),
            description: "Valor real estimado",
            icon: Sparkles,
            tone: 'success',
        },
        {
            label: "Comissão Garantida",
            value: formatCompact(metrics.guaranteed),
            description: "Negócios ganhos",
            icon: DollarSign,
            tone: 'warning',
        },
        {
            label: "Comissão Projetada",
            value: formatCompact(metrics.projected),
            description: "Baseada em probabilidade",
            icon: TrendingUp,
            tone: 'info',
        }
    ] as const;

    return (
        <div className="min-h-full flex flex-col relative space-y-6 pb-20">
            {/* Header */}
            <PageHeader
                title="Funil de Vendas" 
                description="Gestão de Pipeline estratégico e acompanhamento de metas."
            >
                <Button type="button" onClick={() => setShowNewDealModal(true)}>
                    <Plus aria-hidden="true" /> Nova Oportunidade
                </Button>
            </PageHeader>

            <section
                aria-label="Resumo do pipeline"
                data-qa-region="pipeline-summary"
                className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card shadow-[var(--shadow-card)] lg:grid-cols-4"
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.label}
                            className={`flex min-w-0 items-center gap-3 px-4 py-3 ${index > 0 ? 'border-l border-border' : ''} ${index === 2 ? 'border-t lg:border-t-0' : ''} ${index === 3 ? 'border-l-0 border-t lg:border-l lg:border-t-0' : ''}`}
                        >
                            <div className={`hidden sm:grid size-8 shrink-0 place-items-center rounded-[var(--radius-control)] ${statToneClasses[stat.tone]}`}>
                                <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="[overflow-wrap:anywhere] ds-type-label font-medium text-muted-foreground">{stat.label}</p>
                                <p className="mt-0.5 [overflow-wrap:anywhere] ds-type-section-title font-semibold tracking-tight text-foreground">{stat.value}</p>
                                <p className="[overflow-wrap:anywhere] ds-type-label text-muted-foreground">{stat.description}</p>
                            </div>
                        </div>
                    );
                })}
            </section>
            
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por oportunidade ou empresa..."
                        aria-label="Buscar oportunidades"
                        className="pl-11 w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Advanced Multi-Year Pill Selector */}
                <div className="flex flex-col sm:flex-row gap-2 bg-surface-subtle p-1 rounded-[var(--radius-panel)] border border-border w-full sm:w-auto h-auto sm:h-[var(--ds-control-height-default)] items-center">
                    {/* View Year Selector */}
                    <div className="flex items-center gap-1 px-3 border-r border-border shrink-0 h-full">
                        <CalendarDays className="h-4 w-4 text-primary opacity-50" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            aria-label="Selecionar ano"
                            className="min-h-9 cursor-pointer appearance-none bg-transparent py-1 pl-1 pr-4 ds-type-label font-semibold text-foreground outline-none"
                        >
                            {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <svg className="h-3 w-3 text-muted-foreground -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center px-1">
                        <button
                            type="button"
                            aria-pressed={selectedQuarters.length === 0}
                            onClick={() => setSelectedQuarters([])}
                            className={`focus-ring min-h-9 whitespace-nowrap rounded-[var(--radius-control)] px-3 py-1 ds-type-label font-semibold transition-colors ${selectedQuarters.length === 0 ? 'bg-primary text-primary-foreground shadow-control-ui' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                                    type="button"
                                    aria-pressed={isSelected}
                                    aria-label={`Filtrar por ${tab.label}`}
                                    onClick={() => {
                                        setSelectedQuarters(prev =>
                                            prev.includes(val)
                                                ? prev.filter(q => q !== val)
                                                : [...prev, val].sort()
                                        );
                                    }}
                                    className={`focus-ring relative min-h-9 whitespace-nowrap rounded-[var(--radius-control)] px-3 py-1 ds-type-label font-semibold transition-colors ${isSelected
                                        ? 'bg-primary text-primary-foreground shadow-control-ui'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <ViewToggle view={viewMode} onViewChange={setViewMode} gridLabel="Visualização em quadro" />
            </FilterBar>

            <DirectoryResults
                shown={filteredDeals.length}
                total={deals.length}
                hasFilters={searchTerm !== '' || selectedQuarters.length > 0}
                onReset={() => { setSearchTerm(''); setSelectedQuarters([]); }}
                resetLabel="Limpar filtros de oportunidades"
            />

            {viewMode === 'list' ? (
                <section aria-label="Lista de oportunidades" tabIndex={0} data-qa-region="pipeline-table" className="min-w-0 max-w-full overflow-x-auto focus-ring rounded-[var(--radius-panel)] border border-border bg-card shadow-[var(--shadow-card)]">
                    <table aria-label="Oportunidades" className="min-w-[var(--ds-directory-table-min-width)] w-full text-left ds-type-table">
                        <thead className="border-b border-border bg-muted/40 ds-type-label font-semibold text-muted-foreground">
                            <tr><th scope="col" className="px-4 py-3">Oportunidade</th><th scope="col" className="px-4 py-3">Empresa</th><th scope="col" className="px-4 py-3">Etapa</th><th scope="col" className="px-4 py-3">Probabilidade</th><th scope="col" className="px-4 py-3 text-right">Valor</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredDeals.map((deal) => {
                                const stage = DEFAULT_STAGES.find((item) => item.id === deal.stage);
                                return <tr key={deal.id} className="ds-type-body hover:bg-muted/40">
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        <button type="button" aria-label={`Abrir oportunidade ${deal.title}`} onClick={() => setViewingDeal(deal)} className="focus-ring rounded-[var(--radius-control)] text-left font-medium underline underline-offset-4">{deal.title}</button>
                                    </td><td className="px-4 py-3 text-muted-foreground">{deal.company || '—'}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-2 text-muted-foreground"><span className={`size-2 rounded-full ${stage?.accent || 'bg-muted-foreground'}`} />{stage?.title || 'Qualificação'}</span></td><td className="px-4 py-3 text-muted-foreground">{deal.probability || 0}%</td><td className="px-4 py-3 text-right font-medium text-foreground">{formatCompact(Number(deal.value || 0))}</td>
                                </tr>;
                            })}
                            {filteredDeals.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center ds-type-body text-muted-foreground">Nenhuma oportunidade corresponde aos filtros atuais.</td></tr>}
                        </tbody>
                    </table>
                </section>
            ) : (
            <DragDropContext onDragEnd={onDragEnd}>
                <div role="region" aria-label="Quadro de oportunidades" tabIndex={0} className="min-w-0 flex-1 overflow-visible pb-4 focus-ring sm:overflow-x-auto">
                    <div className="flex min-h-[var(--ds-kanban-board-min-height)] flex-col gap-[var(--ds-stat-gap)] sm:flex-row">
                        {DEFAULT_STAGES.map(stage => {
                            const stageDeals = columns[stage.id] || [];
                            const totalStageValue = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

                            return (
                                <section key={stage.id} data-qa-stage={stage.id} aria-label={`${stage.title}: ${stageDeals.length} oportunidades`} className="flex w-full shrink-0 flex-col sm:w-[var(--ds-kanban-column-width)]">
                                    <header className="mb-2 flex items-center justify-between rounded-[var(--radius-panel)] border border-border bg-card p-3 shadow-[var(--shadow-card)]">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span aria-hidden="true" data-qa-stage-dot="" className={`size-2 rounded-full ${stage.accent}`} />
                                                <h3 className="ds-type-body font-semibold text-foreground">{stage.title}</h3>
                                            </div>
                                            <p className="mt-1 ds-type-label text-muted-foreground">{stageDeals.length} oportunidades</p>
                                        </div>
                                        <span className="ds-type-body font-semibold text-foreground">{formatCompact(totalStageValue)}</span>
                                    </header>

                                    <Droppable droppableId={stage.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`min-h-[var(--ds-kanban-column-min-height)] flex-1 space-y-3 rounded-[var(--radius-panel)] border p-2 transition-colors ${stage.surface} ${snapshot.isDraggingOver ? 'ring-2 ring-primary/30' : ''}`}
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
                                </section>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>
            )}

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
