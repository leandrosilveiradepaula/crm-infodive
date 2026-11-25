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
import { Button } from '@/components/ui/button';
import { automationSummary, automationTriggerLabel, automationActionLabel, requireConfirmedAutomationMutation } from '@/components/automations/automation-presentation';

interface AutomationsClientPageProps {
    initialAutomations: Automation[];
}

export default function AutomationsClientPage({ initialAutomations }: AutomationsClientPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [builderPrompt, setBuilderPrompt] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);
    const [initialModalData, setInitialModalData] = useState<Partial<Automation> | undefined>(undefined);
    const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(null);


    const recipes = [
        { title: 'Follow-up 7 Dias', triggerType: 'deal_stagnant', actionType: 'send_email', category: 'followup', icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Alerta Ticket Alto', triggerType: 'deal_created', actionType: 'send_notification', category: 'alert', icon: Bell, color: 'text-warning-readable', bg: 'bg-warning-subtle' },
        { title: 'Boas-vindas Cliente', triggerType: 'deal_moved', actionType: 'send_email', category: 'welcome', icon: UserPlus, color: 'text-success-readable', bg: 'bg-success-subtle' },
        { title: 'Mover Negociação', triggerType: 'proposal_sent', actionType: 'move_deal', category: 'custom', icon: ArrowUpRight, color: 'text-muted-foreground', bg: 'bg-info-subtle' },
        { title: 'Tarefa de Retorno', triggerType: 'deal_stagnant', actionType: 'create_task', category: 'followup', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Notificar VIP', triggerType: 'deal_created', actionType: 'send_notification', category: 'alert', icon: Zap, color: 'text-warning-readable', bg: 'bg-warning-subtle' },
    ];

    const parseDraftIntent = (prompt: string): Partial<Automation> => {
        const p = prompt.toLowerCase();
        let trigger: any = { type: 'deal_created', config: {} };
        let actions: any[] = [{ type: 'send_notification', config: { title: 'Novo fluxo', description: prompt } }];
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

    const prepareDraft = (prompt = builderPrompt) => {
        if (!prompt.trim()) {
            setInitialModalData(undefined);
        } else {
            const data = parseDraftIntent(prompt.trim());
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

    const summary = automationSummary(initialAutomations);
    const stats: StatItem[] = [
        {
            label: "Fluxos ativos",
            value: summary.active,
            description: `${summary.inactive} pausado(s)`,
            icon: Activity,
            tone: "primary",
            onClick: () => setFilterType(filterType === 'active' ? null : 'active'),
        },
        {
            label: "Execuções",
            value: summary.executions,
            description: "Execuções registradas",
            icon: Zap,
            tone: "info",
        },
        {
            label: "Taxa de sucesso",
            value: summary.successRate === null ? '—' : `${summary.successRate.toFixed(1)}%`,
            description: summary.successRate === null ? "Sem execuções registradas" : "Execuções sem erro",
            icon: CheckCircle2,
            tone: "neutral",
        },
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
        const result = automation.id
            ? await updateAutomation(automation.id, automation)
            : await createAutomation(automation);
        requireConfirmedAutomationMutation(result);
        toast.success(automation.id ? 'Configuração atualizada' : 'Configuração salva');
        setShowNewModal(false);
        setInitialModalData(undefined);
        router.refresh();
    };

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            requireConfirmedAutomationMutation(await toggleAutomation(id, enabled));
            toast.success(enabled ? 'Fluxo habilitado na configuração' : 'Fluxo pausado');
            router.refresh();
        } catch {
            toast.error('Não foi possível alterar o status do fluxo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta automação?')) return;
        try {
            requireConfirmedAutomationMutation(await deleteAutomation(id));
            toast.success('Automação excluída');
            router.refresh();
        } catch {
            toast.error('Não foi possível excluir a automação.');
        }
    };

    const handleDuplicate = async (automation: Automation) => {
        const { id, createdAt, updatedAt, ...rest } = automation;
        const copy = {
            ...rest,
            name: `${automation.name} (Cópia)`,
            enabled: false
        } as any;
        try {
            requireConfirmedAutomationMutation(await createAutomation(copy));
            toast.success('Automação duplicada');
            router.refresh();
        } catch {
            toast.error('Não foi possível duplicar a automação.');
        }
    };

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'followup': return <RefreshCw className="h-5 w-5 text-primary" />;
            case 'alert': return <Bell className="h-5 w-5 text-warning-readable" />;
            case 'welcome': return <UserPlus className="h-5 w-5 text-success-readable" />;
            default: return <Settings className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Top Bar / Header */}
            <PageHeader
                title="Automações"
                description="Configure fluxos de trabalho e consulte os indicadores registrados."
            >
                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline">
                        <a href="#automation-modelos">Ver modelos</a>
                    </Button>
                    <Button
                        onClick={() => {
                            setInitialModalData(undefined);
                            setShowNewModal(true);
                        }}
                        size="lg"
                    >
                        <Plus /> Criar Fluxo
                    </Button>
                </div>
            </PageHeader>

            <section aria-label="Preparar fluxo" className="rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-control-ui">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-primary text-primary-foreground">
                            <Zap className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-section-title font-semibold text-foreground">Prepare um novo fluxo</h2>
                            <p className="mt-1 text-body-ui text-muted-foreground">Descreva uma tarefa para preencher um modelo inicial. Revise antes de ativar.</p>
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row lg:w-[min(100%,32rem)]">
                        <ThemeInput
                            placeholder="Ex.: enviar e-mail após 7 dias sem movimentação"
                            aria-label="Descrever automação"
                            className="min-w-0 flex-1"
                            value={builderPrompt}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuilderPrompt(e.target.value)}
                        />
                        <Button type="button" onClick={() => prepareDraft()} className="w-full sm:w-auto">
                            Preparar fluxo
                        </Button>
                    </div>
                </div>
            </section>

            <div role="note" className="flex items-start gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-subtle p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-body-ui text-foreground">Os fluxos podem ser configurados aqui. A execução automática e o histórico detalhado ainda não foram validados neste módulo.</p>
            </div>

            {/* Premium Stats Grid */}
            <StatsGrid items={stats} />

            {/* Automation Grid Section */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-section-title font-semibold flex flex-wrap items-center gap-3 text-foreground">
                        Fluxos de trabalho
                        {filterType && (
                            <span className="text-metadata-ui font-black bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-2">
                                <AlertCircle className="h-3 w-3" /> Filtrado: {filterType === 'active' ? 'Ativos' : filterType === 'inactive' ? 'Pausados' : 'Com falhas'}
                                <button type="button" aria-label="Limpar filtro de tipo" onClick={() => setFilterType(null)} className="focus-ring rounded-full px-1 hover:text-foreground">×</button>
                            </span>
                        )}
                        <span className="bg-surface-raised text-metadata-ui px-3 py-1 rounded-full text-foreground">
                            {filteredAutomations.length}
                        </span>
                    </h2>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="relative w-full sm:max-w-[24rem]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <ThemeInput
                            aria-label="Buscar fluxos de trabalho"
                            placeholder="Buscar fluxos"
                            className="pl-9"
                            value={searchTerm}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <div role="group" aria-label="Filtrar fluxos por status" className="flex flex-wrap gap-2">
                        {([{ id: null, label: 'Todos' }, { id: 'active', label: 'Ativos' }, { id: 'inactive', label: 'Pausados' }, { id: 'failed', label: 'Com falhas' }] as const).map(filter => (
                            <Button
                                key={filter.label}
                                type="button"
                                variant={filterType === filter.id ? 'default' : 'outline'}
                                aria-pressed={filterType === filter.id}
                                onClick={() => setFilterType(filter.id)}
                                size="sm"
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {filteredAutomations.length === 0 ? (
                    <div className="py-12">
                        <PremiumEmptyState
                            icon={Zap}
                            title="Nenhuma automação encontrada"
                            description={searchTerm || filterType
                                ? "Não encontramos fluxos com os filtros aplicados."
                                : "Escolha um modelo ou crie um fluxo para começar."}
                            actionLabel={searchTerm || filterType ? "Limpar filtros" : "Criar automação"}
                            onAction={() => {
                                if (searchTerm || filterType) {
                                    setSearchTerm('');
                                    setFilterType(null);
                                } else {
                                    setInitialModalData(undefined);
                                    setShowNewModal(true);
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {filteredAutomations.map(automation => (
                            <div
                                key={automation.id}
                                className={`group relative min-w-0 bg-card p-4 rounded-[var(--radius-panel)] border shadow-card-ui transition-colors ${automation.enabled
                                    ? 'border-border hover:border-primary/30'
                                    : 'border-border border-dashed'
                                    }`}
                            >
                                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div className={`shrink-0 p-3 rounded-[var(--radius-panel)] transition-all duration-500 ${automation.enabled
                                            ? 'bg-primary/10 group-hover:bg-primary/20'
                                            : 'bg-muted'
                                            }`}>
                                            {getCategoryIcon(automation.category)}
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="break-words font-semibold text-section-title text-foreground group-hover:text-primary transition-colors">{automation.name}</h3>
                                                {!automation.enabled && (
                                                    <span className="text-metadata-ui font-medium text-foreground bg-muted px-2.5 py-1 rounded-[var(--radius-panel)]">Pausado</span>
                                                )}
                                            </div>
                                            <p className="text-body-ui text-foreground mt-1 line-clamp-1">{automation.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                                            <input
                                                type="checkbox"
                                                aria-label="Habilitar automação"
                                                checked={automation.enabled}
                                                onChange={(e) => handleToggle(automation.id, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-12 h-6.5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                                        </label>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" aria-label="Opções da automação" className="focus-ring rounded-[var(--radius-control)] p-2 text-muted-foreground hover:text-foreground transition-colors">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 bg-card border-border p-2 rounded-[var(--radius-panel)] shadow-overlay-ui">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setInitialModalData(automation);
                                                        setShowNewModal(true);
                                                    }}
                                                    className="flex items-center gap-3 p-3 rounded-[var(--radius-panel)] cursor-pointer hover:bg-muted transition-all font-bold group"
                                                >
                                                    <Edit className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                                    Editar Fluxo
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDuplicate(automation)}
                                                    className="flex items-center gap-3 p-3 rounded-[var(--radius-panel)] cursor-pointer hover:bg-muted transition-all font-bold group"
                                                >
                                                    <Copy className="h-4 w-4 text-success-readable group-hover:scale-110 transition-transform" />
                                                    Duplicar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(automation.id)}
                                                    className="flex items-center gap-3 p-3 rounded-[var(--radius-panel)] cursor-pointer hover:bg-destructive-subtle text-destructive-readable transition-all font-bold group"
                                                >
                                                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform text-destructive-readable" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
                                    <div className="bg-surface-subtle p-4 rounded-[var(--radius-panel)] border border-border group-hover:border-border transition-colors">
                                        <p className="text-metadata-ui font-medium text-foreground mb-2">Gatilho</p>
                                        <p className="text-body-ui font-bold text-foreground flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                            {automation.trigger ? automationTriggerLabel(automation.trigger.type) : 'Não configurado'}
                                        </p>
                                    </div>
                                    <div className="bg-surface-subtle p-4 rounded-[var(--radius-panel)] border border-border group-hover:border-border transition-colors">
                                        <p className="text-metadata-ui font-medium text-foreground mb-2">Ações</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {automation.actions?.map((action: any, idx: number) => (
                                                <span
                                                    key={`${action.type}-${idx}`}
                                                    className="text-metadata-ui font-medium bg-background border border-border px-3 py-1.5 rounded-[var(--radius-panel)] text-primary group-hover:border-primary/20 transition-all"
                                                >
                                                    {automationActionLabel(action.type)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-metadata-ui font-bold text-foreground uppercase tracking-tighter">Execuções</span>
                                            <span className="text-body-ui font-black text-foreground">{automation.executionCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-metadata-ui font-bold text-foreground uppercase tracking-tighter">Taxa de sucesso</span>
                                            <span className={`text-body-ui font-black ${automation.executionCount > 0 ? 'text-success-readable' : 'text-muted-foreground'}`}>
                                                {automation.executionCount > 0
                                                    ? `${((automation.successCount / automation.executionCount) * 100).toFixed(0)}%`
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedAutomation(automation);
                                            setShowHistory(true);
                                        }}
                                        className="flex items-center gap-2 text-foreground font-black text-metadata-ui underline underline-offset-4 hover:text-primary transition-colors group/btn"
                                    >
                                        <History className="h-4 w-4" />
                                        Ver execuções
                                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-1 group-hover/btn:opacity-100 group-hover/btn:translate-y-0 transition-all" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <section id="automation-modelos" tabIndex={-1} aria-label="Biblioteca de receitas" data-qa-region="automation-recipes" className="space-y-3">
                <div>
                    <h2 className="text-section-title font-semibold text-foreground">Biblioteca de modelos</h2>
                    <p className="mt-1 text-body-ui text-muted-foreground">Escolha um dos {recipes.length} modelos e revise o gatilho e as ações antes de salvar. Os modelos são pontos de partida, sem condições específicas configuradas.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {recipes.map(recipe => (
                        <button
                            key={recipe.title}
                            type="button"
                            aria-label={`Usar modelo ${recipe.title}`}
                            onClick={() => handleUseRecipe(recipe)}
                            className="flex min-w-0 flex-col justify-between gap-3 rounded-[var(--radius-panel)] border border-border bg-card p-4 text-left shadow-control-ui transition-colors hover:border-primary/40 focus-ring"
                        >
                            <div className="flex items-start gap-3">
                                <span className={`grid size-10 shrink-0 place-items-center rounded-[var(--radius-control)] ${recipe.bg}`}>
                                    <recipe.icon className={`size-5 ${recipe.color}`} aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="break-words text-body-ui font-semibold text-foreground">{recipe.title}</h3>
                                    <p className="mt-1 text-metadata-ui text-muted-foreground">{automationTriggerLabel(recipe.triggerType)}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-metadata-ui text-muted-foreground">{automationActionLabel(recipe.actionType)}</span>
                                <span className="inline-flex items-center gap-1 text-label-ui font-semibold text-foreground">
                                    Usar modelo <Plus className="size-4" aria-hidden="true" />
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

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

        </div>
    );
}
