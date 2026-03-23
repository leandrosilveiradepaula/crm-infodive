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
            <div className="flex flex-col lg:flex-row gap-4 items-center bg-card p-4 rounded-3xl border border-border shadow-sm animate-in fade-in duration-500">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por oportunidade, empresa, produto, vendedor ou status..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                    {/* Advanced Multi-Year Pill Selector */}
                    <div className="flex flex-col sm:flex-row gap-2 bg-muted/30 p-1 rounded-2xl border border-border w-full sm:w-auto h-auto sm:h-11 items-center overflow-x-auto no-scrollbar">
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
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedQuarters.length === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
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
                                        className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
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

                    {/* Origem Pill */}
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border h-11">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Origem:</span>
                        <select
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none min-w-[80px]"
                        >
                            <option value="all">Todas</option>
                            {allSources.map(src => (
                                <option key={src} value={src}>{src}</option>
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
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative glass-card p-6 rounded-3xl bg-card border border-border hover:border-primary/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                +12.5%
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">Vendas Totais</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter">
                            {formatCompact(stats.dealMetrics.totalValue)}
                        </h3>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-purple-500/0 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative glass-card p-6 rounded-3xl bg-card border border-border hover:border-purple-500/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <Target className="h-5 w-5 text-purple-500" />
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                                +2.1%
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">Taxa de Conversão</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter">
                            {formatPercentage(stats.dealMetrics.conversionRate)}
                        </h3>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-orange-500/0 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative glass-card p-6 rounded-3xl bg-card border border-border hover:border-orange-500/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-xl">
                                <Calendar className="h-5 w-5 text-orange-500" />
                            </div>
                            <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                                +3d
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">Ciclo Médio</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter">
                            {Math.round(stats.dealMetrics.avgCycleTime)}<span className="text-sm ml-1 text-muted-foreground">dias</span>
                        </h3>
                    </div>
                </div>

                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-cyan-500/0 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative glass-card p-6 rounded-3xl bg-card border border-border hover:border-cyan-500/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-cyan-500/10 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-cyan-500" />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-bold">Ponderado: {formatCompact(stats.dealMetrics.weightedValue)}</span>
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 opacity-70">Pipeline Ativo</p>
                        <h3 className="text-3xl font-black text-foreground tracking-tighter">
                            {formatCompact(stats.dealMetrics.pipelineValue)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
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
                <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-emerald-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
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
                <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-purple-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                        Previsão de Receita (3 Meses)
                    </h3>
                    <RevenueForecast forecast={stats.revenueForecast} />
                </div>

                {/* Loss Reasons */}
                <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-red-500/20 transition-all">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-8 flex items-center gap-2">
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
            <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm">
                <ProductAnalysis data={stats.productMetrics} />
            </div>

            {/* Drill-down Table: Oportunidades Relacionadas */}
            <div className="glass-card p-8 rounded-3xl bg-card border border-border shadow-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex justify-between items-center mb-8">
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
                                    <td className="py-4">
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
