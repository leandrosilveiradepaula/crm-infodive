import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Zap, Plus, Trash2, Settings, List } from 'lucide-react';
import { triggerOptions, actionOptions } from '@/data/automations/automationOptions';
import type { Automation, TriggerType, ActionType, Action } from '@/types/automation';

interface AutomationBuilderProps {
    onClose: () => void;
    onSave: (automation: Partial<Automation>) => void;
}

type Step = 'trigger' | 'actions' | 'details';

export const AutomationBuilder = ({ onClose, onSave }: AutomationBuilderProps) => {
    const [currentStep, setCurrentStep] = useState<Step>('trigger');
    const [config, setConfig] = useState<{
        triggerType: TriggerType | null;
        triggerConfig: any;
        actions: Action[];
        name: string;
        description: string;
        category: Automation['category'];
    }>({
        triggerType: null,
        triggerConfig: {},
        actions: [],
        name: '',
        description: '',
        category: 'custom'
    });

    // Helper to add a placeholder action
    const addAction = (type: ActionType) => {
        const newAction: Action = {
            type,
            config: {},
            delay: 0
        };
        setConfig(prev => ({
            ...prev,
            actions: [...prev.actions, newAction]
        }));
    };

    const removeAction = (index: number) => {
        setConfig(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };

    const handleFinish = () => {
        if (!config.triggerType) return;

        const automation: Partial<Automation> = {
            name: config.name || 'Nova Automação',
            description: config.description,
            category: config.category,
            enabled: true,
            trigger: {
                type: config.triggerType,
                config: config.triggerConfig
            },
            conditions: [], // Simplification: Skipping conditions for now
            actions: config.actions,
            executionCount: 0,
            successCount: 0,
            failureCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'Usuário Atual'
        };

        onSave(automation);
    };

    const renderTriggerStep = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">O que deve iniciar esta automação?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {triggerOptions.map(option => (
                    <div
                        key={option.id}
                        onClick={() => setConfig({ ...config, triggerType: option.id })}
                        className={`
                            p-4 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-4
                            ${config.triggerType === option.id
                                ? 'border-primary bg-blue-50'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                        `}
                    >
                        <div className={`p-2 rounded-lg ${config.triggerType === option.id ? 'bg-card text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                            <option.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className={`font-bold ${config.triggerType === option.id ? 'text-primary' : 'text-foreground'}`}>{option.label}</p>
                            <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderActionsStep = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">O que deve acontecer?</h3>

            {/* Actions List */}
            <div className="space-y-3 mb-6">
                {config.actions.map((action, index) => {
                    const option = actionOptions.find(o => o.id === action.type);
                    return (
                        <div key={index} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl relative group">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-foreground">{option?.label || action.type}</p>
                                <p className="text-xs text-muted-foreground">Delay: {action.delay} min</p>
                            </div>
                            <button
                                onClick={() => removeAction(index)}
                                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}

                {config.actions.length === 0 && (
                    <div className="text-center py-8 bg-muted/50 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                        Nenhuma ação adicionada ainda.
                    </div>
                )}
            </div>

            {/* Add Action Buttons */}
            <div>
                <p className="text-sm font-bold text-muted-foreground uppercase mb-3">Adicionar Ação</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {actionOptions.map(option => (
                        <button
                            key={option.id}
                            onClick={() => addAction(option.id)}
                            className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary hover:text-primary transition-colors text-left"
                        >
                            <option.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderDetailsStep = () => (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Detalhes da Automação</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                    <input
                        type="text"
                        value={config.name}
                        onChange={e => setConfig({ ...config, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Ex: Follow-up de novos leads"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                    <textarea
                        value={config.description}
                        onChange={e => setConfig({ ...config, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="O que esta automação faz?"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                    <select
                        value={config.category}
                        onChange={e => setConfig({ ...config, category: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="custom">Personalizado</option>
                        <option value="followup">Follow-up</option>
                        <option value="alert">Alerta</option>
                        <option value="welcome">Boas-vindas</option>
                        <option value="reminder">Lembrete</option>
                    </select>
                </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border mt-6">
                <h4 className="font-bold text-foreground mb-2">Resumo</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Gatilho: <strong>{triggerOptions.find(t => t.id === config.triggerType)?.label}</strong>
                    </li>
                    <li className="flex items-center gap-2">
                        <List className="h-4 w-4 text-primary" />
                        Ações: <strong>{config.actions.length} configuradas</strong>
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-card border-b border-border p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Construtor de Automação</h2>
                    <p className="text-sm text-muted-foreground">Configure seus gatilhos e ações</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-muted-foreground p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                    <span className="sr-only">Fechar</span>
                    ✕
                </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-muted/50 h-1 w-full">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: currentStep === 'trigger' ? '33%' : currentStep === 'actions' ? '66%' : '100%' }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                    {currentStep === 'trigger' && renderTriggerStep()}
                    {currentStep === 'actions' && renderActionsStep()}
                    {currentStep === 'details' && renderDetailsStep()}
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/50 flex justify-between items-center">
                <button
                    onClick={() => {
                        if (currentStep === 'actions') setCurrentStep('trigger');
                        if (currentStep === 'details') setCurrentStep('actions');
                    }}
                    disabled={currentStep === 'trigger'}
                    className={`
                        px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors
                        ${currentStep === 'trigger' ? 'text-muted-foreground cursor-not-allowed' : 'text-muted-foreground hover:bg-muted/50'}
                    `}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </button>

                {currentStep !== 'details' ? (
                    <button
                        onClick={() => {
                            if (currentStep === 'trigger') setCurrentStep('actions');
                            if (currentStep === 'actions') setCurrentStep('details');
                        }}
                        disabled={currentStep === 'trigger' && !config.triggerType}
                        className={`
                            px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg
                            ${(currentStep === 'trigger' && !config.triggerType)
                                ? 'bg-gray-300 text-muted-foreground cursor-not-allowed shadow-none'
                                : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-blue-500/20'}
                        `}
                    >
                        Próximo
                        <ArrowRight className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleFinish}
                        disabled={!config.name}
                        className={`
                            px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg
                            ${!config.name
                                ? 'bg-gray-300 text-muted-foreground cursor-not-allowed shadow-none'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-green-900/20 active:scale-95'}
                        `}
                    >
                        <Check className="h-4 w-4" />
                        Finalizar
                    </button>
                )}
            </div>
        </div>
    );
};
