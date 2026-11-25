'use client';

import React, { useRef, useState } from 'react';
import {
    X,
    Zap,
    ArrowRight,
    ArrowLeft,
    Bell,
    RefreshCw,
    UserPlus,
    Settings,
    CheckCircle2,
    Plus,
    Trash2
} from 'lucide-react';
import type { TriggerType, ActionType, Automation } from '@/types/automation';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NewAutomationModalProps {
    onClose: () => void;
    onSave: (automation: Partial<Automation>) => Promise<any>;
    initialData?: Partial<Automation>;
}

export const NewAutomationModal = ({ onClose, onSave, initialData }: NewAutomationModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const opener = useRef<HTMLElement | null>(null);
    useDialogBackgroundInert(true);

    const [formData, setFormData] = useState<Partial<Automation>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        category: initialData?.category || 'followup',
        enabled: initialData?.enabled ?? true,
        trigger: initialData?.trigger || {
            type: 'deal_created',
            config: {}
        },
        actions: initialData?.actions || [
            {
                type: 'send_notification',
                config: { title: 'Nova Automação Ativada', description: 'Um fluxo foi iniciado.' }
            }
        ]
    });

    const categories = [
        { id: 'followup', label: 'Follow-up', icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
        { id: 'alert', label: 'Alerta', icon: Bell, color: 'text-warning-readable', bg: 'bg-warning-subtle' },
        { id: 'welcome', label: 'Boas-vindas', icon: UserPlus, color: 'text-success-readable', bg: 'bg-success-subtle' },
        { id: 'custom', label: 'Personalizada', icon: Settings, color: 'text-foreground', bg: 'bg-info-subtle' },
    ];

    const triggerTypes: { id: TriggerType; label: string; desc: string }[] = [
        { id: 'deal_created', label: 'Oportunidade Criada', desc: 'Sempre que um novo deal entrar no pipeline' },
        { id: 'deal_moved', label: 'Oportunidade Movida', desc: 'Quando um deal mudar de estágio' },
        { id: 'proposal_sent', label: 'Proposta Enviada', desc: 'Ao gerar e enviar uma proposta' },
        { id: 'deal_stagnant', label: 'Oportunidade Estagnada', desc: 'Sem movimentação por X dias' },
        { id: 'activity_created', label: 'Atividade Criada', desc: 'Quando um novo compromisso é agendado' },
    ];

    const actionTypes: { id: ActionType; label: string; desc: string }[] = [
        { id: 'send_notification', label: 'Notificação Push', desc: 'Avisa o dono do deal no sistema' },
        { id: 'send_email', label: 'Enviar E-mail', desc: 'Usa um template pré-definido' },
        { id: 'create_task', label: 'Criar Tarefa', desc: 'Agenda uma atividade pendente' },
        { id: 'move_deal', label: 'Mover Oportunidade', desc: 'Troca o estágio automaticamente' },
    ];

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);
        setSaveError(false);
        try {
            await onSave({
                ...formData,
                id: initialData?.id,
                executionCount: initialData?.executionCount || 0,
                successCount: initialData?.successCount || 0,
                failureCount: initialData?.failureCount || 0
            });
            onClose();
        } catch {
            setSaveError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={open => { if (!open && !loading) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="flex w-[calc(100%_-_2rem)] max-w-2xl max-h-[90dvh] flex-col gap-0 overflow-hidden bg-card p-0"
                onInteractOutside={event => event.preventDefault()}
                onEscapeKeyDown={event => { if (loading) event.preventDefault(); }}
                onOpenAutoFocus={() => {
                    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                }}
                onCloseAutoFocus={event => {
                    event.preventDefault();
                    const target = opener.current;
                    if (target?.isConnected) requestAnimationFrame(() => target.focus());
                }}
            >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-surface-subtle p-4 sm:px-6">
                    <div className="min-w-0">
                        <DialogTitle className="leading-snug">
                            {initialData?.id ? 'Editar Fluxo de Trabalho' : 'Novo Fluxo de Trabalho'}
                        </DialogTitle>
                        <DialogDescription className="mt-1">Passo {step} de 3 · {step === 1 ? 'Identificação' : step === 2 ? 'Gatilho' : 'Ações'}</DialogDescription>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Fechar editor de fluxo" onClick={onClose} disabled={loading}>
                        <X aria-hidden="true" />
                    </Button>
                </div>

                {/* Progress Bar */}
                <div aria-hidden="true" className="h-1 shrink-0 bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="mb-3 text-section-title font-semibold text-foreground">Informações básicas</h3>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label htmlFor="automation-name" className="text-label-ui font-medium text-foreground">Nome da automação</label>
                                        <Input
                                            id="automation-name"
                                            type="text"
                                            placeholder="Ex.: Follow-up 3 dias"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="automation-description" className="text-label-ui font-medium text-foreground">Descrição</label>
                                        <Textarea
                                            id="automation-description"
                                            placeholder="Descreva o que este fluxo faz"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 text-section-title font-semibold text-foreground">Categoria</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            aria-pressed={formData.category === cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id as any })}
                                            className={`focus-ring flex items-center gap-3 p-3 rounded-[var(--radius-control)] border transition-colors ${formData.category === cat.id
                                                ? 'bg-primary/10 border-primary/40 shadow-card-ui shadow-primary/5'
                                                : 'bg-muted/50 border-transparent hover:border-border'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-[var(--radius-panel)] ${cat.bg}`}>
                                                <cat.icon className={`h-5 w-5 ${cat.color}`} />
                                            </div>
                                            <span className={`font-bold ${formData.category === cat.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="mb-3 text-section-title font-semibold text-foreground">Quando este fluxo inicia?</h3>
                                <div className="space-y-4">
                                    {triggerTypes.map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            aria-pressed={formData.trigger?.type === type.id}
                                            onClick={() => setFormData({
                                                ...formData,
                                                trigger: formData.trigger?.type === type.id ? formData.trigger : { type: type.id, config: {} }
                                            })}
                                            className={`focus-ring w-full flex items-start text-left gap-3 p-3 rounded-[var(--radius-control)] border transition-colors ${formData.trigger?.type === type.id
                                                ? 'bg-primary/10 border-primary/40'
                                                : 'bg-muted/50 border-transparent hover:border-border'
                                                }`}
                                        >
                                            <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.trigger?.type === type.id
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/30'
                                                }`}>
                                                {formData.trigger?.type === type.id && <div className="h-2 w-2 bg-primary-foreground rounded-full" />}
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold ${formData.trigger?.type === type.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {type.label}
                                                </h4>
                                                <p className="text-body-ui text-muted-foreground mt-0.5">{type.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">
                            <h3 className="text-section-title font-semibold text-foreground">O que deve acontecer?</h3>

                             <div className="space-y-6">
                                {/* Trigger Visual Badge */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-[var(--radius-panel)] flex items-center gap-4 shadow-card-ui shadow-primary/5">
                                        <div className="h-8 w-8 rounded-[var(--radius-panel)] bg-primary flex items-center justify-center">
                                            <Zap className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-metadata-ui font-medium text-foreground">Gatilho selecionado</p>
                                            <p className="text-body-ui font-bold text-foreground">
                                                {triggerTypes.find(t => t.id === formData.trigger?.type)?.label || 'Início'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-10 w-0.5 bg-border" />
                                </div>

                                {formData.actions?.map((action, idx) => (
                                    <div key={idx} className="bg-muted/30 p-5 rounded-[var(--radius-panel)] border border-border relative group hover:border-primary/20 transition-all">
                                        <button
                                            onClick={() => {
                                                const newActions = [...(formData.actions || [])];
                                                newActions.splice(idx, 1);
                                                setFormData({ ...formData, actions: newActions });
                                            }}
                                            type="button"
                                            aria-label={`Remover ação ${idx + 1}`}
                                            className="focus-ring absolute right-3 top-3 rounded-[var(--radius-control)] p-2 text-muted-foreground hover:text-destructive-readable transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pr-9">
                                                    <p className="text-label-ui font-semibold text-foreground">Ação {idx + 1}</p>
                                                    {initialData && (
                                                        <span className="text-metadata-ui font-medium bg-surface-subtle text-foreground px-2 py-0.5 rounded-full">Configuração inicial</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    {actionTypes.map(type => (
                                                        <button
                                                            key={type.id}
                                                            type="button"
                                                            aria-pressed={action.type === type.id}
                                                            onClick={() => {
                                                                const newActions = [...(formData.actions || [])];
                                                                newActions[idx] = { ...newActions[idx], type: type.id };
                                                                setFormData({ ...formData, actions: newActions });
                                                            }}
                                                            className={`focus-ring p-3 rounded-[var(--radius-control)] border text-body-ui font-medium transition-colors ${action.type === type.id
                                                                ? 'bg-primary/10 border-primary text-foreground'
                                                                : 'bg-card border-transparent text-muted-foreground hover:border-border'
                                                                }`}
                                                        >
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor={`automation-action-title-${idx}`} className="mb-2 block text-label-ui font-medium text-foreground">Assunto ou título da ação {idx + 1}</label>
                                                <Input
                                                    id={`automation-action-title-${idx}`}
                                                    type="text"
                                                    placeholder="Assunto ou título"
                                                    value={action.config.title || ''}
                                                    onChange={e => {
                                                        const newActions = [...(formData.actions || [])];
                                                        newActions[idx] = { ...newActions[idx], config: { ...newActions[idx].config, title: e.target.value } };
                                                        setFormData({ ...formData, actions: newActions });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => {
                                        const newActions = [...(formData.actions || []), { type: 'send_notification', config: {} }];
                                        setFormData({ ...formData, actions: newActions as any });
                                    }}
                                    type="button"
                                    className="focus-ring w-full p-3 border border-dashed border-border rounded-[var(--radius-control)] text-body-ui font-medium text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-all" /> Adicionar ação
                                </button>
                            </div>

                            <div className="bg-primary/5 p-6 rounded-[var(--radius-panel)] border border-primary/10 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-[var(--radius-panel)] bg-primary flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <p className="text-body-ui text-muted-foreground font-medium">
                                    {initialData?.id
                                        ? `As alterações mantêm o fluxo ${formData.enabled ? "ativo" : "pausado"}.`
                                        : "Ao salvar, o fluxo ficará habilitado na configuração. Isso não confirma a execução automática."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {saveError && (
                    <p role="alert" className="shrink-0 border-t border-border bg-destructive-subtle px-4 py-3 text-body-ui text-destructive-readable sm:px-6">
                        Não foi possível salvar o fluxo. Suas alterações permanecem no formulário; tente novamente.
                    </p>
                )}
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-4 sm:px-6">
                    <Button type="button" variant="outline" onClick={step === 1 ? onClose : handleBack} disabled={loading}>
                        {step === 1 ? 'Cancelar' : <><ArrowLeft aria-hidden="true" /> Voltar</>}
                    </Button>
                    <Button type="button" onClick={step === 3 ? handleSubmit : handleNext} disabled={loading || (step === 1 && !formData.name?.trim())}>
                        {loading ? 'Salvando...' : step === 3 ? (
                            <>{initialData?.id ? 'Salvar alterações' : 'Salvar fluxo'} <CheckCircle2 aria-hidden="true" /></>
                        ) : (
                            <>Próximo <ArrowRight aria-hidden="true" /></>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
