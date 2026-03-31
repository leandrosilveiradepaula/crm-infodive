'use client';

import { useState } from 'react';
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
import { toggleAutomation, createAutomation, deleteAutomation, updateAutomation } from '@/app/(dashboard)/automations/actions';
import { type Automation } from '@/types/automation';
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
    const [filterType, setFilterType] = useState<string | null>(null);
    const [showGallery, setShowGallery] = useState(false);


    const recipes = [
        { title: 'Follow-up 7 Dias', triggerType: 'deal_stagnant', actionType: 'send_email', category: 'followup', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'Alerta Ticket Alto', triggerType: 'deal_created', actionType: 'send_notification', category: 'alert', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { title: 'Boas-vindas Cliente', triggerType: 'deal_moved', actionType: 'send_email', category: 'welcome', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { title: 'Mover Negociação', triggerType: 'proposal_sent', actionType: 'move_deal', category: 'custom', icon: ArrowUpRight, color: 'text-teal-400', bg: 'bg-teal-400/10' },
        { title: 'Tarefa de Retorno', triggerType: 'deal_stagnant', actionType: 'create_task', category: 'followup', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Notificar VIP', triggerType: 'deal_created', actionType: 'send_notification', category: 'alert', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ];

    const parseAIIntent = (prompt: string): Partial<Automation> => {
        const p = prompt.toLowerCase();
        let trigger: any = { type: 'deal_created', config: {} };
        let actions: any[] = [{ type: 'send_notification', config: { title: 'AI Automation', description: prompt } }];
        const name = prompt.charAt(0).toUpperCase() + prompt.slice(1);
        let category: any = 'custom';

        if (p.includes('estagnar') || p.includes('parado') || p.includes('parada') || p.includes('dias')) {
            trigger = { type: 'deal_stagnant', config: { days: 7 } };
            category = 'followup';
        } else if (p.includes('ganhar') || p.includes('ganhou') || p.includes('fechar') || p.includes('venda')) {
            trigger = { type: 'deal_moved', config: { stage: 'won' } };
            category = 'alert';
        } else if (p.includes('novo') || p.includes('criar')) {
            trigger = { type: 'deal_created', config: {} };
            category = 'welcome';
        }

        if (p.includes('email') || p.includes('e-mail')) {
            actions = [{ type: 'send_email', config: { title: name } }];
            category = 'followup';
        } else if (p.includes('tarefa') || p.includes('agenda')) {
            actions = [{ type: 'create_task', config: { title: name } }];
        } else if (p.includes('mover') || p.includes('fase') || p.includes('estágio')) {
            actions = [{ type: 'move_deal', config: {} }];
        }

        return { name, trigger, actions, category };
    };

    const handleAIBuilder = () => {
        if (!searchTerm) {
            setInitialModalData(undefined);
        } else {
            const data = parseAIIntent(searchTerm);
            setInitialModalData(data);
        }
        setShowNewModal(true);
    };

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
        ? ((totalSuccessCount / totalExecutions) * 100).toFixed(1)
        : "0";

    const stats: StatItem[] = [
        {
            label: "Total de Execuções",
            value: totalExecutions.toString(),
            description: "Ações processadas",
            icon: Zap,
            color: "text-blue-500",
            gradient: "from-blue-50 to-white dark:from-blue-950/20",
            border: "border-blue-100 dark:border-blue-900/50",
            onClick: () => setFilterType(filterType === 'active' ? null : 'active')
        },
        {
            label: "Tempo Economizado",
            value: "42h",
            description: "Estimativa mensal",
            icon: Clock,
            color: "text-emerald-500",
            gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/50"
        },
        {
            label: "Taxa de Sucesso",
            value: `${successRate}%`,
            description: "Execuções sem erro",
            icon: CheckCircle2,
            color: "text-orange-500",
            gradient: "from-orange-50 to-white dark:from-orange-950/20",
            border: "border-orange-100 dark:border-orange-900/50",
            onClick: () => setFilterType(filterType === 'failed' ? null : 'failed')
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
        if (automation.id) {
            await updateAutomation(automation.id, automation);
            toast.success('Automação atualizada com sucesso!');
        } else {
            await createAutomation(automation);
            toast.success('Automação criada com sucesso!');
        }
        setShowNewModal(false);
        setInitialModalData(undefined);
        router.refresh();
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        await toggleAutomation(id, enabled);
        toast.success(enabled ? 'Automação ativada' : 'Automação pausada');
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta automação?')) {
            await deleteAutomation(id);
            toast.success('Automação excluída');
            router.refresh();
        }
    };

    const handleDuplicate = async (automation: Automation) => {
        const { id, createdAt, updatedAt, ...rest } = automation;
        const copy = {
            ...rest,
            name: `${automation.name} (Cópia)`,
            enabled: false
        } as any;
        await createAutomation(copy);
        toast.success('Automação duplicada');
        router.refresh();
    };

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
                description="Otimize sua rotina com gatilhos e ações automáticas inteligentes."
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

            {/* AI Builder Quick Input */}
            <div className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent p-1 rounded-2xl border border-primary/10 shadow-2xl">
                <div className="bg-card/40 backdrop-blur-xl p-4 rounded-xl flex flex-col md:flex-row items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 animate-pulse">
                        <Zap className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-1 text-center md:text-left">
                        <h3 className="text-lg font-black text-foreground tracking-tight">O que você deseja automatizar hoje?</h3>
                        <p className="text-sm text-muted-foreground font-medium italic">"Me avise por e-mail quando um negócio for ganho"</p>
                    </div>
                    <div className="w-full md:w-[400px] relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <ThemeInput
                            placeholder="Descreva sua automação e a IA fará o resto..."
                            className="pl-11 pr-24 w-full h-[48px] bg-background/50 border-border focus:bg-background transition-all rounded-xl font-medium"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                        <button
                            onClick={handleAIBuilder}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-[36px] px-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all"
                        >
                            Gerar com IA
                        </button>
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
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
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
                                <button onClick={() => setFilterType(null)} className="hover:text-foreground">×</button>
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
                                : "Você ainda não criou nenhuma automação. Use a IA acima para começar agora!"
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
                                                {!automation.enabled && (
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">Pausado</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{automation.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                                            <input
                                                type="checkbox"
                                                checked={automation.enabled}
                                                onChange={(e) => handleToggle(automation.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-12 h-6.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                                        </label>
                                        
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 text-muted-foreground hover:text-white transition-colors">
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
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Gatilho</p>
                                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(45,108,223,0.6)]" />
                                            {automation.trigger?.type || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl border border-border backdrop-blur-sm group-hover:border-border transition-colors">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Ações</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {automation.actions?.map((action: any, idx: number) => (
                                                <span
                                                    key={`${action.type}-${idx}`}
                                                    className="text-[10px] font-black bg-background border border-border px-3 py-1.5 rounded-lg text-primary group-hover:border-primary/20 transition-all"
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
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Execuções</span>
                                            <span className="text-sm font-black text-foreground">{automation.executionCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Taxa Sucesso</span>
                                            <span className={`text-sm font-black ${automation.executionCount > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                                {automation.executionCount > 0
                                                    ? ((automation.successCount / automation.executionCount) * 100).toFixed(0)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSelectedAutomation(automation);
                                            setShowHistory(true);
                                        }}
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
                    onOpenChange={setShowHistory}
                />
            )}

            {showGallery && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-4xl rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-10 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-tighter">Biblioteca de Receitas</h2>
                                <p className="text-muted-foreground font-medium mt-1">Escolha um modelo e comece em segundos</p>
                            </div>
                            <button onClick={() => setShowGallery(false)} className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all">
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
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-card px-3 py-2 rounded-xl border border-border/50 text-center group-hover:bg-primary group-hover:text-white transition-all">
                                        Explorar Modelo
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer / AI Tip */}
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-3xl border border-primary/10 flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
                    <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h4 className="font-black text-white text-sm uppercase tracking-widest">Dica da Antigravity AI</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                        Você pode criar uma automação para enviar um e-mail personalizado toda vez que um deal atingir os 7 dias de estagnação. 
                        <button 
                            onClick={() => {
                                setSearchTerm("Mandar e-mail ao estagnar por 7 dias");
                                handleAIBuilder();
                            }}
                            className="text-primary font-bold hover:underline ml-1"
                        >
                            Configurar agora
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
