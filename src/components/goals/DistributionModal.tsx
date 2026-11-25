'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserGoalData } from '@/types/goal';
import { X, Users, Target, AlertTriangle, CheckCircle2, UserPlus, Zap } from 'lucide-react';

interface SellerWeight {
    user_id: string;
    name: string;
    avatar?: string;
    weight: number;
}

interface DistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (weights: { user_id: string; weight: number }[]) => void;
    users?: UserGoalData[];
    revenueGoal: number;
    scenarioName: string;
}

export function DistributionModal({
    isOpen,
    onClose,
    onConfirm,
    users = [],
    revenueGoal,
    scenarioName
}: DistributionModalProps) {
    const [weights, setWeights] = useState<SellerWeight[]>([]);

    // Initialize weights equally when modal opens or users change
    useEffect(() => {
        if (!isOpen) return;
        if (!users || users.length === 0) {
            setWeights([]);
            return;
        }
        const equalWeight = parseFloat((100 / users.length).toFixed(2));
        const initial = users.map((u, idx) => ({
            user_id: u.user_id,
            name: (u as any).name || 'Vendedor',
            avatar: (u as any).avatar,
            weight: idx === users.length - 1
                ? parseFloat((100 - equalWeight * (users.length - 1)).toFixed(2))
                : equalWeight
        }));
        setWeights(initial);
    }, [isOpen, users]);

    const totalWeight = useMemo(
        () => parseFloat(weights.reduce((sum, w) => sum + (w.weight || 0), 0).toFixed(2)),
        [weights]
    );
    const isValid = Math.abs(totalWeight - 100) < 0.1;

    const handleWeightChange = (userId: string, value: string) => {
        const num = Math.min(100, Math.max(0, parseFloat(value) || 0));
        setWeights(prev => prev.map(w => w.user_id === userId ? { ...w, weight: num } : w));
    };

    const handleEqualDistribution = () => {
        if (!users.length) return;
        const equalWeight = parseFloat((100 / users.length).toFixed(2));
        setWeights(prev => prev.map((w, idx) => ({
            ...w,
            weight: idx === prev.length - 1
                ? parseFloat((100 - equalWeight * (prev.length - 1)).toFixed(2))
                : equalWeight
        })));
    };

    const handleConfirm = () => {
        onConfirm(weights.map(({ user_id, weight }) => ({ user_id, weight })));
        onClose();
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(value);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-[var(--radius-panel)] shadow-overlay-ui w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-8 border-b border-border/50 bg-muted/10">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <div className="h-9 w-9 rounded-[var(--radius-panel)] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-control-ui">
                                <Target className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h2 className="text-[var(--ds-type-legacy-base-size)] font-[var(--ds-type-metric-weight)] text-foreground uppercase tracking-tight">Distribuir Metas</h2>
                        </div>
                        <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase opacity-70 tracking-widest leading-none">
                            Cenário: <span className="text-primary">{scenarioName}</span> &mdash; Meta: {formatCurrency(revenueGoal)}
                        </p>
                    </div>
                    <button onClick={onClose} type="button" aria-label="Fechar distribuição de metas" className="text-muted-foreground hover:text-foreground transition-all p-2 rounded-[var(--radius-panel)] hover:bg-muted font-[var(--ds-type-metric-weight)]">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">

                    {/* Case: No users */}
                    {users.length === 0 && (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="h-14 w-14 rounded-[var(--radius-panel)] bg-muted flex items-center justify-center">
                                <Users className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="ds-type-body font-[var(--ds-type-control-weight)] text-foreground">Nenhum vendedor cadastrado</p>
                                <p className="ds-type-metadata text-muted-foreground mt-1">
                                    Conclua o cadastro dos vendedores em{' '}
                                    <span className="text-primary font-semibold">Configurações → Usuários</span>{' '}
                                    para distribuir metas.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-[var(--radius-panel)] border border-border ds-type-body font-[var(--ds-type-control-weight)] text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}

                    {/* Case: Single user — direct apply */}
                    {users.length === 1 && weights.length === 1 && (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="h-16 w-16 rounded-[var(--radius-panel)] bg-primary text-primary-foreground flex items-center justify-center ds-type-metric font-[var(--ds-type-metric-weight)] shadow-card-ui">
                                {weights[0].avatar || weights[0].name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-[var(--ds-type-legacy-base-size)] font-[var(--ds-type-metric-weight)] text-foreground">{weights[0].name}</p>
                                <p className="ds-type-metadata text-muted-foreground mt-1">Receberá 100% da meta</p>
                            </div>
                            <div className="bg-success-subtle border border-success/30 rounded-[var(--radius-panel)] px-6 py-3 w-full">
                                <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wider">Meta Mensal</p>
                                <p className="ds-type-metric font-[var(--ds-type-metric-weight)] text-success-readable mt-0.5">{formatCurrency(revenueGoal)}</p>
                                <p className="ds-type-metadata text-muted-foreground">Anual: <span className="font-[var(--ds-type-control-weight)] text-foreground">{formatCurrency(revenueGoal * 12)}</span></p>
                            </div>
                        </div>
                    )}

                    {/* Case: Multiple users */}
                    {users.length > 1 && (
                        <>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <p className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-primary opacity-70" /> Vendedores do Time
                                </p>
                                <button
                                    onClick={handleEqualDistribution}
                                    className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-[var(--radius-panel)] border border-primary/20 transition-all active:scale-95"
                                >
                                    <Zap className="h-3 w-3" /> Distribuição Igual
                                </button>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {weights.map((seller) => {
                                    const sellerMonthly = (revenueGoal * seller.weight) / 100;
                                    return (
                                        <div key={seller.user_id} className="bg-muted/40 rounded-[var(--radius-panel)] p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="h-9 w-9 rounded-[var(--radius-panel)] bg-primary text-primary-foreground flex items-center justify-center ds-type-metadata font-[var(--ds-type-metric-weight)] shadow-control-ui flex-shrink-0">
                                                    {seller.avatar || seller.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-[var(--ds-type-control-weight)] text-foreground ds-type-body truncate">{seller.name}</p>
                                                    <p className="ds-type-metadata text-muted-foreground">
                                                        Mensal: <span className="font-[var(--ds-type-control-weight)] text-success-readable">{formatCurrency(sellerMonthly)}</span>
                                                        {' · '}
                                                        Anual: <span className="font-[var(--ds-type-control-weight)] text-foreground">{formatCurrency(sellerMonthly * 12)}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                        className="w-16 bg-background border border-border rounded-[var(--radius-panel)] px-2 py-1.5 ds-type-body font-[var(--ds-type-control-weight)] text-right focus:ring-1 focus:ring-primary outline-none"
                                                        value={seller.weight}
                                                        onChange={(e) => handleWeightChange(seller.user_id, e.target.value)}
                                                    />
                                                    <span className="ds-type-body text-muted-foreground font-[var(--ds-type-control-weight)]">%</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.min(seller.weight, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total indicator */}
                            <div className={`flex items-center justify-between rounded-[var(--radius-panel)] p-4 ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest border-2 transition-all shadow-control-ui ${isValid
                                ? 'bg-success-subtle border-success/20 text-success-readable'
                                : 'bg-destructive-subtle border-destructive/20 text-destructive-readable'
                                }`}>
                                <div className="flex items-center gap-2.5">
                                    {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                    <span>{isValid ? 'Total da Distribuição Correto' : `Soma: ${totalWeight}% — Ajuste para 100%`}</span>
                                </div>
                                <span className="ds-type-body font-[var(--ds-type-metric-weight)]">{totalWeight}%</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {users.length > 0 && (
                    <div className="flex gap-4 p-8 pt-0">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-[var(--radius-panel)] border border-border ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 shadow-control-ui"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={users.length > 1 && !isValid}
                            className="flex-1 h-12 rounded-[var(--radius-panel)] bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:scale-100 text-primary-foreground ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest transition-all active:scale-95 shadow-card-ui flex items-center justify-center gap-2"
                        >
                            {users.length === 1 ? 'Aplicar Meta' : <><Zap className="h-3.5 w-3.5" /> Confirmar Distribuição</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
