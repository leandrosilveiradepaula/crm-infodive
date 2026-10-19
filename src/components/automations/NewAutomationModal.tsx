'use client';

import React, { useRef, useState } from 'react';
import {
    X, Zap, ArrowRight, ArrowLeft, Bell, RefreshCw, UserPlus, Settings,
    CheckCircle2, Plus, Trash2,
} from 'lucide-react';
import type { Action, ActionType, Automation, Condition, ConditionOperator, TriggerType } from '@/types/automation';
import {
    CONDITION_OPERATORS,
    VALUELESS_CONDITION_OPERATORS,
    type ConditionDraft,
    normalizeAutomationConditions,
} from '@/lib/automation-builder-input';

interface NewAutomationModalProps {
    onClose: () => void;
    onSave: (automation: Partial<Automation>) => Promise<any>;
    initialData?: Partial<Automation>;
}

const conditionOperatorLabels: Record<(typeof CONDITION_OPERATORS)[number], string> = {
    equals: 'É igual a',
    not_equals: 'Não é igual a',
    contains: 'Contém',
    not_contains: 'Não contém',
    greater_than: 'É maior que',
    less_than: 'É menor que',
    is_empty: 'Está vazio',
    is_not_empty: 'Não está vazio',
};

function draftsFromConditions(conditions: Condition[] | undefined): ConditionDraft[] {
    return (conditions || []).map((condition) => ({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        logic: condition.logic,
        valueKind: typeof condition.value === 'number' ? 'number' : 'text',
    }));
}

export const NewAutomationModal = ({ onClose, onSave, initialData }: NewAutomationModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [conditionError, setConditionError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const submitInFlight = useRef(false);
    const [conditions, setConditions] = useState<ConditionDraft[]>(() => draftsFromConditions(initialData?.conditions));
    const [formData, setFormData] = useState<Partial<Automation>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        category: initialData?.category || 'followup',
        enabled: initialData?.enabled ?? false,
        trigger: initialData?.trigger || { type: 'deal_created', config: {} },
        actions: initialData?.actions || [{ type: 'create_task', config: { title: 'Nova tarefa' } }],
    });

    const categories = [
        { id: 'followup', label: 'Follow-up', icon: RefreshCw },
        { id: 'alert', label: 'Alerta', icon: Bell },
        { id: 'welcome', label: 'Boas-vindas', icon: UserPlus },
        { id: 'custom', label: 'Personalizada', icon: Settings },
    ];
    const triggerTypes: { id: TriggerType; label: string; desc: string }[] = [
        { id: 'deal_created', label: 'Oportunidade Criada', desc: 'Sempre que uma nova oportunidade entrar no pipeline' },
        { id: 'deal_moved', label: 'Oportunidade Movida', desc: 'Quando uma oportunidade mudar de estágio' },
    ];
    const actionTypes: { id: ActionType; label: string }[] = [{ id: 'create_task', label: 'Criar Tarefa' }];

    const updateCondition = (index: number, patch: Partial<ConditionDraft>) => {
        setConditionError(null);
        setConditions((current) => current.map((condition, itemIndex) => itemIndex === index ? { ...condition, ...patch } : condition));
    };
    const addCondition = () => {
        setConditionError(null);
        setConditions((current) => [...current, { field: '', operator: 'equals', value: '', logic: 'AND', valueKind: 'text' }]);
    };
    const removeCondition = (index: number) => {
        setConditionError(null);
        setConditions((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };
    const addAction = () => setFormData((previous) => ({
        ...previous,
        actions: [...(previous.actions || []), { type: 'create_task', config: { title: 'Nova tarefa' } }],
    }));

    const handleSubmit = async () => {
        if (submitInFlight.current) return;
        setSaveError(null);

        let serializedConditions: Condition[];
        try {
            serializedConditions = normalizeAutomationConditions(conditions);
        } catch (error) {
            setConditionError(error instanceof Error ? error.message : 'Condições inválidas.');
            setStep(2);
            return;
        }

        submitInFlight.current = true;
        setLoading(true);
        try {
            await onSave({
                ...formData,
                conditions: serializedConditions,
                id: initialData?.id,
                executionCount: initialData?.executionCount || 0,
                successCount: initialData?.successCount || 0,
                failureCount: initialData?.failureCount || 0,
            });
        } catch (error) {
            // The parent also displays a toast; retain all fields and show an inline retryable error.
            setSaveError(error instanceof Error && error.message ? error.message : 'Não foi possível salvar a automação.');
        } finally {
            submitInFlight.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 px-6 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center"><Zap className="h-6 w-6 text-primary-foreground" /></div>
                        <div>
                            <h2 className="text-xl font-black text-foreground">{initialData?.id ? 'Editar Fluxo de Trabalho' : 'Novo Fluxo de Trabalho'}</h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Passo {step} de 3</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-muted-foreground hover:text-foreground"><X className="h-6 w-6" /></button>
                </div>
                <div className="h-1 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {step === 1 && <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Informações Básicas</label>
                            <input aria-label="Nome da automação" type="text" placeholder="Nome da Automação" className="w-full bg-muted/50 rounded-xl px-4 py-3 text-foreground" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
                            <textarea aria-label="Descrição" placeholder="Descreva o que este fluxo faz..." className="w-full bg-muted/50 rounded-xl px-4 py-3 text-foreground mt-4 h-28 resize-none" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {categories.map((category) => <button type="button" key={category.id} onClick={() => setFormData({ ...formData, category: category.id as Automation['category'] })} className={`flex items-center gap-3 p-3.5 rounded-xl border ${formData.category === category.id ? 'bg-primary/10 border-primary/40' : 'bg-muted/50 border-transparent'}`}>
                                <category.icon className="h-5 w-5" /><span className="font-bold">{category.label}</span>
                            </button>)}
                        </div>
                    </div>}

                    {step === 2 && <div className="space-y-8">
                        <section>
                            <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Quando este fluxo inicia?</label>
                            <div className="space-y-3">{triggerTypes.map((type) => <button type="button" key={type.id} onClick={() => setFormData({ ...formData, trigger: { type: type.id, config: {} } })} className={`w-full text-left p-4 rounded-xl border ${formData.trigger?.type === type.id ? 'bg-primary/10 border-primary/40' : 'bg-muted/50 border-transparent'}`}>
                                <h4 className="font-black">{type.label}</h4><p className="text-sm text-muted-foreground mt-0.5">{type.desc}</p>
                            </button>)}</div>
                            {formData.trigger?.type === 'deal_moved' && (
                                <label className="block mt-4 text-sm text-muted-foreground">
                                    Estágio de destino (opcional)
                                    <input
                                        type="text"
                                        aria-label="Estágio de destino"
                                        placeholder="ID ou nome do estágio"
                                        className="mt-2 w-full bg-card rounded-lg px-3 py-2"
                                        value={formData.trigger.config.stage ?? ''}
                                        onChange={(event) => setFormData((previous) => ({
                                            ...previous,
                                            trigger: {
                                                type: previous.trigger?.type ?? 'deal_moved',
                                                config: { ...previous.trigger?.config, stage: event.target.value },
                                            },
                                        }))}
                                    />
                                </label>
                            )}
                        </section>

                        <section className="border-t border-border pt-6">
                            <div className="flex items-center justify-between gap-4 mb-2">
                                <div><h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Condições opcionais</h3><p className="text-sm text-muted-foreground mt-2">Sem condições, todo evento deste gatilho é elegível.</p></div>
                                <button type="button" onClick={addCondition} className="flex items-center gap-2 text-primary text-xs font-black"><Plus className="h-4 w-4" />Adicionar condição</button>
                            </div>
                            {conditionError && <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{conditionError}</p>}
                            <div className="space-y-3 mt-4">
                                {conditions.map((condition, index) => {
                                    const valueless = VALUELESS_CONDITION_OPERATORS.has(condition.operator as ConditionOperator);
                                    return <div key={index} className="rounded-xl border border-border bg-muted/30 p-4">
                                        <div className="flex items-center justify-between mb-3"><span className="text-xs font-bold text-muted-foreground">{index === 0 ? 'SE' : condition.logic === 'OR' ? 'OU' : 'E'}</span><button type="button" aria-label={`Remover condição ${index + 1}`} onClick={() => removeCondition(index)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            {index > 0 && <select aria-label={`Lógica da condição ${index + 1}`} className="bg-card rounded-lg px-3 py-2" value={String(condition.logic)} onChange={(event) => updateCondition(index, { logic: event.target.value })}><option value="AND">E (AND)</option><option value="OR">OU (OR)</option></select>}
                                            <input aria-label={`Campo da condição ${index + 1}`} className="bg-card rounded-lg px-3 py-2 sm:col-span-1" placeholder="ex.: deal.value" value={typeof condition.field === 'string' ? condition.field : ''} onChange={(event) => updateCondition(index, { field: event.target.value })} />
                                            <select aria-label={`Operador da condição ${index + 1}`} className="bg-card rounded-lg px-3 py-2" value={String(condition.operator)} onChange={(event) => updateCondition(index, { operator: event.target.value, value: VALUELESS_CONDITION_OPERATORS.has(event.target.value as ConditionOperator) ? undefined : condition.value })}>{CONDITION_OPERATORS.map((operator) => <option key={operator} value={operator}>{conditionOperatorLabels[operator]}</option>)}</select>
                                            {!valueless && (condition.operator === 'equals' || condition.operator === 'not_equals') && (
                                                <select
                                                    aria-label={`Tipo de valor da condição ${index + 1}`}
                                                    value={condition.valueKind ?? 'text'}
                                                    onChange={(event) => updateCondition(index, { valueKind: event.target.value as 'text' | 'number' })}
                                                    className="bg-card rounded-lg px-3 py-2"
                                                >
                                                    <option value="text">Texto</option>
                                                    <option value="number">Número</option>
                                                </select>
                                            )}
                                            {!valueless && <input
                                                aria-label={`Valor da condição ${index + 1}`}
                                                className="bg-card rounded-lg px-3 py-2"
                                                placeholder="Valor"
                                                inputMode={condition.valueKind === 'number' || condition.operator === 'greater_than' || condition.operator === 'less_than' ? 'decimal' : 'text'}
                                                value={condition.value === undefined || condition.value === null ? '' : String(condition.value)}
                                                onChange={(event) => updateCondition(index, { value: event.target.value })}
                                            />}
                                        </div>
                                    </div>;
                                })}
                            </div>
                        </section>
                    </div>}

                    {step === 3 && <div className="space-y-6">
                        {saveError && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{saveError}</p>}
                        <div className="flex items-center justify-between"><label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">O que deve acontecer?</label><button type="button" onClick={addAction} className="flex items-center gap-2 text-primary text-xs font-black"><Plus className="h-4 w-4" />Adicionar ação</button></div>
                        {formData.actions?.map((action, index) => <div key={index} className="bg-muted/30 p-5 rounded-xl border border-border relative">
                            <button type="button" aria-label={`Remover ação ${index + 1}`} onClick={() => setFormData({ ...formData, actions: (formData.actions || []).filter((_, itemIndex) => itemIndex !== index) })} className="absolute top-5 right-5 text-muted-foreground hover:text-destructive"><Trash2 className="h-5 w-5" /></button>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Ação #{index + 1}</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">{actionTypes.map((type) => <button type="button" key={type.id} onClick={() => { const actions = [...(formData.actions || [])]; actions[index] = { ...actions[index], type: type.id }; setFormData({ ...formData, actions }); }} className={`p-3 rounded-xl border text-xs font-black ${action.type === type.id ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-transparent text-muted-foreground'}`}>{type.label}</button>)}</div>
                            <input aria-label={`Título da ação ${index + 1}`} type="text" placeholder="Assunto / Título da Ação" className="w-full bg-card rounded-xl px-5 py-3 text-foreground text-sm" value={action.config.title || ''} onChange={(event) => { const actions = [...(formData.actions || [])]; actions[index] = { ...actions[index], config: { ...actions[index].config, title: event.target.value } }; setFormData({ ...formData, actions }); }} />
                        </div>)}
                        <button type="button" onClick={addAction} className="w-full p-4 border-2 border-dashed border-border rounded-2xl text-xs font-black text-muted-foreground flex items-center justify-center gap-2"><Plus className="h-4 w-4" />Adicionar passo sequencial</button>
                        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-4"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground font-medium">{formData.enabled ? 'O fluxo permanece ativo ao salvar.' : 'O fluxo será salvo pausado.'}</p></div>
                    </div>}
                </div>

                <div className="p-4 px-6 border-t border-border bg-card flex items-center justify-between">
                    <button type="button" onClick={step === 1 ? onClose : () => setStep((current) => current - 1)} className="px-8 py-3.5 rounded-2xl font-bold bg-muted text-muted-foreground flex items-center gap-2">{step === 1 ? 'Cancelar' : <><ArrowLeft className="h-5 w-5" />Voltar</>}</button>
                    <button type="button" onClick={step === 3 ? handleSubmit : () => setStep((current) => current + 1)} disabled={loading || (step === 1 && !formData.name?.trim()) || (step === 3 && !(formData.actions?.length))} aria-busy={loading} className="px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground">{loading ? 'Salvando...' : step === 3 ? <>Salvar Configuração<CheckCircle2 className="h-5 w-5" /></> : <>Próximo<ArrowRight className="h-5 w-5" /></>}</button>
                </div>
            </div>
        </div>
    );
};
