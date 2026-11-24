'use client';

import { useState } from 'react';
import { UserGoalData } from '@/types/goal';
import { updateUserGoals } from '@/app/(dashboard)/goals/actions';
import { DollarSign, TrendingUp, Calculator, Cpu, Code, Wrench } from 'lucide-react';
import { CommissionSimulator } from '../CommissionSimulator';

interface CommissionsTabProps {
    users: UserGoalData[];
}

export function CommissionsTab({ users }: CommissionsTabProps) {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

    const selectedUser = users.find(u => u.user_id === selectedUserId);

    const handleUpdateRules = async (newRules: any) => {
        if (!selectedUserId) return;
        await updateUserGoals(selectedUserId, { commission_rules: newRules });
    };

    // Product type configuration
    const productTypes = [
        {
            key: 'hardware',
            label: 'Hardware',
            icon: Cpu,
            tone: 'primary',
            description: 'Equipamentos físicos'
        },
        {
            key: 'software',
            label: 'Software',
            icon: Code,
            tone: 'info',
            description: 'Licenças e sistemas'
        },
        {
            key: 'services',
            label: 'Serviços',
            icon: Wrench,
            tone: 'warning',
            description: 'Consultoria e suporte'
        },
    ] as const;

    const iconToneClasses = { primary: 'bg-primary/10 text-primary', info: 'bg-info-subtle text-foreground', warning: 'bg-warning-subtle text-warning-readable' } as const;

    return (
        <div data-qa-region="goals-commissions" className="flex min-h-[400px] min-w-0 flex-col gap-4 lg:h-[calc(100vh-22rem)] lg:flex-row lg:gap-6">
            {/* User List Sidebar */}
            <div className="w-full min-w-0 border-b border-border pb-4 lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6 lg:overflow-y-auto">
                <div className="mb-6">
                    <h3 className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-[0.2em] mb-1">Selecione o Usuário</h3>
                    <p className="ds-type-metadata text-muted-foreground">Configure as comissões individuais</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                    {users.map((user: any) => (
                        <button
                            key={user.user_id || user.id}
                            type="button"
                            aria-pressed={selectedUserId === (user.user_id || user.id)}
                            onClick={() => setSelectedUserId(user.user_id || user.id)}
                            className={`flex min-w-[200px] shrink-0 items-center gap-3 p-3 lg:w-full lg:min-w-0 lg:p-4 focus-ring rounded-[var(--radius-panel)] text-left transition-all duration-300 border-2 ${selectedUserId === (user.user_id || user.id)
                                ? 'bg-primary text-primary-foreground shadow-overlay-ui border-primary scale-105'
                                : 'text-muted-foreground hover:bg-muted/50 border-transparent hover:border-border/50 hover:text-foreground hover:scale-102'
                                }`}
                        >
                            <div className={`h-12 w-12 rounded-[var(--radius-panel)] flex items-center justify-center ds-type-body font-[var(--ds-type-metric-weight)] transition-all ${selectedUserId === (user.user_id || user.id)
                                ? 'bg-primary-foreground text-primary shadow-card-ui'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                {user.avatar || user.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`ds-type-body font-[var(--ds-type-control-weight)] truncate ${selectedUserId === (user.user_id || user.id) ? 'text-primary-foreground' : 'text-foreground'
                                    }`}>
                                    {user.name}
                                </p>
                                <p className={`ds-type-metadata uppercase tracking-wider font-[var(--ds-type-label-weight)] ${selectedUserId === (user.user_id || user.id) ? 'text-primary-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {user.role}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Commission Editor */}
            <div className="min-w-0 flex-1 lg:overflow-y-auto lg:pr-2">
                {!selectedUser ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                            <DollarSign className="h-24 w-24 opacity-20 relative" />
                        </div>
                        <p className="ds-type-section-title font-[var(--ds-type-label-weight)]">Selecione um usuário</p>
                        <p className="ds-type-body text-muted-foreground mt-1">Configure as regras de comissão</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Header */}
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-6 border-b border-border">
                            <div>
                                <h3 className="ds-type-metric font-[var(--ds-type-metric-weight)] text-foreground tracking-tight">Regras de Comissão</h3>
                                <p className="ds-type-body text-muted-foreground mt-1">
                                    Configurando para <span className="font-[var(--ds-type-control-weight)] text-primary">{(selectedUser as any).name}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSimulatorOpen(true)}
                                className="flex items-center gap-2 h-11 px-6 bg-success-subtle hover:bg-muted text-foreground rounded-[var(--radius-panel)] transition-all font-[var(--ds-type-metric-weight)] ds-type-metadata uppercase tracking-widest border border-success/20 hover:border-success/40 shadow-card-ui"
                            >
                                <Calculator className="h-4 w-4" />
                                Simular Ganhos
                            </button>
                        </div>

                        {/* Commission Grid */}
                        <div className="grid gap-4">
                            {productTypes.map((product, index) => {
                                const Icon = product.icon;
                                return (
                                    <div
                                        key={product.key}
                                        className="bg-card p-6 rounded-[var(--radius-panel)] border-2 border-border hover:border-primary/30 transition-all duration-300 shadow-card-ui hover:shadow-overlay-ui group animate-in fade-in slide-in-from-left"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex flex-col items-start gap-4 sm:flex-row">
                                            {/* Icon */}
                                            <div className={`p-3 rounded-[var(--radius-panel)] ${iconToneClasses[product.tone]} transition-transform group-hover:scale-110`}>
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h4 className="text-[var(--ds-type-legacy-base-size)] font-[var(--ds-type-metric-weight)] text-foreground mb-1">{product.label}</h4>
                                                <p className="ds-type-metadata text-muted-foreground mb-4">{product.description}</p>

                                                {/* Inputs Grid */}
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    {/* Base Client */}
                                                    <div className="space-y-2">
                                                        <label className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-wider block">
                                                            Cliente Base
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                aria-label={`${product.label}: comissão de cliente base em porcentagem`}
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                className="w-full h-11 px-4 pr-8 bg-muted/30 border border-border rounded-[var(--radius-panel)] text-center focus:ring-1 focus:ring-primary outline-none transition-all ds-type-body font-[var(--ds-type-control-weight)] text-foreground"
                                                                defaultValue={(selectedUser.commission_rules as any)?.[product.key]?.base ?? 0}
                                                                onBlur={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    const currentRules = selectedUser.commission_rules || {} as any;
                                                                    const newRules = {
                                                                        ...currentRules,
                                                                        [product.key]: { ...(currentRules as any)[product.key], base: val }
                                                                    };
                                                                    handleUpdateRules(newRules);
                                                                }}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase opacity-50">%</span>
                                                        </div>
                                                    </div>

                                                    {/* New Client */}
                                                    <div className="space-y-1.5 flex-1">
                                                        <label className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest block">
                                                            Cliente Novo
                                                            <span className="ml-2 px-2 py-0.5 bg-success-subtle text-success-readable rounded-[var(--radius-panel)] ds-type-metadata font-[var(--ds-type-metric-weight)]">BÔNUS</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                aria-label={`${product.label}: comissão de cliente novo em porcentagem`}
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                className="w-full h-11 px-4 pr-8 bg-success-subtle border border-success/20 rounded-[var(--radius-panel)] text-center focus:ring-1 focus:ring-success outline-none transition-all ds-type-body font-[var(--ds-type-control-weight)] text-success-readable"
                                                                defaultValue={(selectedUser.commission_rules as any)?.[product.key]?.new ?? 0}
                                                                onBlur={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    const currentRules = selectedUser.commission_rules || {} as any;
                                                                    const newRules = {
                                                                        ...currentRules,
                                                                        [product.key]: { ...(currentRules as any)[product.key], new: val }
                                                                    };
                                                                    handleUpdateRules(newRules);
                                                                }}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 ds-type-metadata font-[var(--ds-type-metric-weight)] text-success-readable uppercase opacity-50">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Info Card */}
                        <div className="bg-info-subtle border-2 border-info/20 rounded-[var(--radius-panel)] p-5 flex gap-4">
                            <div className="p-2 bg-info-subtle rounded-[var(--radius-panel)] h-fit">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h5 className="ds-type-body font-[var(--ds-type-control-weight)] text-foreground mb-1">Dica de Configuração</h5>
                                <p className="ds-type-metadata text-muted-foreground leading-relaxed">
                                    Defina percentuais maiores para <span className="font-[var(--ds-type-control-weight)] text-success-readable">clientes novos</span> para incentivar a prospecção.
                                    As comissões são calculadas sobre o valor total da venda.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isSimulatorOpen && selectedUser && (
                <CommissionSimulator
                    user={{
                        id: selectedUser.user_id || (selectedUser as any).id,
                        name: (selectedUser as any).name,
                        commission_rules: selectedUser.commission_rules
                    }}
                    onClose={() => setIsSimulatorOpen(false)}
                />
            )}
        </div>
    );
}
