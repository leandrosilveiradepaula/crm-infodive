'use client';

import { Download, Filter, TrendingUp, DollarSign, Users, Target, Calendar, Loader2, Search } from 'lucide-react';
import { useReports, ReportPeriod } from '@/hooks/useReports';
import {
    ConversionFunnel,
    SalesPerformance,
    ProductAnalysis,
    RevenueForecast,
    LossReasonChart
} from '@/components/charts/ReportsCharts';
import { formatCompact, formatCurrency, formatPercentage } from '@/utils/analytics';
import { ThemeSelect, ThemeInput } from '@/components/ui/theme/ThemeComponents';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';

export function ReportsClientPage() {
    const {
        stats,
        mappedDeals,
        searchTerm,
        setSearchTerm,
        sellerFilter,
        setSellerFilter,
        statusFilter,
        setStatusFilter,
        billingFilter,
        setBillingFilter,
        sourceFilter,
        setSourceFilter,
        selectedYear,
        setSelectedYear,
        selectedQuarters,
        setSelectedQuarters,
        allSellers,
        allBillingTypes,
        allSources,
        loading
    } = useReports();

    const handleExportReport = () => {
        if (!stats) return;

        const csvContent = [
            ['Relatório de Vendas'],
            [`Gerado em: ${new Date().toLocaleDateString()}`],
            [''],
            ['Métricas Gerais'],
            ['Total em Vendas', stats.dealMetrics.totalValue],
            ['Tiquet Médio', stats.dealMetrics.avgDealSize],
            ['Taxa de Conversão', `${stats.dealMetrics.conversionRate}%`],
            ['Ciclo Médio (dias)', stats.dealMetrics.avgCycleTime],
            [''],
            ['Performance por Vendedor'],
            ['Vendedor', 'Vendas (R$)', 'Conversão (%)', 'Deals Ganhos'],
            ...stats.salesPerformance.map(s => [
                s.seller,
                s.totalRevenue,
                `${s.conversionRate}%`,
                s.dealsWon
            ]),
            [''],
            ['Top Produtos'],
            ['Produto', 'Quantidade', 'Receita'],
            ...stats.productMetrics.map(p => [
                p.productName,
                p.quantitySold,
                p.revenue
            ])
        ].map(e => e.join(';')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <PageHeader 
                title="Relatórios & Insights" 
                description="Análise detalhada de performance comercial"
            />

            {/* Nova Barra de Filtros (Padrão Pipeline) */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por oportunidade, empresa, produto, vendedor ou status..."
                        className="pl-11 w-full h-[38px] bg-muted/30 border-border focus:bg-background transition-all rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                    {/* Advanced Multi-Year Pill Selector */}
                    <div className="flex flex-col sm:flex-row gap-2 bg-muted/30 p-1 rounded-xl border border-border w-full sm:w-auto h-auto sm:h-[38px] items-center overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1 px-3 border-r border-border shrink-0 h-full">
                            <Calendar className="h-3.5 w-3.5 text-primary opacity-50" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none py-1 pl-1 pr-4"
                            >
                                {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <svg className="h-3 w-3 text-muted-foreground -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                        </div>

                        <div className="flex gap-1 items-center px-1">
                            <button
                                onClick={() => setSelectedQuarters([])}
                                className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${selectedQuarters.length === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                            >
                                Tempo Todo
                            </button>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                                const val = `${selectedYear}-${q}`;
                                const isSelected = selectedQuarters.includes(val);
                                return (
                                    <button
                                        key={q}
                                        onClick={() => {
                                            setSelectedQuarters(prev =>
                                                prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val].sort()
                                            );
                                        }}
                                        className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                    >
                                        {q}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border h-11">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none min-w-[80px]"
                        >
                            <option value="all">Todos</option>
                            <option value="qualification">Qualificação</option>
                            <option value="proposal">Proposta</option>
                            <option value="negotiation">Negociação</option>
                            <option value="won">Fechado Ganho</option>
                            <option value="lost">Fechado Perdido</option>
                        </select>
                    </div>

                    {/* Faturamento Pill */}
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border h-11">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Faturamento:</span>
                        <select
                            value={billingFilter}
                            onChange={(e) => setBillingFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none min-w-[80px]"
                        >
                            <option value="all">Todos</option>
                            {allBillingTypes.map(type => (
                                <option key={type} value={type}>
                                    {type === 'direct' ? 'Direto' : type === 'indirect' ? 'Indireto' : type}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* Seller Select */}
                    <div className="w-full sm:w-[150px]">
                        <ThemeSelect
                            value={sellerFilter}
                            onChange={(e) => setSellerFilter(e.target.value)}
                            className="h-11 rounded-full bg-muted/30 border-border text-[10px] uppercase font-black tracking-widest"
                        >
                            <option value="all">Vendedor: Todos</option>
                            {allSellers.map(seller => (
                                <option key={seller} value={seller}>{seller}</option>
                            ))}
                        </ThemeSelect>
                    </div>

                    <button
                        onClick={handleExportReport}
                        className="h-11 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center gap-2 transition-all group shrink-0"
                    >
                        <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">CSV</span>
                    </button>
                </div>
            </FilterBar>

            {/* KPI Cards */}
            <StatsGrid items={[
                {
                    label: "Vendas Totais",
                    value: formatCompact(stats.dealMetrics.totalValue),
                    description: "+12.5%",
                    icon: DollarSign,
                    color: "text-primary",
                    gradient: "from-primary/5 to-white dark:from-primary/10",
                    border: "border-primary/10"
                },
                {
                    label: "Taxa de Conversão",
                    value: formatPercentage(stats.dealMetrics.conversionRate),
                    description: "+2.1%",
                    icon: Target,
                    color: "text-teal-600 dark:text-teal-400",
                    gradient: "from-teal-50 to-white dark:from-teal-950/20",
                    border: "border-teal-100 dark:border-teal-900/50"
                },
                {
                    label: "Ciclo Médio",
                    value: `${Math.round(stats.dealMetrics.avgCycleTime)}d`,
                    description: "+3 dias",
                    icon: Calendar,
                    color: "text-orange-600 dark:text-orange-400",
                    gradient: "from-orange-50 to-white dark:from-orange-950/20",
                    border: "border-orange-100 dark:border-orange-900/50"
                },
                {
                    label: "Pipeline Ativo",
                    value: formatCompact(stats.dealMetrics.pipelineValue),
                    description: `Ponderado: ${formatCompact(stats.dealMetrics.weightedValue)}`,
                    icon: TrendingUp,
                    color: "text-cyan-600 dark:text-cyan-400",
                    gradient: "from-cyan-50 to-white dark:from-cyan-950/20",
                    border: "border-cyan-100 dark:border-cyan-900/50"
                }
            ]} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-primary" />
                        Funil de Conversão
                    </h3>
                    <ConversionFunnel 
                        data={stats.funnelData} 
                        onBarClick={(stageCode) => {
                            setStatusFilter(prev => prev === stageCode ? 'all' : stageCode);
                        }}
                    />
                </div>

                {/* Sales Performance */}
                <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-emerald-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-400" />
                        Performance por Vendedor
                    </h3>
                    <SalesPerformance 
                        data={stats.salesPerformance} 
                        onBarClick={(seller) => {
                            setSellerFilter(prev => prev === seller ? 'all' : seller);
                        }}
                    />
                </div>

                {/* Revenue Forecast */}
                <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-teal-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-teal-400" />
                        Previsão de Receita (3 Meses)
                    </h3>
                    <RevenueForecast forecast={stats.revenueForecast} />
                </div>

                {/* Loss Reasons */}
                <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-red-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-400" />
                        Motivos de Perda
                    </h3>
                    <LossReasonChart 
                        data={stats.lossReasons} 
                        onPieClick={(reason) => setSearchTerm(reason)}
                    />
                </div>
            </div>

            {/* Product Analysis (Full Width) */}
            <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm">
                <ProductAnalysis data={stats.productMetrics} />
            </div>

            {/* Drill-down Table: Oportunidades Relacionadas */}
            <div className="glass-card p-5 rounded-2xl bg-card border border-border shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
                            <Target className="h-4 w-4 text-primary" />
                            Detalhamento das Oportunidades
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                            {mappedDeals.length} resultados encontrados para os filtros atuais
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Oportunidade</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Empresa</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vendedor</th>
                                <th className="pb-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="pb-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mappedDeals.map((deal: any) => (
                                <tr key={deal.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5">
                                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{deal.title}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-70">
                                            {new Date(deal.created_at).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm text-foreground/80">{deal.company}</span>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {deal.owner?.charAt(0)}
                                            </div>
                                            <span className="text-sm text-foreground/80">{deal.owner}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            deal.stage === 'won' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            deal.stage === 'lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-primary/10 text-primary border-primary/20'
                                        }`}>
                                            {deal.stage === 'qualification' ? 'Qualificação' :
                                             deal.stage === 'proposal' ? 'Proposta' :
                                             deal.stage === 'negotiation' ? 'Negociação' :
                                             deal.stage === 'won' ? 'Ganhou' : 'Perdeu'}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <p className="font-bold text-foreground">{formatCurrency(deal.value)}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{deal.probability}% Prob.</p>
                                    </td>
                                </tr>
                            ))}
                            {mappedDeals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-sm text-muted-foreground">Nenhuma oportunidade encontrada para estes filtros.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
