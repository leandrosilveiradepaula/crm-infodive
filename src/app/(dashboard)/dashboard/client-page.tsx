'use client';

import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, Settings, RotateCcw, GripHorizontal, Layout, CalendarDays, Layout as LayoutIcon } from 'lucide-react';

// Widget Imports
import { StatsWidget } from '@/components/dashboard/StatsWidget';
import { SalesChartWidget } from '@/components/dashboard/SalesChartWidget';
import { RecentDealsWidget } from '@/components/dashboard/RecentDealsWidget';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import { FunnelWidget } from '@/components/dashboard/FunnelWidget';
import { HealthWidget } from '@/components/dashboard/HealthWidget';
import { TasksWidget } from '@/components/dashboard/TasksWidget';
import { ContactSuggestionsWidget } from '@/components/email/ContactSuggestionsWidget';
import { AiActionsWidget } from '@/components/dashboard/AiActionsWidget';
import { PageHeader } from '@/components/layout/PageHeader';

interface DashboardWidget {
    id: string;
    isVisible: boolean;
    colSpan: string;
}

const DEFAULT_LAYOUT: DashboardWidget[] = [
    { id: 'ai_suggestions', isVisible: true, colSpan: 'lg:col-span-3' },
    { id: 'stats', isVisible: true, colSpan: 'lg:col-span-3' },
    { id: 'ai_actions', isVisible: true, colSpan: 'lg:col-span-2' },
    { id: 'chart', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'tasks', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'recent_deals', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'performers', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'funnel', isVisible: true, colSpan: 'lg:col-span-1' },
    { id: 'health', isVisible: true, colSpan: 'lg:col-span-1' }
];

interface DashboardClientPageProps {
    initialMetrics: any;
    initialRecentDeals: any[];
    initialTasks: any[];
    initialDeals: any[];
}

const DEFAULT_METRICS = {
    totalPipeline: 0,
    weightedForecast: 0,
    wonThisMonth: 0,
    winRate: 0,
    avgDealSize: 0,
    stagnantDeals: 0,
    totalDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    healthScore: 0,
    dealsByStage: [],
    dealsByOwner: [],
    monthlyRevenue: []
};

/** Helper: given an array of deals and selectedQuarters (e.g. ['2026-Q1']), filter deals.
 * If selectedQuarters is empty, return all deals. Filters on expected_close_date. */
function filterDealsByQuarter(deals: any[], selectedQuarters: string[]) {
    if (selectedQuarters.length === 0) return deals;
    return deals.filter(d => {
        if (!d.expected_close_date) return false;
        const date = new Date(d.expected_close_date);
        const year = date.getUTCFullYear();
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
        return selectedQuarters.includes(`${year}-Q${quarter}`);
    });
}

/** Compute metrics from a filtered list of deals (client-side). */
function computeMetrics(deals: any[], originalMetrics: any) {
    if (!deals || deals.length === 0) return { ...originalMetrics, totalPipeline: 0, weightedForecast: 0, wonThisMonth: 0, totalDeals: 0, wonDeals: 0, lostDeals: 0, dealsByStage: [], dealsByOwner: [] };

    const active = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
    const won = deals.filter(d => d.stage === 'won');
    const lost = deals.filter(d => d.stage === 'lost');

    const totalPipeline = active.reduce((s, d) => s + Number(d.value || 0), 0);
    const weightedForecast = active.reduce((s, d) => s + Number(d.value || 0) * (Number(d.probability || 0) / 100), 0);
    const wonThisMonth = won.reduce((s, d) => s + Number(d.value || 0), 0);
    const winRate = deals.length > 0 ? Math.round((won.length / deals.length) * 100) : 0;
    const avgDealSize = active.length > 0 ? totalPipeline / active.length : 0;

    const stageMap = new Map<string, { count: number; value: number }>();
    active.forEach(d => {
        const ex = stageMap.get(d.stage) || { count: 0, value: 0 };
        stageMap.set(d.stage, { count: ex.count + 1, value: ex.value + Number(d.value || 0) });
    });
    const dealsByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({ stage, ...data }));

    const ownerMap = new Map<string, { owner: string; count: number; value: number; won: number }>();
    deals.forEach(d => {
        const key = d.owner_id || 'unknown';
        const ex = ownerMap.get(key) || { owner: d.owner || key, count: 0, value: 0, won: 0 };
        ownerMap.set(key, {
            owner: ex.owner,
            count: ex.count + 1,
            value: ex.value + (d.stage === 'won' ? Number(d.value || 0) : 0),
            won: ex.won + (d.stage === 'won' ? 1 : 0)
        });
    });
    const dealsByOwner = Array.from(ownerMap.values());

    return {
        ...originalMetrics,
        totalPipeline,
        weightedForecast,
        wonThisMonth,
        winRate,
        avgDealSize,
        totalDeals: deals.length,
        wonDeals: won.length,
        lostDeals: lost.length,
        dealsByStage,
        dealsByOwner
    };
}

export const DashboardClientPage = ({ initialMetrics, initialRecentDeals, initialTasks, initialDeals }: DashboardClientPageProps) => {
    const metrics = initialMetrics || DEFAULT_METRICS;
    const recentDeals = initialRecentDeals || [];
    const tasks = initialTasks || [];
    const allDeals = initialDeals || [];

    // Layout Config State
    const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_LAYOUT);
    const [showConfig, setShowConfig] = useState(false);

    // Quarter/Year Filter State (same pattern as pipeline)
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Filtered + computed metrics
    const filteredMetrics = useMemo(() => {
        const filtered = filterDealsByQuarter(allDeals, selectedQuarters);
        return computeMetrics(filtered, metrics);
    }, [allDeals, selectedQuarters, metrics]);

    // Handle Drag End
    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const newWidgets = Array.from(widgets);
        const [reorderedItem] = newWidgets.splice(result.source.index, 1);
        newWidgets.splice(result.destination.index, 0, reorderedItem);
        setWidgets(newWidgets);
    };

    const toggleWidget = (id: string) => {
        setWidgets(widgets.map(w => w.id === id ? { ...w, isVisible: !w.isVisible } : w));
    };

    const resetLayout = () => setWidgets(DEFAULT_LAYOUT);

    const renderWidget = (id: string) => {
        switch (id) {
            case 'ai_suggestions': return <ContactSuggestionsWidget />;
            case 'ai_actions': return <AiActionsWidget />;
            case 'stats': return <StatsWidget metrics={filteredMetrics} />;
            case 'chart': return <SalesChartWidget data={filteredMetrics.monthlyRevenue || []} />;
            case 'recent_deals': return <RecentDealsWidget deals={recentDeals} />;
            case 'tasks': return <TasksWidget />;
            case 'performers': return <TopPerformersWidget data={filteredMetrics.dealsByOwner || []} />;
            case 'funnel': return <FunnelWidget data={filteredMetrics.dealsByStage || []} />;
            case 'health': return <HealthWidget metrics={filteredMetrics} />;
            default: return null;
        }
    };

    const getWidgetLabel = (id: string) => {
        const labels: Record<string, string> = {
            ai_suggestions: 'Sugestões de Contatos',
            ai_actions: 'Ações Sugeridas (IA)',
            stats: 'Estatísticas Principais',
            chart: 'Gráfico de Desempenho',
            recent_deals: 'Deals Recentes',
            tasks: 'Minhas Tarefas',
            performers: 'Top Performers',
            funnel: 'Funil de Vendas',
            health: 'Saúde do Pipeline'
        };
        return labels[id] || id;
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header Section */}
            <PageHeader
                title="Visão Geral"
                description="Acompanhe o desempenho das suas vendas."
            >
                <div className="relative flex flex-wrap items-center gap-2">
                    {/* Year + Quarter Pill Selector — same as Pipeline */}
                    <div className="flex max-w-full flex-col items-center gap-2 overflow-x-auto rounded-[var(--radius-control)] border border-border bg-card p-1 sm:h-10 sm:flex-row">
                        {/* Year Selector */}
                        <div className="flex items-center gap-1 px-3 border-r border-border shrink-0 h-full">
                            <CalendarDays className="h-3.5 w-3.5 text-primary opacity-50" />
                            <select
                                aria-label="Selecionar ano do Dashboard"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="min-h-8 cursor-pointer appearance-none bg-transparent py-1 pl-1 pr-4 text-metadata-ui font-medium text-foreground outline-none"
                            >
                                {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <svg className="h-3 w-3 text-muted-foreground -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                        </div>

                        {/* Tempo Todo + Q1–Q4 */}
                        <div className="flex gap-1 items-center px-1">
                            <button
                                onClick={() => setSelectedQuarters([])}
                                className={`focus-ring h-8 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-metadata-ui font-medium transition-colors ${selectedQuarters.length === 0 ? 'bg-primary text-primary-foreground shadow-control-ui' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                                const hasSelectionsInOtherYears = !isSelected && selectedQuarters.some(sq => sq.endsWith(`-${tab.id}`) && !sq.startsWith(`${selectedYear}-`));

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setSelectedQuarters(prev =>
                                                prev.includes(val)
                                                    ? prev.filter(q => q !== val)
                                                    : [...prev, val].sort()
                                            );
                                        }}
                                        className={`focus-ring relative h-8 whitespace-nowrap rounded-[var(--radius-control)] px-3 text-metadata-ui font-medium transition-colors ${isSelected
                                            ? 'bg-primary text-primary-foreground shadow-control-ui'
                                            : hasSelectionsInOtherYears
                                                ? 'bg-secondary text-secondary-foreground hover:bg-accent'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {tab.label}
                                        {hasSelectionsInOtherYears && (
                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mx-1 hidden h-6 w-px bg-border sm:block"></div>

                    {/* Config Button */}
                    <button
                        aria-label="Configurar layout do Dashboard"
                        onClick={() => setShowConfig(!showConfig)}
                        aria-expanded={showConfig}
                        aria-controls="dashboard-layout-options"
                        className={`focus-ring rounded-[var(--radius-control)] p-2 transition-colors ${showConfig ? 'bg-primary text-primary-foreground shadow-control-ui' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        title="Configurar Layout"
                    >
                        <Settings className="h-4 w-4" />
                    </button>

                    {/* Config Popover */}
                    {showConfig && (
                        <div id="dashboard-layout-options" className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[var(--radius-panel)] border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-overlay)]">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-section-title font-semibold text-foreground">
                                    <LayoutIcon className="h-4 w-4 text-primary" /> Personalizar
                                </h3>
                                <button aria-label="Fechar configuração de layout" onClick={() => setShowConfig(false)} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-[var(--radius-control)] transition-colors"><X className="h-4 w-4" /></button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {widgets.map((widget) => (
                                    <label key={widget.id} className="group flex cursor-pointer items-center justify-between rounded-[var(--radius-control)] border border-border p-3 transition-colors hover:bg-muted">
                                        <span className="text-metadata-ui font-medium text-muted-foreground group-hover:text-foreground">{getWidgetLabel(widget.id)}</span>
                                        <div className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={widget.isVisible}
                                                onChange={() => toggleWidget(widget.id)}
                                            />
                                            <div className="w-10 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted-foreground after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white"></div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={resetLayout}
                                className="focus-ring mt-4 flex w-full items-center justify-center gap-2 border-t border-border py-3 text-metadata-ui font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <RotateCcw className="h-3 w-3" /> Restaurar Padrão
                            </button>
                        </div>
                    )}
                </div>
            </PageHeader>

            {/* Draggable Dashboard Grid */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="dashboard-grid">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                        >
                            {widgets.map((widget, index) => (
                                widget.isVisible && (
                                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                data-qa-region={widget.id}
                                                className={`${widget.colSpan} relative group transition-transform ${snapshot.isDragging ? 'z-50 scale-[1.02] shadow-overlay-ui' : ''}`}
                                            >
                                                <>
                                                    <span
                                                        id={`dashboard-drag-instructions-${widget.id}`}
                                                        className="sr-only"
                                                    >
                                                        Pressione espaço para selecionar este widget, use as setas para mover, espaço para soltar ou Escape para cancelar.
                                                    </span>
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        aria-label={`Mover widget ${getWidgetLabel(widget.id)}`}
                                                        aria-describedby={`dashboard-drag-instructions-${widget.id}`}
                                                        className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 rounded-full border border-border bg-card p-1.5 text-foreground shadow-overlay-ui cursor-grab active:cursor-grabbing opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        title="Arrastar Widget"
                                                    >
                                                        <GripHorizontal className="h-4 w-4" aria-hidden="true" />
                                                    </div>
                                                </>
                                                <div className="h-full">
                                                    {renderWidget(widget.id)}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                )
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
