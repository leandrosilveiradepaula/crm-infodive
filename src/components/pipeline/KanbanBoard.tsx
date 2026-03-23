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
    { id: 'qualification', title: 'Qualificação', color: 'stage-qualification' },
    { id: 'proposal', title: 'Proposta', color: 'stage-proposal' },
    { id: 'negotiation', title: 'Negociação', color: 'stage-negotiation' },
    { id: 'won', title: 'Ganho', color: 'stage-won' },
    { id: 'lost', title: 'Perdido', color: 'stage-lost' }
];

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

                    return (
                        <div key={column.id} className="w-80 flex flex-col shrink-0 group/column">
                            {/* Modern Column Header */}
                            <div className="mb-3 px-1">
                                <div className={`
                                    p-4 rounded-2xl border border-${column.color}/20 
                                    bg-gradient-to-br from-white/5 to-white/0 dark:from-white/5 dark:to-transparent
                                    backdrop-blur-sm shadow-sm flex justify-between items-center
                                `}>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full bg-${column.color}`} />
                                            <h3 className="font-black text-sm text-foreground uppercase tracking-wider">{column.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground mt-1 ml-4 uppercase tracking-widest">{columnDeals.length} Oportunidades</span>
                                    </div>

                                    <div className={`
                                        px-3 py-1.5 rounded-lg border border-${column.color}/20
                                        bg-card/50 backdrop-blur-md shadow-sm
                                    `}>
                                        <span className="text-xs font-black text-foreground">
                                            {formatCurrency(totalValue, { compact: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <div className={`flex-1 rounded-2xl bg-${column.color}/5 p-2 min-h-[150px] border border-transparent transition-colors duration-300 hover:border-${column.color}/10`}>
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`
                                                flex-1 flex flex-col gap-3 min-h-[100px] transition-all duration-300 rounded-xl p-1
                                                ${snapshot.isDraggingOver ? `bg-${column.color}/10 shadow-inner` : ''}
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
