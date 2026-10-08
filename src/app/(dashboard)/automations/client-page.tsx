'use client';

import { useRef, useState } from 'react';
import {
    Zap,
    Plus,
    Activity,
    Clock,
    Settings,
    MoreHorizontal,
    Mail,
    Bell,
    RefreshCw,
    UserPlus,
    CheckCircle2,
    History,
    ArrowUpRight,
    Search,
    Trash2,
    Copy,
    Edit,
    AlertCircle,
    X
} from 'lucide-react';
import { NewAutomationModal } from '@/components/automations/NewAutomationModal';
import { AutomationHistorySheet } from '@/components/automations/HistorySheet';
import { toggleAutomation, createAutomation, deleteAutomation, updateAutomation, getAutomationHistory } from '@/app/(dashboard)/automations/actions';
import { type Automation, type AutomationExecution } from '@/types/automation';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface AutomationsClientPageProps {
    initialAutomations: Automation[];
}

export default function AutomationsClientPage({ initialAutomations }: AutomationsClientPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [initialModalData, setInitialModalData] = useState<Partial<Automation> | undefined>(undefined);
    const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<AutomationExecution[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const historyRequest = useRef(0);
    const pendingAction = useRef(false);
    const [pendingActionId, setPendingActionId] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);


    const recipes = [
        { title: 'Tarefa para Nova Oportunidade', triggerType: 'deal_created', actionType: 'create_task', category: 'followup', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { title: 'Tarefa ao Mover Oportunidade', triggerType: 'deal_moved', actionType: 'create_task', category: 'custom', icon: ArrowUpRight, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    ];

    const handleUseRecipe = (recipe: typeof recipes[0]) => {
        const data: Partial<Automation> = {
            name: recipe.title,
            category: recipe.category as any,
            trigger: { type: recipe.triggerType as any, config: {} },
            actions: [{ type: recipe.actionType as any, config: { title: recipe.title } }]
        };
        setInitialModalData(data);
        setShowNewModal(true);
    };

    const totalExecutions = initialAutomations.reduce((acc: number, curr: Automation) => acc + (curr.executionCount || 0), 0);
    const totalSuccessCount = initialAutomations.reduce((acc: number, curr: Automation) => acc + (curr.successCount || 0), 0);
    const successRate = totalExecutions > 0
        ? ((totalSuccessCount / totalExecutions) * 100).toFixed(1) + '%'
        : '—';
    const activeCount = initialAutomations.filter((automation) => automation.enabled).length;

    const stats: StatItem[] = [
        {
            label: "Execuções registradas",
            value: totalExecutions.toString(),
            description: "Contadores persistidos",
            icon: Zap,
            color: "text-blue-500",
            gradient: "from-blue-50 to-white dark:from-blue-950/20",
            border: "border-blue-100 dark:border-blue-900/50",
        },
        {
            label: "Fluxos ativos",
            value: activeCount.toString(),
            description: "Gatilhos: criação e movimentação",
            icon: Activity,
            color: "text-emerald-500",
            gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/50",
            onClick: () => setFilterType(filterType === 'active' ? null : 'active')
        },
        {
            label: "Taxa de Sucesso",
            value: successRate,
            description: totalExecutions ? "Indicador pelos contadores" : "Sem execuções registradas",
            icon: CheckCircle2,
            color: "text-orange-500",
            gradient: "from-orange-50 to-white dark:from-orange-950/20",
            border: "border-orange-100 dark:border-orange-900/50",
        },
        {
            label: "Fluxos pausados",
            value: (initialAutomations.length - activeCount).toString(),
            description: "Desativadas no momento",
            icon: Clock,
            color: "text-slate-500",
            gradient: "from-slate-50 to-white dark:from-slate-900/20",
            border: "border-slate-200 dark:border-slate-800",
            onClick: () => setFilterType(filterType === 'inactive' ? null : 'inactive')
        }
    ];

    // Filtered automations
    const filteredAutomations = initialAutomations.filter((a: Automation) => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (filterType === 'failed') return matchesSearch && (a.failureCount || 0) > 0;
        if (filterType === 'active') return matchesSearch && a.enabled;
        if (filterType === 'inactive') return matchesSearch && !a.enabled;
        
        return matchesSearch;
    });

    const handleSave = async (automation: Partial<Automation>) => {
        let result: { success: boolean; error?: string };
        try {
            result = automation.id
                ? await updateAutomation(automation.id, automation)
                : await createAutomation(automation);
        } catch {
            toast.error('Falha de conexão ao salvar. Tente novamente.');
            throw new Error('Automation save failed');
        }

        if (!result.success) {
            const message = result.error || 'Não foi possível salvar a automação.';
            toast.error(message);
            throw new Error(message);
        }

        toast.success(automation.id ? 'Automação atualizada com sucesso!' : 'Automação criada com sucesso!');
        setShowNewModal(false);
        setInitialModalData(undefined);
        router.refresh();
    };

    const withPending = async (id: string, operation: () => Promise<void>) => {
        if (pendingAction.current) return;
        pendingAction.current = true;
        setPendingActionId(id);
        try {
            await operation();
        } catch {
            toast.error('Não foi possível concluir a operação. Tente novamente.');
        } finally {
            pendingAction.current = false;
            setPendingActionId(null);
        }
    };

    const handleOpenHistory = async (automation: Automation) => {
        const request = ++historyRequest.current;
        setSelectedAutomation(automation);
        setShowHistory(true);
        setHistory([]);
        setHistoryError(null);
        setHistoryLoading(true);
        try {
            const executions = await getAutomationHistory(automation.id);
            if (historyRequest.current === request) setHistory(executions);
        } catch {
            if (historyRequest.current === request) {
                setHistory([]);
                setHistoryError('A consulta falhou. Nenhum resultado foi confirmado.');
            }
        } finally {
            if (historyRequest.current === request) setHistoryLoading(false);
        }
    };

    const handleToggle = async (id: string, enabled: boolean) => withPending(id, async () => {
        const result = await toggleAutomation(id, enabled);
        if (!result.success) {
            toast.error(result.error || 'Não foi possível alterar a automação.');
            return;
        }
        toast.success(enabled ? 'Automação ativada' : 'Automação pausada');
        router.refresh();
    });

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
        await withPending(id, async () => {
            const result = await deleteAutomation(id);
            if (!result.success) {
                toast.error(result.error || 'Não foi possível excluir a automação.');
                return;
            }
            toast.success('Automação excluída');
            router.refresh();
        });
    };

    const handleDuplicate = async (automation: Automation) => withPending(automation.id, async () => {
        const copy: Partial<Automation> = {
            name: automation.name + ' (Cópia)',
            description: automation.description,
            category: automation.category,
            trigger: automation.trigger,
            conditions: automation.conditions,
            actions: automation.actions,
            enabled: false,
        };
        const result = await createAutomation(copy);
        if (!result.success) {
            toast.error(result.error || 'Não foi possível duplicar a automação.');
            return;
        }
        toast.success('Automação duplicada');
        router.refresh();
    });

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'followup': return <RefreshCw className="h-5 w-5 text-blue-400" />;
            case 'alert': return <Bell className="h-5 w-5 text-orange-400" />;
            case 'welcome': return <UserPlus className="h-5 w-5 text-emerald-400" />;
            default: return <Settings className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-700">
            {/* Top Bar / Header */}
            <PageHeader
                title="Automações"
                description="Otimize sua rotina com gatilhos e ações automáticas."
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setInitialModalData(undefined);
                            setShowNewModal(true);
                        }}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="h-5 w-5" /> Criar Fluxo
                    </button>
                </div>
            </PageHeader>

            {/* Search */}
            <div className="bg-card border border-border rounded-2xl shadow-sm mb-6">
                <div className="p-4">
                    <div className="relative group max-w-2xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <ThemeInput
                            placeholder="Buscar automações por nome ou descrição..."
                            className="pl-10 w-full h-10 bg-background/50 border-border focus:bg-background transition-all rounded-xl font-medium text-sm"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <StatsGrid items={stats} />

            {/* Featured Templates (Receitas) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Receitas Recomendadas</h2>
                    <button 
                        onClick={() => setShowGallery(true)}
                        className="text-xs font-bold text-primary hover:underline transition-all"
                    >
                        Ver todas
                    </button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 no-scrollbar">
                    {recipes.map((recipe, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleUseRecipe(recipe)}
                            className="min-w-[240px] bg-card border border-border p-4 rounded-2xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all text-left flex flex-col justify-between group"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-3 rounded-xl ${recipe.bg}`}>
                                    <recipe.icon className={`h-6 w-6 ${recipe.color}`} />
                                </div>
                                <h4 className="font-black text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">{recipe.title}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                                    Usar Modelo
                                </span>
                                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all group-hover:rotate-90" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Automation Grid Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-muted-foreground">
                        Fluxos de Trabalho 
                        {filterType && (
                            <span className="text-xs font-black bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" /> Filtrado: {filterType}
                                <button type="button" onClick={() => setFilterType(null)} className="hover:text-foreground" aria-label="Remover filtro de automações" title="Remover filtro">×</button>
                            </span>
                        )}
                        <span className="bg-muted text-xs px-3 py-1 rounded-full text-muted-foreground">
                            {filteredAutomations.length}
                        </span>
                    </h2>
                </div>

                {filteredAutomations.length === 0 ? (
                    <div className="py-12">
                        <PremiumEmptyState
                            icon={Zap}
                            title="Nenhuma automação encontrada"
                            description={searchTerm || filterType 
                                ? "Não encontramos fluxos com os filtros aplicados." 
                                : "Você ainda não criou nenhuma automação. Crie seu primeiro fluxo ou comece por uma receita."
                            }
                            actionLabel="Criar Automação"
                            onAction={() => setShowNewModal(true)}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredAutomations.map(automation => (
                            <div
                                key={automation.id}
                                className={`group relative bg-card p-5 rounded-2xl border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 ${automation.enabled
                                    ? 'border-border hover:border-primary/30'
                                    : 'border-border opacity-60 grayscale-[0.8]'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-all duration-500 ${automation.enabled
                                            ? 'bg-primary/10 group-hover:bg-primary/20'
                                            : 'bg-gray-800'
                                            }`}>
                                            {getCategoryIcon(automation.category)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors">{automation.name}</h3>
                                                <span className="text-xs font-black uppercase text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                                                    {automation.enabled ? 'Ativa' : 'Pausada'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{automation.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                                            <input
                                                type="checkbox"
                                                checked={automation.enabled}
                                                disabled={pendingActionId !== null}
                                                onChange={(e) => handleToggle(automation.id, e.target.checked)}
                                                className="sr-only peer"
                                                aria-label={automation.enabled ? 'Pausar automação' : 'Ativar automação'}
                                            />
                                            <div className="w-12 h-6.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                                        </label>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label={`Abrir ações da automação ${automation.name}`} title="Ações da automação">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-white/10 p-2 rounded-2xl shadow-2xl">
                                                <DropdownMenuItem 
                                                    onClick={() => {
                                                        setInitialModalData(automation);
                                                        setShowNewModal(true);
                                                    }}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all font-bold group"
                                                >
                                                    <Edit className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" /> 
                                                    Editar Fluxo
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDuplicate(automation)}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all font-bold group"
                                                >
                                                    <Copy className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" /> 
                                                    Duplicar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDelete(automation.id)}
                                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-red-500/10 text-red-400 transition-all font-bold group"
                                                >
                                                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform text-red-400" /> 
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-muted/30 p-4 rounded-xl border border-border backdrop-blur-sm group-hover:border-border transition-colors">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Gatilho</p>
                                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(45,108,223,0.6)]" />
                                            {automation.trigger?.type || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl border border-border backdrop-blur-sm group-hover:border-border transition-colors">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Ações</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {automation.actions?.map((action: any, idx: number) => (
                                                <span
                                                    key={`${action.type}-${idx}`}
                                                    className="text-xs font-black bg-background border border-border px-3 py-1.5 rounded-lg text-primary group-hover:border-primary/20 transition-all"
                                                >
                                                    {action.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Execuções</span>
                                            <span className="text-sm font-black text-foreground">{automation.executionCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Taxa Sucesso</span>
                                            <span className={`text-sm font-black ${automation.executionCount > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                {automation.executionCount > 0
                                                    ? ((automation.successCount / automation.executionCount) * 100).toFixed(0)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenHistory(automation)}
                                        className="flex items-center gap-2 text-primary font-black text-xs hover:text-foreground transition-colors group/btn"
                                    >
                                        <History className="h-4 w-4" />
                                        Ver Histórico
                                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover/btn:opacity-100 group-hover/btn:translate-y-0 transition-all" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modais e Sheets */}
            {showNewModal && (
                <NewAutomationModal
                    onClose={() => {
                        setShowNewModal(false);
                        setInitialModalData(undefined);
                    }}
                    onSave={handleSave}
                    initialData={initialModalData}
                />
            )}

            {selectedAutomation && (
                <AutomationHistorySheet
                    automation={selectedAutomation}
                    open={showHistory}
                    onOpenChange={(open) => {
                        setShowHistory(open);
                        if (!open) historyRequest.current += 1;
                    }}
                    executions={history}
                    loading={historyLoading}
                    error={historyError}
                />
            )}

            {showGallery && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-10 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                            <div>
                                <h2 className="text-3xl font-black text-foreground tracking-tighter">Biblioteca de Receitas</h2>
                                <p className="text-muted-foreground font-medium mt-1">Escolha um modelo e comece em segundos</p>
                            </div>
                            <button type="button" onClick={() => setShowGallery(false)} className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all" aria-label="Fechar biblioteca de receitas" title="Fechar">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 custom-scrollbar">
                            {recipes.map((recipe, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        handleUseRecipe(recipe);
                                        setShowGallery(false);
                                    }}
                                    className="bg-muted/30 border border-border p-6 rounded-[2rem] hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex flex-col justify-between group"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`p-4 rounded-2xl ${recipe.bg}`}>
                                            <recipe.icon className={`h-6 w-6 ${recipe.color}`} />
                                        </div>
                                        <h4 className="font-black text-lg text-foreground tracking-tight group-hover:text-primary transition-colors">{recipe.title}</h4>
                                    </div>
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-card px-3 py-2 rounded-xl border border-border/50 text-center group-hover:bg-primary group-hover:text-white transition-all">
                                        Explorar Modelo
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Automation tip */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-3xl border border-primary/10 flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h4 className="font-black text-foreground text-sm uppercase tracking-widest">Dica de automação</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                        Comece por uma receita validada e ajuste gatilho e ações antes de ativar o fluxo.
                        <button
                            onClick={() => handleUseRecipe(recipes[0])}
                            className="text-primary font-bold hover:underline ml-1"
                        >
                            Usar modelo de follow-up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
