'use client';

import { useState, useMemo, useEffect } from 'react';
import { Scenario, UserGoalData } from '@/types/goal';
import { saveScenario, deleteScenario, applyScenarioToGoals } from '@/app/(dashboard)/goals/actions';
import { ProfitabilityChart } from '../ProfitabilityChart';
import { SeasonalityChart } from '../SeasonalityChart';
import { FinancialSummaryCard } from '../FinancialSummaryCard';
import { DistributionModal } from '../DistributionModal';
import { Save, Trash2, FolderOpen, Plus, X, Users, Target, ArrowRight, Upload, TrendingUp, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { toast } from 'sonner';
import { FilterBar } from '@/components/layout/FilterBar';

interface PlanningTabProps {
    scenarios: Scenario[];
    currentUserId: string;
    users: UserGoalData[];
}

export function PlanningTab({ scenarios, currentUserId, users }: PlanningTabProps) {
    const [distributionModal, setDistributionModal] = useState<{ isOpen: boolean; scenario: Scenario | null }>({
        isOpen: false,
        scenario: null
    });
    // --- 1. Staffing Module ---
    const [staff, setStaff] = useState<{ id: string; role: string; salary: number; count: number; rampUp?: number }[]>([
        { id: '1', role: 'SDR / Pré-vendas', salary: 3500, count: 2, rampUp: 1 },
        { id: '2', role: 'Closer / Vendedor', salary: 6000, count: 3, rampUp: 3 },
        { id: '3', role: 'Gerente de Vendas', salary: 12000, count: 1, rampUp: 0 }
    ]);
    const [payrollTax, setPayrollTax] = useState<number>(70); // Default 70% tax/benefits

    // --- 2. Fixed Costs Module ---
    const [fixedCostItems, setFixedCostItems] = useState<{ id: string; name: string; value: number }[]>([
        { id: '1', name: 'Aluguel & Condomínio', value: 4500 },
        { id: '2', name: 'Software & Licenças', value: 3500 },
        { id: '3', name: 'Marketing (Fixo)', value: 5000 },
        { id: '4', name: 'Contabilidade & Jurídico', value: 1500 }
    ]);

    // --- 3. Variable Costs Module ---
    const [variableCostItems, setVariableCostItems] = useState<{ id: string; name: string; value: number }[]>([
        { id: '1', name: 'Impostos (Simples/Presumido)', value: 12.5 },
        { id: '2', name: 'Comissão (Média)', value: 5.0 },
        { id: '3', name: 'Taxa Adm. Cartão/Boleto', value: 1.5 }
    ]);

    // --- 4. Revenue & Goals Module ---
    const [goalMode, setGoalMode] = useState<'revenue' | 'profit_absolute' | 'profit_percent'>('revenue');
    const [goalValue, setGoalValue] = useState<number | string>(150000);

    // Legacy state support (if needed, but we'll try to unify)
    const [desiredMargin, setDesiredMargin] = useState<number>(20); // Kept for scenario compatibility if needed

    const [avgTicket, setAvgTicket] = useState<number | string>(5000);
    const [conversionRate, setConversionRate] = useState<number | string>(15); // % Opportunity to Deal

    // --- Scenario State ---
    const [scenarioName, setScenarioName] = useState('');

    // --- Seasonality State ---
    const [qPct, setQPct] = useState<{ q1: number; q2: number; q3: number; q4: number }>({ q1: 25, q2: 25, q3: 25, q4: 25 });

    // --- Comparison State ---
    const [compareScenarioId, setCompareScenarioId] = useState<string | null>(null);

    // --- UI State (Accordion & Tabs) ---
    const [expandedSection, setExpandedSection] = useState<'goals' | 'staff' | 'costs'>('goals');
    const [activeChartTab, setActiveChartTab] = useState<'profitability' | 'seasonality'>('profitability');
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);

    const comparisonData = useMemo(() => {
        if (!compareScenarioId) return undefined;
        const comp = scenarios.find(s => s.id === compareScenarioId);
        if (!comp) return undefined;

        const compVariablePercent = comp.variable_costs.reduce((acc, i) => acc + (i.value || 0), 0);
        const compPayroll = comp.staff?.reduce((acc, item) => acc + (item.salary * item.count), 0) || 0;
        const compPayrollTax = comp.payroll_tax ?? 70;
        const compTotalPayrollWithTaxes = compPayroll * (1 + (compPayrollTax / 100));
        const compTotalOpEx = comp.fixed_costs.reduce((acc, i) => acc + (i.value || 0), 0);
        const compEffectiveFixedCosts = compTotalOpEx + compTotalPayrollWithTaxes;

        return {
            name: comp.name,
            fixedCosts: compEffectiveFixedCosts * 12,
            variableCostPercent: compVariablePercent,
            targetRevenue: (comp.revenue_goal || 0) * 12
        };
    }, [compareScenarioId, scenarios]);

    // --- CALCULATIONS ---

    // A. Staffing Costs
    const totalPayroll = staff.reduce((acc, item) => acc + (item.salary * item.count), 0);
    const totalPayrollWithTaxes = totalPayroll * (1 + (payrollTax / 100));

    // B. Total Fixed Costs (Payroll + OpEx)
    const totalOpEx = fixedCostItems.reduce((acc, i) => acc + (i.value || 0), 0);
    const effectiveFixedCosts = totalOpEx + totalPayrollWithTaxes;

    // C. Variable Costs (%)
    const totalVariablePercent = variableCostItems.reduce((acc, i) => acc + (i.value || 0), 0);

    // D. Revenue & P&L Simulation (Dynamic based on Goal Mode)
    let monthlyRevenueGoal = 0;
    const safeGoalValue = Number(goalValue) || 0;
    const safeAvgTicket = Number(avgTicket) || 0;
    const safeConversionRate = Number(conversionRate) || 0;

    if (goalMode === 'revenue') {
        monthlyRevenueGoal = safeGoalValue;
    } else if (goalMode === 'profit_absolute') {
        // Revenue = (Fixed + DesiredProfit) / (1 - Var%)
        const contributionMargin = 1 - (totalVariablePercent / 100);
        monthlyRevenueGoal = contributionMargin > 0 ? (effectiveFixedCosts + safeGoalValue) / contributionMargin : 0;
    } else if (goalMode === 'profit_percent') {
        // Revenue = Fixed / (1 - Var% - TargetProfit%)
        const denominator = 1 - (totalVariablePercent / 100) - (safeGoalValue / 100);
        monthlyRevenueGoal = denominator > 0 ? effectiveFixedCosts / denominator : 0;
    }

    const totalHeadcount = staff.reduce((acc, s) => acc + s.count, 0);
    const avgMonthlyQuotaPerSeller = totalHeadcount > 0 ? monthlyRevenueGoal / totalHeadcount : 0;

    // Calcular impacto financeiro do Ramp-up (meses perdidos de cota)
    // Se Ramp = 3 meses, o vendedor perde 1.5 meses de cota no ano.
    const totalRampUpLostMonths = staff.reduce((acc, item) => acc + ((item.rampUp || 0) / 2) * item.count, 0);
    const annualRampUpLoss = totalRampUpLostMonths * avgMonthlyQuotaPerSeller;
    const monthlyRampUpLoss = annualRampUpLoss / 12;

    const grossRevenue = monthlyRevenueGoal;
    const projectedGrossRevenue = grossRevenue - monthlyRampUpLoss;
    const variableCostsValue = projectedGrossRevenue * (totalVariablePercent / 100);
    const grossMargin = projectedGrossRevenue - variableCostsValue;
    const netProfit = grossMargin - effectiveFixedCosts;
    const netMargin = projectedGrossRevenue > 0 ? (netProfit / projectedGrossRevenue) * 100 : 0;

    // E. Reverse Funnel
    const requiredDeals = Math.ceil(monthlyRevenueGoal / (safeAvgTicket || 1));
    const requiredOpportunities = Math.ceil(requiredDeals / ((safeConversionRate || 1) / 100));

    // F. Break Even
    const contributionMarginRatio = 1 - (totalVariablePercent / 100);
    const breakEvenPoint = contributionMarginRatio > 0 ? effectiveFixedCosts / contributionMarginRatio : 0;


    // --- HANDLERS ---
    const handleAddStaff = () => {
        setStaff([...staff, { id: Date.now().toString(), role: 'Novo Cargo', salary: 0, count: 1, rampUp: 0 }]);
    };

    const handleRemoveStaff = (id: string) => {
        setStaff(staff.filter(s => s.id !== id));
    };

    const handleUpdateStaff = (id: string, field: keyof typeof staff[0], value: any) => {
        setStaff(staff.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (!scenarioName.trim()) return toast.error('Digite um nome para o cenário.');

        const result = await saveScenario({
            name: scenarioName,
            fixed_costs: fixedCostItems,
            variable_costs: variableCostItems,
            desired_margin: desiredMargin,
            headcount: staff.reduce((acc, s) => acc + s.count, 0),
            staff: staff.map(({ role, salary, count, rampUp }) => ({ role, salary, count, rampUp })),
            quarterly_percentages: qPct,
            payroll_tax: payrollTax,
            revenue_goal: monthlyRevenueGoal, // Save the CALCULATED revenue for distribution
            input_goal_value: Number(goalValue), // Save input for UI restoration
            goal_mode: goalMode,
            user_id: currentUserId
        });

        if (result.success) {
            setScenarioName('');
            toast.success('Cenário salvo com sucesso!');
        } else {
            toast.error('Erro ao salvar: ' + result.error);
        }
    };

    const handleLoadScenario = (scenarioId: string) => {
        const s = scenarios.find(i => i.id === scenarioId);
        if (s) {
            setFixedCostItems(s.fixed_costs);
            setVariableCostItems(s.variable_costs);
            setDesiredMargin(s.desired_margin);

            if (s.staff && s.staff.length > 0) {
                setStaff(s.staff.map((st, idx) => ({ ...st, id: idx.toString(), rampUp: st.rampUp || 0 })));
            } else {
                setStaff([{ id: '1', role: 'Vendedores (Misto)', salary: 5000, count: s.headcount, rampUp: 0 }]);
            }
            if (s.payroll_tax !== undefined) setPayrollTax(s.payroll_tax);

            if (s.goal_mode !== undefined) setGoalMode(s.goal_mode);

            if (s.input_goal_value !== undefined) {
                setGoalValue(s.input_goal_value);
            } else if (s.revenue_goal !== undefined) {
                setGoalValue(s.revenue_goal);
            }

            if (s.quarterly_percentages) {
                setQPct(s.quarterly_percentages);
            } else {
                setQPct({ q1: 25, q2: 25, q3: 25, q4: 25 });
            }

            toast.success(`Cenário "${s.name}" carregado!`);
        }
    };

    const handleApplyToGoals = (scenario: Scenario) => {
        setDistributionModal({ isOpen: true, scenario });
    };

    const handleConfirmDistribution = async (weights: { user_id: string; weight: number }[]) => {
        if (!distributionModal.scenario) return;
        setDistributionModal({ isOpen: false, scenario: null });
        const toastId = toast.loading('Aplicando metas...');
        try {
            const result = await applyScenarioToGoals(distributionModal.scenario.id, weights);
            if (result.success) {
                toast.success('Metas distribuídas com sucesso!', { id: toastId });
            } else {
                toast.error('Erro: ' + result.error, { id: toastId });
            }
        } catch (err: any) {
            toast.error('Erro inesperado: ' + err.message, { id: toastId });
        }
    };

    return (
        <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DistributionModal
                isOpen={distributionModal.isOpen}
                onClose={() => setDistributionModal({ isOpen: false, scenario: null })}
                onConfirm={handleConfirmDistribution}
                users={users}
                revenueGoal={distributionModal.scenario?.revenue_goal ?? 0}
                scenarioName={distributionModal.scenario?.name ?? ''}
            />

            {/* --- TOP ACTIONS BAR --- */}
            <FilterBar>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                    <div>
                        <h2 className="text-base font-black text-foreground uppercase tracking-tight">
                            Planejamento de Cenários Financeiros
                        </h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest leading-none mt-1">
                            Simule equipe, custos e rentabilidade do negócio
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsScenarioModalOpen(true)}
                            className="bg-muted/40 hover:bg-muted/60 text-foreground px-5 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-border flex items-center gap-2 shadow-sm"
                        >
                            <FolderOpen className="h-3.5 w-3.5 text-primary" /> Meus Cenários ({scenarios.length})
                        </button>
                        <button
                            onClick={() => setIsScenarioModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-5 h-11 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Save className="h-3.5 w-3.5" /> Salvar Cenário
                        </button>
                    </div>
                </div>
            </FilterBar>

            {/* --- LEFT COLUMN: INPUTS (Accordion Style) --- */}
            <div className="col-span-12 lg:col-span-5 space-y-4">

                {/* --- ACCORDION 1: Metas & Sazonalidade --- */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'goals' ? 'goals' : 'goals')}
                        className={`w-full flex justify-between items-center px-6 py-4 focus:outline-none transition-colors ${expandedSection === 'goals' ? 'bg-muted/10' : 'hover:bg-muted/30'}`}
                    >
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2.5">
                            <Target className="h-4 w-4 text-primary opacity-80" />
                            1. Metas e Sazonalidade
                        </h3>
                        {expandedSection === 'goals' ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
                    </button>

                    {expandedSection === 'goals' && (
                        <div className="p-6 pt-2 border-t border-border/50 space-y-6 animate-in slide-in-from-top-2 duration-300">
                            {/* Metas & Conversão */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest block mb-2 px-1">
                                        Definir Meta Por:
                                    </label>
                                    <div className="flex bg-muted/30 p-1 rounded-2xl border border-border h-11 items-center">
                                        <button
                                            onClick={() => setGoalMode('revenue')}
                                            className={`flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all h-full flex items-center justify-center ${goalMode === 'revenue' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            Faturamento
                                        </button>
                                        <button
                                            onClick={() => setGoalMode('profit_absolute')}
                                            className={`flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all h-full flex items-center justify-center ${goalMode === 'profit_absolute' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Lucro Absoluto (R$)"
                                        >
                                            Lucro (R$)
                                        </button>
                                        <button
                                            onClick={() => setGoalMode('profit_percent')}
                                            className={`flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all h-full flex items-center justify-center ${goalMode === 'profit_percent' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                            title="Margem de Lucro (%)"
                                        >
                                            Margem (%)
                                        </button>
                                    </div>
                                </div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest block mb-2 px-1">
                                        {goalMode === 'revenue' ? 'Meta Faturamento (Mensal)' : goalMode === 'profit_absolute' ? 'Lucro Desejado (Mensal)' : 'Margem Alvo'}
                                    </label>
                                    <div className="relative group">
                                        {goalMode !== 'profit_percent' ? (
                                            <ThemeCurrencyInput
                                                className="w-full bg-muted/30 border border-border rounded-2xl text-sm font-black text-foreground focus:ring-1 focus:ring-primary outline-none h-11 pl-9 text-left transition-all"
                                                value={goalValue || 0}
                                                onChange={(e) => setGoalValue(e.target.value)}
                                            />
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    className="w-full bg-muted/30 border border-border rounded-2xl text-sm font-black text-foreground focus:ring-1 focus:ring-primary outline-none px-4 h-11 transition-all text-center"
                                                    value={goalValue}
                                                    onChange={(e) => setGoalValue(e.target.value)}
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground uppercase opacity-50">%</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest block mb-2 px-1">Ticket Médio</label>
                                    <ThemeCurrencyInput
                                        className="w-full bg-muted/30 border border-border rounded-2xl pl-9 pr-4 h-11 text-sm font-black text-foreground focus:ring-1 focus:ring-primary outline-none text-left transition-all"
                                        value={avgTicket || 0}
                                        onChange={(e) => setAvgTicket(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest block mb-2 px-1">Conversão (Conv.)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            className="w-full bg-muted/30 border border-border rounded-2xl px-4 h-11 text-sm font-black text-foreground focus:ring-1 focus:ring-primary outline-none transition-all text-center"
                                            value={conversionRate}
                                            onChange={(e) => setConversionRate(e.target.value)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground uppercase opacity-50">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sazonalidade (Curva do Ano) */}
                            <div className="pt-4 border-t border-border/50">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                    Sazonalidade Trimestral (Distribuição de Metas)
                                </h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {['1', '2', '3', '4'].map((q) => {
                                        const key = `q${q}` as keyof typeof qPct;
                                        return (
                                            <div key={q} className="space-y-1">
                                                <label className="text-xs uppercase font-bold text-muted-foreground block text-center">
                                                    Q{q} <span className="hidden sm:inline">- {q === '1' ? 'Jan-Mar' : q === '2' ? 'Abr-Jun' : q === '3' ? 'Jul-Set' : 'Out-Dez'}</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-background border border-border rounded-lg text-center text-sm font-bold focus:ring-1 focus:ring-primary outline-none py-1.5"
                                                        value={qPct[key]}
                                                        onChange={(e) => setQPct({ ...qPct, [key]: Number(e.target.value) })}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {Object.values(qPct).reduce((a, b) => a + b, 0) !== 100 && (
                                    <p className="text-xs font-bold text-red-500 mt-2 text-center bg-red-500/10 py-1 rounded">
                                        Pendente: A soma dos trimestres deve ser 100% (Atual: {Object.values(qPct).reduce((a, b) => a + b, 0)}%)
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ACCORDION 2: Staffing --- */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'staff' ? 'staff' : 'staff')}
                        className={`w-full flex justify-between items-center px-6 py-4 focus:outline-none transition-colors ${expandedSection === 'staff' ? 'bg-muted/10' : 'hover:bg-muted/30'}`}
                    >
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2.5">
                            <Users className="h-4 w-4 text-emerald-500 opacity-80" />
                            2. Equipe & Folha de Pagamento
                        </h3>
                        {expandedSection === 'staff' ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
                    </button>

                    {expandedSection === 'staff' && (
                        <div className="p-6 pt-2 border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-1">
                                    <span className="text-xs text-muted-foreground font-bold">Encargos:</span>
                                    <div className="relative w-12">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent text-right text-xs font-bold text-accent-foreground outline-none p-0 focus:ring-0 border-none"
                                            value={payrollTax}
                                            onChange={(e) => setPayrollTax(Number(e.target.value))}
                                        />
                                        <span className="absolute right-0 top-0 text-xs text-muted-foreground">%</span>
                                    </div>
                                </div>
                                <button onClick={handleAddStaff} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Adicionar Cargo
                                </button>
                            </div>

                            <div className="space-y-4">
                                {staff.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center group bg-muted/10 p-3 rounded-2xl border border-border/40 hover:border-border transition-all">
                                        <div className="col-span-4 translate-y-[2px]">
                                            <input
                                                className="w-full bg-transparent border-none text-sm font-black text-foreground focus:ring-0 outline-none pb-1"
                                                value={item.role}
                                                onChange={(e) => handleUpdateStaff(item.id, 'role', e.target.value)}
                                                placeholder="Cargo"
                                            />
                                            <div className="h-[1px] w-full bg-border group-focus-within:bg-primary transition-colors"></div>
                                        </div>
                                        <div className="col-span-3">
                                            <ThemeCurrencyInput
                                                className="w-full bg-muted/40 border border-border rounded-xl px-3 h-9 text-right text-xs font-black text-foreground focus:ring-1 focus:ring-primary outline-none pl-7 transition-all"
                                                value={item.salary}
                                                onChange={(e) => handleUpdateStaff(item.id, 'salary', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="text-xs font-black text-muted-foreground uppercase">x</span>
                                            <input
                                                type="number"
                                                className="w-full bg-muted/40 border border-border rounded-xl h-9 text-center text-xs font-black text-foreground focus:ring-1 focus:ring-primary outline-none transition-all"
                                                value={item.count}
                                                onChange={(e) => handleUpdateStaff(item.id, 'count', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-2 relative">
                                            <input
                                                type="number"
                                                className="w-full bg-orange-500/10 border border-orange-500/20 rounded-xl h-9 text-center text-xs font-black text-orange-600 focus:ring-1 focus:ring-orange-500 outline-none transition-all pr-4"
                                                value={item.rampUp || 0}
                                                onChange={(e) => handleUpdateStaff(item.id, 'rampUp', Number(e.target.value))}
                                                title="Meses de Ramp-up"
                                            />
                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-orange-600/50 uppercase">M</span>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => handleRemoveStaff(item.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-medium">Total com Encargos ({payrollTax}%)</span>
                                <span className="font-bold text-foreground">
                                    {totalPayrollWithTaxes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- ACCORDION 3: Custos Operacionais --- */}
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'costs' ? 'costs' : 'costs')}
                        className={`w-full flex justify-between items-center px-6 py-4 focus:outline-none transition-colors ${expandedSection === 'costs' ? 'bg-muted/10' : 'hover:bg-muted/30'}`}
                    >
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2.5">
                            <Target className="h-4 w-4 text-orange-500 opacity-80" />
                            3. Custos Operacionais (Fixos/Var)
                        </h3>
                        {expandedSection === 'costs' ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
                    </button>

                    {expandedSection === 'costs' && (
                        <div className="p-6 pt-2 border-t border-border/50 space-y-6 animate-in slide-in-from-top-2 duration-300">
                            {/* Fixed */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                        Custos Fixos Totais
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-emerald-500">
                                            {totalOpEx.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                        <button
                                            onClick={() => setFixedCostItems([...fixedCostItems, { id: Date.now().toString(), name: 'Novo Custo', value: 0 }])}
                                            className="p-1 hover:bg-muted rounded text-primary transition-colors"
                                            title="Adicionar Custo Fixo"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {fixedCostItems.map((item, idx) => (
                                        <div key={item.id} className="flex gap-2 text-xs group items-center">
                                            <input
                                                className="flex-1 bg-transparent border-b border-border/50 text-muted-foreground focus:text-foreground focus:border-primary outline-none py-1"
                                                value={item.name}
                                                onChange={(e) => {
                                                    const arr = [...fixedCostItems];
                                                    arr[idx].name = e.target.value;
                                                    setFixedCostItems(arr);
                                                }}
                                            />
                                            <div className="w-24">
                                                <ThemeCurrencyInput
                                                    className="w-full bg-transparent border-b border-t-0 border-r-0 border-l-0 border-border/50 rounded-none text-right font-medium focus:ring-0 focus:border-primary outline-none py-0.5 h-auto pl-6"
                                                    value={item.value}
                                                    onChange={(e) => {
                                                        const arr = [...fixedCostItems];
                                                        arr[idx].value = Number(e.target.value);
                                                        setFixedCostItems(arr);
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setFixedCostItems(fixedCostItems.filter((_, i) => i !== idx))}
                                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Variable */}
                            <div className="pt-4 border-t border-border/50">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                                        Descontos / Custos Variáveis
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-orange-500">
                                            {totalVariablePercent.toFixed(1)}%
                                        </span>
                                        <button
                                            onClick={() => setVariableCostItems([...variableCostItems, { id: Date.now().toString(), name: 'Novo Custo Var.', value: 0 }])}
                                            className="p-1 hover:bg-muted rounded text-primary transition-colors"
                                            title="Adicionar Custo Variável"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {variableCostItems.map((item, idx) => (
                                        <div key={item.id} className="flex gap-2 text-xs group items-center">
                                            <input
                                                className="flex-1 bg-transparent border-b border-border/50 text-muted-foreground focus:text-foreground focus:border-primary outline-none py-1"
                                                value={item.name}
                                                onChange={(e) => {
                                                    const arr = [...variableCostItems];
                                                    arr[idx].name = e.target.value;
                                                    setVariableCostItems(arr);
                                                }}
                                            />
                                            <div className="relative w-20">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-b border-border/50 text-right font-medium focus:border-primary outline-none py-1 pr-4"
                                                    value={item.value}
                                                    onChange={(e) => {
                                                        const arr = [...variableCostItems];
                                                        arr[idx].value = Number(e.target.value);
                                                        setVariableCostItems(arr);
                                                    }}
                                                />
                                                <span className="absolute right-0 top-1 text-muted-foreground text-xs">%</span>
                                            </div>
                                            <button
                                                onClick={() => setVariableCostItems(variableCostItems.filter((_, i) => i !== idx))}
                                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* --- RIGHT COLUMN: RESULTS & CHARTS (Sticky Sidebar) --- */}
            <div className="col-span-12 lg:col-span-7 space-y-6 lg:sticky lg:top-20 lg:self-start">

                <FinancialSummaryCard
                    grossRevenue={grossRevenue}
                    rampUpLoss={monthlyRampUpLoss}
                    projectedGrossRevenue={projectedGrossRevenue}
                    variableCostsMatches={totalVariablePercent}
                    variableCostsValue={variableCostsValue}
                    grossMargin={grossMargin}
                    fixedCosts={effectiveFixedCosts}
                    netProfit={netProfit}
                    netMargin={netMargin}
                />

                {/* 2. Reverse Funnel Calculator */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target className="h-32 w-32" />
                    </div>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">
                        Calculadora Reversa de Funil
                    </h3>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="text-center">
                            <p className="text-3xl font-black text-foreground">{requiredOpportunities}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Oportunidades</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-foreground">{Math.round(requiredDeals)}</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Fechamentos</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-emerald-500">
                                {monthlyRevenueGoal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })}
                            </p>
                            <p className="text-xs font-bold text-emerald-500/70 uppercase mt-1">Meta Alcançada</p>
                        </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Baseado em um ticket médio de {avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e conversão de {conversionRate}%.
                    </p>
                </div>

                {/* 3. Charts Area (Tabs) */}
                <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                    <div className="flex bg-muted/40 p-1 rounded-2xl border border-border mb-6 h-12 items-center">
                        <button
                            onClick={() => setActiveChartTab('profitability')}
                            className={`flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all h-full flex items-center justify-center ${activeChartTab === 'profitability' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Ponto de Equilíbrio (P&L)
                        </button>
                        <button
                            onClick={() => setActiveChartTab('seasonality')}
                            className={`flex-1 text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all h-full flex items-center justify-center ${activeChartTab === 'seasonality' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Curva de Sazonalidade
                        </button>
                    </div>

                    <div className="animate-in fade-in duration-300 min-h-[300px]">
                        {activeChartTab === 'profitability' ? (
                            <ProfitabilityChart
                                fixedCosts={effectiveFixedCosts * 12}
                                variableCostPercent={totalVariablePercent}
                                targetRevenue={monthlyRevenueGoal * 12}
                                breakEvenPoint={breakEvenPoint * 12}
                                comparison={comparisonData}
                            />
                        ) : (
                            <div className="h-[300px] w-full">
                                <SeasonalityChart
                                    yearlyRevenueGoal={monthlyRevenueGoal * 12}
                                    qPct={qPct}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SCENARIOS OVERLAY MODAL --- */}
                {isScenarioModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                                <div>
                                    <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                        <FolderOpen className="h-5 w-5 text-primary" /> Gerenciador de Cenários
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Grave uma premissa ou carregue históricos anteriores.</p>
                                </div>
                                <button onClick={() => setIsScenarioModalOpen(false)} className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1 bg-background/50">
                                {/* Save Action */}
                                <div className="bg-card border border-border rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm gap-4">
                                    <div>
                                        <h4 className="font-bold text-sm text-foreground">Salvar as configurações da tela</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Irá guardar Sazonalidade, Equipe, Múltiplos e Custos ativos.</p>
                                    </div>
                                    <div className="flex w-full md:w-auto gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nome Ex: 'Cenário Otimista'"
                                            className="bg-background border border-border rounded-lg px-4 py-2 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary outline-none flex-1 md:w-64"
                                            value={scenarioName}
                                            onChange={e => setScenarioName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && scenarioName.trim()) { handleSave(); setIsScenarioModalOpen(false); } }}
                                        />
                                        <button
                                            onClick={() => { handleSave(); setIsScenarioModalOpen(false); }}
                                            disabled={!scenarioName.trim()}
                                            className="bg-primary hover:bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Save className="h-4 w-4" /> Salvar
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <h4 className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-4">
                                    Seus Cenários Arquivados
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {scenarios.map(scenario => (
                                        <div key={scenario.id} className="bg-card hover:border-primary/50 border border-border rounded-xl p-5 transition-all group relative shadow-sm">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteScenario(scenario.id);
                                                }}
                                                className="absolute top-3 right-3 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-500/10"
                                                title="Excluir cenário"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCompareScenarioId(compareScenarioId === scenario.id ? null : scenario.id);
                                                    setIsScenarioModalOpen(false);
                                                }}
                                                className={`absolute top-3 right-10 p-1.5 transition-opacity rounded-md ${compareScenarioId === scenario.id ? 'text-primary bg-primary/10 opacity-100' : 'text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'}`}
                                                title={compareScenarioId === scenario.id ? 'Parar comparação visual' : 'Comparar no gráfico'}
                                            >
                                                {compareScenarioId === scenario.id ? <X className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                            </button>

                                            <div
                                                onClick={() => {
                                                    handleLoadScenario(scenario.id);
                                                    setIsScenarioModalOpen(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <h4 className="font-bold text-foreground text-sm mb-3 pr-16 truncate">{scenario.name}</h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg mb-4">
                                                    <div>
                                                        <span className="block text-xs uppercase font-bold text-muted-foreground/70">Equipe</span>
                                                        <span className="font-medium text-foreground">{scenario.headcount} staffs</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs uppercase font-bold text-muted-foreground/70">Margem alvo</span>
                                                        <span className="font-medium text-foreground">{scenario.desired_margin}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-muted-foreground font-medium">
                                                        Modificado em {new Date(scenario.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {scenario.revenue_goal ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsScenarioModalOpen(false);
                                                            handleApplyToGoals(scenario);
                                                        }}
                                                        className="w-full mt-4 flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 py-2 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Target className="h-3.5 w-3.5" /> Enviar Base p/ CRM
                                                    </button>
                                                ) : (
                                                    <div className="w-full mt-4 text-center text-xs text-muted-foreground italic bg-muted/30 py-2 rounded-lg border border-dashed border-border px-2">
                                                        Carregue e salve para integrar
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {scenarios.length === 0 && (
                                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                                            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                            <p className="text-muted-foreground text-sm font-bold">Base Vazia</p>
                                            <p className="text-muted-foreground text-xs mt-1 max-w-sm">Use o campo acima para imortalizar suas primeiras configurações de planejamento financeiro.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
