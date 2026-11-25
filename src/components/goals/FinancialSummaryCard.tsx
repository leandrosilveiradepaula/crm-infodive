import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Minus, Divide, ArrowRight, FileText } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil } from '@/utils/format';

interface FinancialSummaryCardProps {
    grossRevenue: number;
    rampUpLoss?: number;
    projectedGrossRevenue?: number;
    variableCostsMatches: number; // Percent
    variableCostsValue: number;
    grossMargin: number;
    fixedCosts: number;
    netProfit: number;
    netMargin: number;
}

export const FinancialSummaryCard = ({
    grossRevenue,
    rampUpLoss = 0,
    projectedGrossRevenue = 0,
    variableCostsMatches,
    variableCostsValue,
    grossMargin,
    fixedCosts,
    netProfit,
    netMargin
}: FinancialSummaryCardProps) => {

    const [isAnnual, setIsAnnual] = React.useState(false);

    const multiplier = isAnnual ? 12 : 1;

    const formatValue = (val: number) =>
        formatCurrencyUtil(val * multiplier);

    const formatPercent = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(val / 100);

    return (
        <div className="bg-card border border-border rounded-[var(--radius-panel)] p-5 shadow-overlay-ui space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Demonstrativo de Resultado (DRE)
                </h3>
                <div className="flex bg-muted/40 p-1 rounded-[var(--radius-panel)] border border-border h-9 items-center translate-y-[-2px]">
                    <button
                        type="button" aria-pressed={!isAnnual} onClick={() => setIsAnnual(false)}
                        className={`ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest px-3 py-1.5 rounded-[var(--radius-panel)] transition-all h-full flex items-center justify-center ${!isAnnual ? 'bg-primary text-primary-foreground shadow-card-ui' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Mensal
                    </button>
                    <button
                        type="button" aria-pressed={isAnnual} onClick={() => setIsAnnual(true)}
                        className={`ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest px-3 py-1.5 rounded-[var(--radius-panel)] transition-all h-full flex items-center justify-center ${isAnnual ? 'bg-primary text-primary-foreground shadow-card-ui' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            {/* Gross Revenue */}
            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-info-subtle rounded-[var(--radius-panel)] text-primary">
                        <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wider">Faturamento Bruto {isAnnual && '(Ano)'}</p>
                        <p className="text-[var(--ds-type-legacy-base-size)] font-[var(--ds-type-metric-weight)] text-foreground">{formatValue(grossRevenue)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-primary bg-info-subtle px-1.5 py-0.5 rounded">100%</span>
            </div>

            {/* Ramp Up Loss (if any) */}
            {rampUpLoss > 0 && (
                <>
                    <div className="flex justify-between items-center group relative">
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border -z-10"></div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-destructive-subtle rounded-[var(--radius-panel)] text-destructive-readable">
                                <Minus className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wider">(-) Ineficiência Ramp-up</p>
                                <p className="ds-type-body font-[var(--ds-type-control-weight)] text-destructive-readable">{formatValue(rampUpLoss)}</p>
                            </div>
                        </div>
                        <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                        <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-destructive-readable bg-destructive-subtle px-1.5 py-0.5 rounded">
                            {formatPercent(rampUpLoss / grossRevenue * 100 || 0)}
                        </span>
                    </div>

                    <div className="pl-10 flex justify-between items-center bg-muted/20 p-2.5 rounded-[var(--radius-panel)] border border-border/10">
                        <div>
                            <p className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest ml-1">= Faturamento Projetado</p>
                            <p className="ds-type-body font-[var(--ds-type-metric-weight)] text-foreground ml-1">{formatValue(projectedGrossRevenue)}</p>
                        </div>
                    </div>
                </>
            )}

            {/* Variable Costs */}
            <div className="flex justify-between items-center group relative">
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border -z-10"></div>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-warning-subtle rounded-[var(--radius-panel)] text-warning-readable">
                        <Minus className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wider">(-) Custos Variáveis</p>
                        <p className="ds-type-body font-[var(--ds-type-control-weight)] text-foreground">{formatValue(variableCostsValue)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-warning-readable bg-warning-subtle px-1.5 py-0.5 rounded">
                    {formatPercent(variableCostsMatches)}
                </span>
            </div>

            {/* Gross Margin */}
            <div className="pl-12 flex justify-between items-center bg-muted/20 p-2.5 rounded-[var(--radius-panel)] border border-border/10">
                <div>
                    <p className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest ml-1">= Margem de Contribuição</p>
                    <p className="ds-type-body font-[var(--ds-type-metric-weight)] text-foreground ml-1">{formatValue(grossMargin)}</p>
                </div>
                <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground mr-1">
                    {formatPercent((grossMargin / grossRevenue) * 100 || 0)}
                </span>
            </div>

            {/* Fixed Costs */}
            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-destructive-subtle rounded-[var(--radius-panel)] text-destructive-readable">
                        <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wider">(-) Custos Fixos {isAnnual && '(Ano)'}</p>
                        <p className="ds-type-body font-[var(--ds-type-control-weight)] text-foreground">{formatValue(fixedCosts)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="ds-type-metadata font-[var(--ds-type-control-weight)] text-destructive-readable bg-destructive-subtle px-1.5 py-0.5 rounded">
                    {formatPercent((fixedCosts / grossRevenue) * 100 || 0)}
                </span>
            </div>

            {/* Net Profit */}
            <div className={`p-4 rounded-[var(--radius-panel)] border-2 ${netProfit >= 0 ? 'bg-success-subtle border-success/20' : 'bg-destructive-subtle border-destructive/20'} transition-all`}>
                <div className="flex justify-between items-center mb-1">
                    <p className={`ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest ${netProfit >= 0 ? 'text-success-readable' : 'text-destructive-readable'}`}>
                        = Lucro Líquido (EBITDA) {isAnnual && '(Ano)'}
                    </p>
                    <span className={`ds-type-metadata font-[var(--ds-type-metric-weight)] px-1.5 py-0.5 rounded ${netProfit >= 0 ? 'bg-success-subtle text-success-readable' : 'bg-destructive-subtle text-destructive-readable'}`}>
                        {formatPercent(netMargin)}
                    </span>
                </div>
                <div className="flex items-end justify-between">
                    <h2 className={`ds-type-metric font-[var(--ds-type-metric-weight)] ${netProfit >= 0 ? 'text-success-readable' : 'text-destructive-readable'}`}>
                        {formatValue(netProfit)}
                    </h2>
                </div>
            </div>
        </div>
    );
};

