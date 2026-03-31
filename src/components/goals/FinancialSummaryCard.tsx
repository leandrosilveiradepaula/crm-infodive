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
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Demonstrativo de Resultado (DRE)
                </h3>
                <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setIsAnnual(false)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${!isAnnual ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setIsAnnual(true)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${isAnnual ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            {/* Gross Revenue */}
            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                        <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Faturamento Bruto {isAnnual && '(Ano)'}</p>
                        <p className="text-base font-black text-foreground">{formatValue(grossRevenue)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">100%</span>
            </div>

            {/* Ramp Up Loss (if any) */}
            {rampUpLoss > 0 && (
                <>
                    <div className="flex justify-between items-center group relative opacity-80">
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border -z-10"></div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                                <Minus className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">(-) Ineficiência Ramp-up</p>
                                <p className="text-sm font-bold text-red-400">{formatValue(rampUpLoss)}</p>
                            </div>
                        </div>
                        <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            {formatPercent(rampUpLoss / grossRevenue * 100 || 0)}
                        </span>
                    </div>

                    <div className="pl-10 flex justify-between items-center bg-muted/10 p-2 rounded-xl border border-border/10">
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">= Faturamento Projetado</p>
                            <p className="text-sm font-black text-foreground">{formatValue(projectedGrossRevenue)}</p>
                        </div>
                    </div>
                </>
            )}

            {/* Variable Costs */}
            <div className="flex justify-between items-center group relative">
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border -z-10"></div>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500">
                        <Minus className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">(-) Custos Variáveis</p>
                        <p className="text-sm font-bold text-foreground">{formatValue(variableCostsValue)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    {formatPercent(variableCostsMatches)}
                </span>
            </div>

            {/* Gross Margin */}
            <div className="pl-12 flex justify-between items-center bg-muted/10 p-2 rounded-xl border border-border/10">
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">= Margem de Contribuição</p>
                    <p className="text-sm font-black text-foreground">{formatValue(grossMargin)}</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                    {formatPercent((grossMargin / grossRevenue) * 100 || 0)}
                </span>
            </div>

            {/* Fixed Costs */}
            <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500">
                        <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">(-) Custos Fixos {isAnnual && '(Ano)'}</p>
                        <p className="text-sm font-bold text-foreground">{formatValue(fixedCosts)}</p>
                    </div>
                </div>
                <div className="h-px flex-1 bg-border mx-3 border-dashed border-b border-border/50"></div>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                    {formatPercent((fixedCosts / grossRevenue) * 100 || 0)}
                </span>
            </div>

            {/* Net Profit */}
            <div className={`p-4 rounded-2xl border-2 ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} transition-all`}>
                <div className="flex justify-between items-center mb-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        = Lucro Líquido (EBITDA) {isAnnual && '(Ano)'}
                    </p>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${netProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {formatPercent(netMargin)}
                    </span>
                </div>
                <div className="flex items-end justify-between">
                    <h2 className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatValue(netProfit)}
                    </h2>
                </div>
            </div>
        </div>
    );
};

