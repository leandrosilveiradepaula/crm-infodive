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
            color: 'blue',
            description: 'Equipamentos físicos'
        },
        {
            key: 'software',
            label: 'Software',
            icon: Code,
            color: 'violet',
            description: 'Licenças e sistemas'
        },
        {
            key: 'services',
            label: 'Serviços',
            icon: Wrench,
            color: 'amber',
            description: 'Consultoria e suporte'
        },
    ];

    const getIconColor = (color: string) => {
        const colors: any = {
            blue: 'text-blue-500 bg-blue-500/10',
            violet: 'text-violet-500 bg-violet-500/10',
            amber: 'text-amber-500 bg-amber-500/10',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-22rem)] min-h-[400px]">
            {/* User List Sidebar */}
            <div className="w-72 border-r border-border pr-6 overflow-y-auto">
                <div className="mb-6">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Selecione o Usuário</h3>
                    <p className="text-xs text-muted-foreground">Configure as comissões individuais</p>
                </div>
                <div className="space-y-2">
                    {users.map((user: any) => (
                        <button
                            key={user.user_id || user.id}
                            onClick={() => setSelectedUserId(user.user_id || user.id)}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-300 border-2 ${selectedUserId === (user.user_id || user.id)
                                ? 'bg-primary text-white shadow-xl shadow-primary/30 border-primary scale-105'
                                : 'text-muted-foreground hover:bg-muted/50 border-transparent hover:border-border/50 hover:text-foreground hover:scale-102'
                                }`}
                        >
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-black transition-all ${selectedUserId === (user.user_id || user.id)
                                ? 'bg-card/20 text-white shadow-lg'
                                : 'bg-gradient-to-br from-muted to-muted/50 text-muted-foreground'
                                }`}>
                                {user.avatar || user.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${selectedUserId === (user.user_id || user.id) ? 'text-white' : 'text-foreground'
                                    }`}>
                                    {user.name}
                                </p>
                                <p className={`text-[10px] uppercase tracking-wider font-medium ${selectedUserId === (user.user_id || user.id) ? 'text-blue-200' : 'text-muted-foreground'
                                    }`}>
                                    {user.role}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Commission Editor */}
            <div className="flex-1 overflow-y-auto pr-2">
                {!selectedUser ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                            <DollarSign className="h-24 w-24 opacity-20 relative" />
                        </div>
                        <p className="text-lg font-medium">Selecione um usuário</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">Configure as regras de comissão</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Header */}
                        <div className="flex items-start justify-between pb-6 border-b border-border">
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">Regras de Comissão</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Configurando para <span className="font-bold text-primary">{(selectedUser as any).name}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSimulatorOpen(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500/20 hover:to-emerald-600/20 text-emerald-500 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border-2 border-emerald-500/20 hover:border-emerald-500/40 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-105"
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
                                        className="bg-card p-6 rounded-2xl border-2 border-border hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl group animate-in fade-in slide-in-from-left"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`p-3 rounded-xl ${getIconColor(product.color)} transition-transform group-hover:scale-110`}>
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h4 className="text-base font-black text-foreground mb-1">{product.label}</h4>
                                                <p className="text-xs text-muted-foreground mb-4">{product.description}</p>

                                                {/* Inputs Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* Base Client */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                                                            Cliente Base
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                className="w-full px-4 py-3 pr-8 bg-muted/30 border-2 border-border rounded-xl text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base font-bold text-foreground hover:bg-muted/50 focus:scale-105"
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
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                                                        </div>
                                                    </div>

                                                    {/* New Client */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                                                            Cliente Novo
                                                            <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-black">BÔNUS</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                className="w-full px-4 py-3 pr-8 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-xl text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-base font-bold text-emerald-600 hover:bg-emerald-500/10 focus:scale-105"
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
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">%</span>
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
                        <div className="bg-blue-500/5 border-2 border-blue-500/20 rounded-2xl p-5 flex gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-foreground mb-1">Dica de Configuração</h5>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Defina percentuais maiores para <span className="font-bold text-emerald-600">clientes novos</span> para incentivar a prospecção.
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
