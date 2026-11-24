'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';

interface SimulatorUser {
    id: string;
    name: string;
    commission_rules: any;
}

interface CommissionSimulatorProps {
    user: SimulatorUser;
    defaultMargin?: number;
    onClose: () => void;
}

export const CommissionSimulator = ({ user, defaultMargin = 50, onClose }: CommissionSimulatorProps) => {
    const [projectedSales, setProjectedSales] = useState<string>('');
    const [marginPercent, setMarginPercent] = useState<string>(defaultMargin.toString());
    const [selectedProductType, setSelectedProductType] = useState<'hardware' | 'software' | 'services'>('hardware');
    const [isNewClient, setIsNewClient] = useState(false);

    // Derived values
    const effectiveRate = useMemo(() => {
        if (!user.commission_rules) return 0;
        const rules = user.commission_rules;

        const productRules = rules[selectedProductType];

        // If no specific rule for this product, fallback to 0
        if (!productRules) return 0;

        let rate = Number(productRules.base || 0);

        if (isNewClient) {
            rate += Number(productRules.new || 0); // Add New Client Bonus
        }

        return rate;
    }, [user.commission_rules, selectedProductType, isNewClient]);

    const simulatedCommission = useMemo(() => {
        const sales = Number(projectedSales);
        const margin = Number(marginPercent);

        if (isNaN(sales) || sales <= 0) return 0;
        if (isNaN(margin) || margin <= 0) return 0;

        // Commission is configured as X% of the Profit (Net Margin Amount)
        // Profit = Sales * (Margin / 100)
        // Commission = Profit * (Rate / 100)
        const profit = sales * (margin / 100);
        return profit * (effectiveRate / 100);
    }, [projectedSales, marginPercent, effectiveRate]);

    const productTypes = [
        { key: 'hardware', label: 'Hardware', tone: 'primary' },
        { key: 'software', label: 'Software', tone: 'info' },
        { key: 'services', label: 'Serviços', tone: 'warning' },
    ] as const;
    const productToneClasses = {
        primary: 'bg-primary/10 border-primary/20 text-primary',
        info: 'bg-info-subtle border-info/20 text-foreground',
        warning: 'bg-warning-subtle border-warning/20 text-warning-readable',
    } as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ds-overlay-backdrop)] backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-[var(--radius-panel)] w-full max-w-md shadow-overlay-ui relative flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-[var(--ds-type-legacy-prominent-size)] font-[var(--ds-type-metric-weight)] text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-success-readable" />
                            Simulador de Comissões
                        </h3>
                        <p className="ds-type-metadata text-muted-foreground mt-1">Simulando para <span className="text-foreground font-[var(--ds-type-control-weight)]">{user.name}</span></p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fechar simulador de comissões"
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 overflow-y-auto">

                    {/* Product Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                        {productTypes.map((type) => (
                            <button
                                key={type.key}
                                type="button"
                                aria-pressed={selectedProductType === type.key}
                                onClick={() => setSelectedProductType(type.key)}
                                className={`py-2 px-1 rounded-[var(--radius-panel)] ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-wider border-2 transition-all ${selectedProductType === type.key
                                    ? productToneClasses[type.tone]
                                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    {/* New Client Toggle */}
                    <label className={`flex items-center justify-between p-3 rounded-[var(--radius-panel)] border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ring ${isNewClient
                        ? 'bg-success-subtle border-success/20'
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                        }`}>
                        <div className="flex flex-col">
                            <span className={`ds-type-metadata font-[var(--ds-type-control-weight)] ${isNewClient ? 'text-success-readable' : 'text-muted-foreground'}`}>Cliente Novo?</span>
                            <span className="ds-type-metadata text-muted-foreground/80">Aplica bônus se configurado</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isNewClient ? 'bg-success' : 'bg-muted-foreground/30'}`}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isNewClient}
                                onChange={() => setIsNewClient(!isNewClient)}
                            />
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-background transition-all transform ${isNewClient ? 'left-6' : 'left-1'}`} />
                        </div>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="block ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest">
                                Se eu vender...
                            </label>
                            <ThemeCurrencyInput
                                autoFocus
                                className="w-full pl-10 pr-4 py-6 h-auto bg-muted/30 border border-border rounded-[var(--radius-panel)] ds-type-metric font-[var(--ds-type-metric-weight)] text-foreground focus:ring-2 focus:ring-success/20 outline-none transition-all placeholder:text-muted-foreground/50 text-left"
                                placeholder="0,00"
                                value={projectedSales || 0}
                                onChange={(e) => setProjectedSales(e.target.value)}
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="block ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest">
                                Com Margem de...
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-4 pr-10 py-3 bg-muted/30 border border-border rounded-[var(--radius-panel)] ds-type-section-title font-[var(--ds-type-control-weight)] text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={marginPercent}
                                    onChange={(e) => setMarginPercent(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-[var(--ds-type-control-weight)]">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-end">
                            <label className="block ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest">
                                Vou ganhar de comissão:
                            </label>
                            <div className="flex items-center gap-2">
                                {isNewClient && effectiveRate > 0 && (
                                    <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-success-readable bg-success-subtle px-2 py-1 rounded-[var(--radius-panel)]">
                                        + Bônus
                                    </span>
                                )}
                                <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-foreground bg-muted w-fit px-2 py-1 rounded-[var(--radius-panel)]">
                                    Taxa: {effectiveRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-success-subtle border border-success/20 rounded-[var(--radius-panel)] p-6 text-center group relative overflow-hidden transition-all duration-300 hover:bg-success-subtle">
                            <div className="absolute inset-0 bg-success-subtle translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <div className="relative z-10 text-[var(--ds-type-legacy-hero-size)] font-[var(--ds-type-metric-weight)] text-success-readable drop-shadow-control-ui">
                                {simulatedCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <p className="relative z-10 ds-type-metadata text-success-readable mt-2 font-[var(--ds-type-control-weight)] uppercase tracking-wider">
                                {Number(marginPercent)}% de {Number(projectedSales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} = Lucro {((Number(projectedSales) * Number(marginPercent)) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-[var(--radius-panel)] border border-primary/10 min-h-[96px] items-center">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="ds-type-metadata text-primary/80 leading-relaxed">
                            O cálculo aplica a taxa específica ({effectiveRate.toFixed(1)}%) para <strong>{selectedProductType === 'hardware' ? 'Hardware' : selectedProductType === 'software' ? 'Software' : 'Serviços'}</strong> {isNewClient && '+ Bônus de Cliente Novo'} sobre a margem de lucro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
