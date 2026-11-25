'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { DealCard } from '@/components/pipeline/DealCard';
import { updateDealStage } from '@/app/(dashboard)/pipeline/actions';
import { WonDealWizard } from '@/components/pipeline/WonDealWizard';
import { Loader2 } from 'lucide-react';
import { type Deal } from '@/types/deal';

import { formatCurrency } from '@/utils/format';

interface KanbanBoardProps {
    initialDeals: Deal[];
    onDealClick?: (deal: Deal) => void;
}

const COLUMNS = [
    { id: 'qualification', title: 'Qualificação' },
    { id: 'proposal', title: 'Proposta' },
    { id: 'negotiation', title: 'Negociação' },
    { id: 'won', title: 'Ganho' },
    { id: 'lost', title: 'Perdido' }
] as const;

// Static Tailwind classes are required for reliable compiled styles.
// The meanings and actual colors all resolve through the shared stage tokens.
const STAGE_TONE_CLASSES = {
    qualification: { dot: 'bg-stage-qualification', border: 'border-stage-qualification/20', surface: 'bg-stage-qualification/5', hover: 'hover:border-stage-qualification/10', drag: 'bg-stage-qualification/10' },
    proposal: { dot: 'bg-stage-proposal', border: 'border-stage-proposal/20', surface: 'bg-stage-proposal/5', hover: 'hover:border-stage-proposal/10', drag: 'bg-stage-proposal/10' },
    negotiation: { dot: 'bg-stage-negotiation', border: 'border-stage-negotiation/20', surface: 'bg-stage-negotiation/5', hover: 'hover:border-stage-negotiation/10', drag: 'bg-stage-negotiation/10' },
    won: { dot: 'bg-stage-won', border: 'border-stage-won/20', surface: 'bg-stage-won/5', hover: 'hover:border-stage-won/10', drag: 'bg-stage-won/10' },
    lost: { dot: 'bg-stage-lost', border: 'border-stage-lost/20', surface: 'bg-stage-lost/5', hover: 'hover:border-stage-lost/10', drag: 'bg-stage-lost/10' },
} as const;

export function KanbanBoard({ initialDeals, onDealClick }: KanbanBoardProps) {
    const [deals, setDeals] = useState<Deal[]>(initialDeals);
    const [isBrowser, setIsBrowser] = useState(false);
    const [pendingWonDeal, setPendingWonDeal] = useState<Deal | null>(null);

    // Sync deals when initialDeals updates (e.g. after edit/create)
    useEffect(() => {
        setDeals(initialDeals);
    }, [initialDeals]);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setIsBrowser(true));
        return () => {
            cancelAnimationFrame(animation);
            setIsBrowser(false);
        };
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const movedDeal = deals.find(d => d.id === draggableId);
        if (!movedDeal) return;

        // Optimistic UI Update
        const newStage = destination.droppableId;
        const updatedDeals = deals.map(d =>
            d.id === draggableId ? { ...d, stage: newStage } : d
        );
        setDeals(updatedDeals);

        // Server Action
        if (newStage === 'won') {
            setPendingWonDeal(movedDeal);
            // We DON'T sync with server yet, let the Wizard handle it.
            // Reset optimistic update locally for now so it doesn't look won until wizard finishes
            setDeals(deals);
            return;
        }

        await updateDealStage(draggableId, newStage);
    };

    if (!isBrowser) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-x-auto pb-4 gap-6">
            <DragDropContext onDragEnd={onDragEnd}>
                {COLUMNS.map(column => {
                    const columnDeals = deals.filter(d => (d.stage || 'qualification') === column.id);
                    const totalValue = columnDeals.reduce((sum, d) => sum + Number(d.value), 0);
                    const stageStyle = STAGE_TONE_CLASSES[column.id];

                    return (
                        <div key={column.id} data-qa-stage={column.id} className="w-80 flex flex-col shrink-0 group/column">
                            {/* Modern Column Header */}
                            <div className="mb-3 px-1">
                                <div className={`
                                    flex items-center justify-between gap-3 rounded-[var(--radius-panel)] border bg-card p-4 shadow-control-ui ${stageStyle.border}
                                `}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div data-qa-stage-dot="" className={`h-2 w-2 rounded-full ${stageStyle.dot}`} />
                                            <h3 className="font-[var(--ds-type-metric-weight)] ds-type-body text-foreground uppercase tracking-wider">{column.title}</h3>
                                        </div>
                                        <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground mt-1 ml-4 uppercase tracking-widest">{columnDeals.length} Oportunidades</span>
                                    </div>

                                    <div className={`
                                        rounded-[var(--radius-control)] border border-border bg-surface-subtle px-3 py-1.5 shadow-control-ui
                                    `}>
                                        <span className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-foreground">
                                            {formatCurrency(totalValue, { compact: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <div className={`min-h-[150px] flex-1 rounded-[var(--radius-panel)] border border-transparent p-2 transition-colors duration-300 ${stageStyle.surface} ${stageStyle.hover}`}>
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`
                                                flex-1 flex flex-col gap-3 min-h-[100px] transition-all duration-300 rounded-[var(--radius-panel)] p-1
                                                ${snapshot.isDraggingOver ? `${stageStyle.drag} shadow-control-ui` : ''}
                                            `}
                                        >
                                            {columnDeals.map((deal, index) => (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    index={index}
                                                    onClick={() => onDealClick?.(deal)}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    );
                })}
            </DragDropContext>

            {pendingWonDeal && (
                <WonDealWizard
                    deal={pendingWonDeal}
                    isOpen={!!pendingWonDeal}
                    onClose={() => setPendingWonDeal(null)}
                    onSuccess={(updatedDeal) => {
                        setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
                        setPendingWonDeal(null);
                    }}
                />
            )}
        </div>
    );
}
