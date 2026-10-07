'use client';

import React, { useState } from 'react';
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
import type { TriggerType, ActionType, Automation, Action } from '@/types/automation';

interface NewAutomationModalProps {
    onClose: () => void;
    onSave: (automation: Partial<Automation>) => Promise<any>;
    initialData?: Partial<Automation>;
}

export const NewAutomationModal = ({ onClose, onSave, initialData }: NewAutomationModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Automation>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        category: initialData?.category || 'followup',
        enabled: false,
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
        { id: 'followup', label: 'Follow-up', icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 'alert', label: 'Alerta', icon: Bell, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { id: 'welcome', label: 'Boas-vindas', icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { id: 'custom', label: 'Personalizada', icon: Settings, color: 'text-teal-400', bg: 'bg-teal-400/10' },
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
    const addAction = () => {
        const newAction: Action = { type: 'send_notification', config: {} };
        setFormData(prev => ({
            ...prev,
            actions: [...(prev.actions || []), newAction]
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await onSave({
                ...formData,
                id: initialData?.id,
                executionCount: initialData?.executionCount || 0,
                successCount: initialData?.successCount || 0,
                failureCount: initialData?.failureCount || 0
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 px-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground tracking-tight">
                                {initialData?.id ? 'Editar Fluxo de Trabalho' : 'Novo Fluxo de Trabalho'}
                            </h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Passo {step} de 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Informações Básicas</label>
                                <input
                                    type="text"
                                    placeholder="Nome da Automação (ex: Follow-up 3 dias)"
                                    className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-foreground text-base placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <textarea
                                    placeholder="Descreva o que este fluxo faz..."
                                    className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-foreground mt-4 h-28 resize-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-all outline-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Categoria</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setFormData({ ...formData, category: cat.id as Automation['category'] })}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${formData.category === cat.id
                                                ? 'bg-primary/10 border-primary/40 shadow-xl shadow-primary/5'
                                                : 'bg-muted/50 border-transparent hover:border-border'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-xl ${cat.bg}`}>
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
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div>
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Quando este fluxo inicia?</label>
                                <div className="space-y-4">
                                    {triggerTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData({
                                                ...formData,
                                                trigger: { type: type.id, config: {} }
                                            })}
                                            className={`w-full flex items-start text-left gap-4 p-4 rounded-xl border transition-all duration-300 ${formData.trigger?.type === type.id
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
                                                <h4 className={`font-black tracking-tight ${formData.trigger?.type === type.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {type.label}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mt-0.5">{type.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">O que deve acontecer?</label>
                                <button
                                    onClick={addAction}
                                    className="flex items-center gap-2 text-primary text-xs font-black hover:text-primary/80 transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Adicionar Ação
                                </button>
                            </div>

                             <div className="space-y-6">
                                {/* Trigger Visual Badge */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-primary/5">
                                        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                                            <Zap className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Gatilho Ativo</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {triggerTypes.find(t => t.id === formData.trigger?.type)?.label || 'Início'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-10 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10" />
                                </div>

                                {formData.actions?.map((action, idx) => (
                                    <div key={idx} className="bg-muted/30 p-5 rounded-xl border border-border relative group hover:border-primary/20 transition-all">
                                        <button 
                                            onClick={() => {
                                                const newActions = [...(formData.actions || [])];
                                                newActions.splice(idx, 1);
                                                setFormData({ ...formData, actions: newActions });
                                            }}
                                            className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Ação #{idx + 1}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {actionTypes.map(type => (
                                                        <button
                                                            key={type.id}
                                                            onClick={() => {
                                                                const newActions = [...(formData.actions || [])];
                                                                newActions[idx].type = type.id;
                                                                setFormData({ ...formData, actions: newActions });
                                                            }}
                                                            className={`p-3 rounded-xl border text-xs font-black transition-all ${action.type === type.id
                                                                ? 'bg-primary/20 border-primary text-primary'
                                                                : 'bg-card border-transparent text-muted-foreground hover:border-border'
                                                                }`}
                                                        >
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Configuração</p>
                                                <input
                                                    type="text"
                                                    placeholder="Assunto / Título da Ação"
                                                    className="w-full bg-card border-none rounded-xl px-5 py-3 text-foreground text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all"
                                                    value={action.config.title || ''}
                                                    onChange={e => {
                                                        const newActions = [...(formData.actions || [])];
                                                        newActions[idx].config.title = e.target.value;
                                                        setFormData({ ...formData, actions: newActions });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={addAction}
                                    className="w-full p-4 border-2 border-dashed border-border rounded-2xl text-xs font-black text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-all" /> Adicionar Passo Sequencial
                                </button>
                            </div>

                            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    A configuração será salva como <span className="text-foreground font-bold">rascunho</span>. A ativação automática fica bloqueada até o executor real estar disponível.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 px-6 border-t border-border bg-card flex items-center justify-between">
                    <button
                        onClick={step === 1 ? onClose : handleBack}
                        className="px-8 py-3.5 rounded-2xl font-bold bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all flex items-center gap-2"
                    >
                        {step === 1 ? 'Cancelar' : <><ArrowLeft className="h-5 w-5" /> Voltar</>}
                    </button>

                    <button
                        onClick={step === 3 ? handleSubmit : handleNext}
                        disabled={step === 1 && !formData.name}
                        className={`px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${step === 1 && !formData.name
                            ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                            : 'bg-primary text-primary-foreground shadow-primary/40'
                            }`}
                    >
                        {loading ? 'Criando...' : step === 3 ? (
                            <>Salvar Configuração <CheckCircle2 className="h-5 w-5" /></>
                        ) : (
                            <>Próximo <ArrowRight className="h-5 w-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
