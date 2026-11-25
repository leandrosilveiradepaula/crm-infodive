'use client';

import React from 'react';
import { SalesOrder } from '@/hooks/useSalesOrders';
import { formatCurrency } from '@/utils/format';
import {
    TrendingUp,
    ShoppingBag,
    Clock,
    FileText,
    ArrowUpRight,
    BarChart3,
    Target,
    Zap,
    Calendar,
    AlertTriangle,
    AlertCircle,
    Info,
    Brain,
    ChevronRight,
    Loader2,
    X
} from 'lucide-react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area
} from 'recharts';
import { AccessibleChart } from '@/components/charts/AccessibleChart';
import { startOfWeek, addWeeks, format, isSameWeek, isAfter, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';

const STATUS_COLORS: Record<string, string> = {
    pedido_gerado: 'var(--primary)',
    nf_emitida: 'var(--stage-proposal)',
    entregue: 'var(--stage-negotiation)',
    cliente_pagou: 'var(--success)',
    distribuidor_pagou: 'var(--info)',
    comissao_paga: 'var(--stage-won)',
};

const STATUS_LABELS: Record<string, string> = {
    pedido_gerado: 'Pedido Gerado',
    nf_emitida: 'NF Emitida',
    entregue: 'Entregue',
    cliente_pagou: 'Cliente Pagou',
    distribuidor_pagou: 'Distr. Pagou',
    comissao_paga: 'Comissão Paga',
};

interface Alert {
    id: string;
    orderId: string;
    customer: string;
    title: string;
    type: 'faturamento_atrasado' | 'entrega_pendente' | 'pagamento_atrasado' | 'inatividade';
    severity: 'low' | 'medium' | 'high';
    message: string;
    days: number;
}

interface DashboardTabProps {
    orders: SalesOrder[];
    onNavigateToOrders: (filter?: string) => void;
}

interface StatusDataPoint {
    name: string;
    value: number;
    color: string;
}

interface CashFlowPoint {
    date: string;
    rawDate: Date;
    amount: number;
    cumulative: number;
}

export function DashboardTab({ orders, onNavigateToOrders }: DashboardTabProps) {
    const [alerts, setAlerts] = React.useState<Alert[]>([]);
    const [isLoadingAlerts, setIsLoadingAlerts] = React.useState(true);
    const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiAnalysis, setAiAnalysis] = React.useState<{ analysis: string; suggestion: string; priority: string } | null>(null);

    // Fetch Alerts
    React.useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch('/api/sales/alerts');
                const data = await res.json();
                if (data.success) {
                    setAlerts(data.alerts);
                }
            } catch (err) {
                console.error('Failed to fetch alerts', err);
            } finally {
                setIsLoadingAlerts(false);
            }
        };
        fetchAlerts();
    }, []);

    const handleDeepAnalysis = async (alert: Alert) => {
        setSelectedAlert(alert);
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
            const res = await fetch('/api/sales/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: alert.orderId, alertType: alert.type })
            });
            const data = await res.json();
            if (data.success) {
                setAiAnalysis(data.data);
            } else {
                toast.error('Falha na análise da IA');
            }
        } catch (err) {
            toast.error('Erro ao conectar com o serviço de IA');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Dynamic Statistics ---
    const totalSalesValue = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const activeOrdersCount = orders.filter(o => o.status !== 'comissao_paga').length;
    const completedOrdersCount = orders.filter(o => o.status === 'comissao_paga').length;

    const ordersWithNF = orders.filter(o => o.status !== 'pedido_gerado' && o.created_at);
    const avgDays = ordersWithNF.length > 0
        ? (ordersWithNF.reduce((sum, o) => {
            const start = new Date(o.created_at).getTime();
            const end = o.updated_at ? new Date(o.updated_at).getTime() : Date.now();
            return sum + (end - start);
        }, 0) / ordersWithNF.length / (1000 * 60 * 60 * 24)).toFixed(1)
        : "---";

    const pendingInvoicesCount = orders.filter(o => o.status === 'pedido_gerado').length;

    // --- Installments Normalization ---
    const allInstallments = orders.flatMap(o => o.installments || []);
    
    const totalInstallments = allInstallments.length;
    const paidInstallments = allInstallments.filter(i => i.status === 'paid').length;
    const overdueInstallments = allInstallments.filter(i => {
        if (i.status === 'paid') return false;
        return new Date(i.due_date) < startOfDay(new Date());
    }).length;

    // --- Chart Data Processing: Status ---
    const statusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData: StatusDataPoint[] = Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count as number,
        color: STATUS_COLORS[status] || 'var(--muted-foreground)'
    })).sort((a, b) => b.value - a.value);

    // --- Chart Data Processing: Entity ---
    const entityVolumes = orders.reduce((acc, o) => {
        const entity = o.billing_entity === 'infodive' ? 'Infodive' : 'Distribuidor';
        acc[entity] = (acc[entity] || 0) + (o.total_value || 0);
        return acc;
    }, {} as Record<string, number>);

    const entityData = Object.entries(entityVolumes).map(([name, value]) => ({
        name,
        value: value as number
    }));

    // --- Chart Data Processing: Cash Flow (Next 90 Days) ---
    const today = startOfDay(new Date());
    const ninetyDaysFromNow = addDays(today, 90);
    
    const upcomingInstallments = allInstallments
        .filter(i => i.status !== 'paid')
        .map(i => ({ ...i, date: new Date(i.due_date) }))
        .filter(i => isAfter(i.date, today) || i.date.getTime() === today.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    const cashFlowData: CashFlowPoint[] = [];
    let currentCumulative = 0;

    // Create daily points for smoothness or weekly for clarity
    // Let's do weekly points for the next 12 weeks
    for (let i = 0; i < 13; i++) {
        const weekDate = addWeeks(today, i);
        const weekLabel = i === 0 ? 'Hoje' : format(weekDate, "dd/MM", { locale: ptBR });
        
        // Sum installments up to this week that haven't been counted
        const installsThisWeek = upcomingInstallments.filter(inst => 
            isAfter(inst.date, addWeeks(today, i - 1)) && 
            (isAfter(addWeeks(today, i), inst.date) || isSameWeek(addWeeks(today, i), inst.date))
        );
        
        const weekAmount = installsThisWeek.reduce((s, inst) => s + inst.amount, 0);
        currentCumulative += weekAmount;

        cashFlowData.push({
            date: weekLabel,
            rawDate: weekDate,
            amount: weekAmount,
            cumulative: currentCumulative
        });
    }

    // --- Heatmap Data (Next 8 Weeks) ---
    const heatmapWeeks = Array.from({ length: 8 }).map((_, i) => {
        const date = addWeeks(today, i);
        const start = startOfWeek(date);
        const amount = allInstallments
            .filter(inst => inst.status !== 'paid' && isSameWeek(new Date(inst.due_date), date))
            .reduce((s, inst) => s + inst.amount, 0);
        
        return {
            label: `Semana ${i + 1}`,
            dateRange: `${format(start, "dd/MM")} - ${format(addDays(start, 6), "dd/MM")}`,
            amount,
            intensity: Math.min(amount / 50000, 1) // Normalized intensity
        };
    });

    const stats: StatItem[] = [
        {
            label: 'Total em Vendas',
            value: formatCurrency(totalSalesValue),
            description: 'Valor bruto consolidado',
            icon: TrendingUp,
            tone: 'primary',
        },
        {
            label: 'Pedidos Ativos',
            value: activeOrdersCount.toString(),
            description: 'Ciclo em andamento',
            icon: ShoppingBag,
            tone: 'info',
            onClick: () => onNavigateToOrders('active'),
        },
        {
            label: 'Média de Faturamento',
            value: `${avgDays} dias`,
            description: 'Eficiência logística',
            icon: Clock,
            tone: 'success',
        },
        {
            label: 'NFs Pendentes',
            value: pendingInvoicesCount.toString(),
            description: 'Aguardando faturamento',
            icon: FileText,
            tone: 'warning',
            onClick: () => onNavigateToOrders('pedido_gerado'),
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <StatsGrid items={stats} />

            <div className="grid gap-8 lg:grid-cols-3">
                {/* ... rest of the charts and sections */}
                {/* MAIN ANALYTICS: Cash Flow Projection */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="rounded-[var(--radius-panel)] border border-border bg-card p-8 flex flex-col shadow-control-ui transition-all hover:shadow-card-ui">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-[var(--radius-panel)] bg-primary/10">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Projeção de Fluxo de Caixa</h3>
                                    <p className="text-metadata-ui text-muted-foreground mt-0.5">Expectativa de recebimento acumulado para os próximos 90 dias</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-metadata-ui font-black uppercase text-muted-foreground">Total Projetado</span>
                                <div className="text-section-title font-black text-primary">{formatCurrency(currentCumulative)}</div>
                            </div>
                        </div>
                        
                        <div className="h-[320px] w-full">
                            <AccessibleChart label="Fluxo de caixa por semana" entries={cashFlowData.map((point) => `${point.date}: recebimento ${formatCurrency(point.amount)}, acumulado ${formatCurrency(point.cumulative)}`)}>
<ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={false}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={false}
                                        tickFormatter={(val) => `R$ ${val/1000}k`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="glass-card p-4 border border-border/50 shadow-overlay-ui animate-in fade-in zoom-in-95 duration-200">
                                                        <p className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground mb-2">Semana de {payload[0].payload.date}</p>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between gap-8 items-center">
                                                                <span className="text-metadata-ui font-bold text-muted-foreground">RECEBIMENTO:</span>
                                                                <span className="text-metadata-ui font-black text-foreground">{formatCurrency(payload[0].payload.amount)}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-8 items-center">
                                                                <span className="text-metadata-ui font-bold text-primary">ACUMULADO:</span>
                                                                <span className="text-body-ui font-black text-primary">{formatCurrency(payload[0].payload.cumulative)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="cumulative" 
                                        stroke="var(--primary)" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorCumulative)" 
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
</AccessibleChart>
                        </div>
                    </div>
                </div>

                {/* AI RISK ALERTS SECTION */}
                <div className="rounded-[var(--radius-panel)] border border-border bg-card p-8 flex flex-col space-y-6 shadow-control-ui transition-all hover:shadow-card-ui">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-[var(--radius-panel)] bg-destructive-subtle">
                                <AlertTriangle className="w-4 h-4 text-destructive-readable" />
                            </div>
                            <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Alertas de Risco AI</h3>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-destructive-subtle text-metadata-ui font-black text-foreground border border-border">
                            {alerts.length} ATIVOS
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted max-h-[400px]">
                        {isLoadingAlerts ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-metadata-ui font-bold uppercase tracking-widest">Analisando Pipeline...</span>
                            </div>
                        ) : alerts.length === 0 ? (
                            <PremiumEmptyState 
                                variant="compact"
                                icon={Zap}
                                title="Pipeline Saudável"
                                description="Nenhum alerta de risco detectado pela IA no momento."
                            />
                        ) : (
                            alerts.map(alert => (
                                <button
                                    key={alert.id}
                                    onClick={() => handleDeepAnalysis(alert)}
                                    className="w-full text-left group p-3 rounded-[var(--radius-panel)] border border-border bg-card hover:border-primary/50 transition-all hover:bg-card relative overflow-hidden"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                            alert.severity === 'high' ? 'bg-destructive shadow-[0_0_8px_rgba(244,63,94,0.6)]' :
                                            alert.severity === 'medium' ? 'bg-warning' : 'bg-primary'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-metadata-ui font-black text-foreground truncate uppercase">{alert.customer || 'Cliente Desconhecido'}</p>
                                            <p className="text-metadata-ui font-bold text-muted-foreground truncate">{alert.title}</p>
                                            <p className="text-metadata-ui font-medium text-foreground mt-1 line-clamp-2 leading-tight">{alert.message}</p>
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-metadata-ui font-black px-1.5 py-0.5 bg-muted rounded text-muted-foreground uppercase">{alert.type.replace('_', ' ')}</span>
                                        {alert.days > 0 && <span className="text-metadata-ui font-bold text-destructive-readable">{alert.days}d parados</span>}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* SECONDARY ANALYTICS Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Status Distribution (Pie) */}
                <div className="lg:col-span-2 rounded-[var(--radius-panel)] border border-border bg-card p-8 flex flex-col shadow-control-ui transition-all hover:shadow-card-ui">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-warning-subtle">
                            <Target className="w-4 h-4 text-warning-readable" />
                        </div>
                        <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Distribuição por Status</h3>
                    </div>
                    <div className="h-[240px] w-full">
                        <AccessibleChart label="Pedidos por situação" entries={statusData.map((point) => `${point.name}: ${point.value} pedidos`)}>
<ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-3 border border-border/50 text-metadata-ui shadow-overlay-ui">
                                                    <p className="font-bold text-foreground">{payload[0].name}</p>
                                                    <p className="text-primary mt-1 font-black">{payload[0].value} Pedido(s)</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />

                            </PieChart>
                        </ResponsiveContainer>
</AccessibleChart>
                    </div>
                </div>

                {/* Sales Volume by Entity (Bar) */}
                <div className="lg:col-span-3 rounded-[var(--radius-panel)] border border-border bg-card p-8 flex flex-col shadow-control-ui transition-all hover:shadow-card-ui">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-success-subtle">
                            <BarChart3 className="w-4 h-4 text-success-readable" />
                        </div>
                        <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Volume por Faturamento</h3>
                    </div>
                    <div className="h-[240px] w-full">
                        <AccessibleChart label="Volume de vendas por faturamento" entries={entityData.map((point) => `${point.name}: ${formatCurrency(point.value)}`)}>
<ResponsiveContainer width="100%" height="100%">
                            <BarChart data={entityData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-3 border border-border/50 text-metadata-ui shadow-overlay-ui">
                                                    <p className="font-bold text-foreground">{payload[0].payload.name}</p>
                                                    <p className="text-foreground mt-1 font-black">{formatCurrency(payload[0].value as number)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={1500}
                                    barSize={30}
                                >
                                    {entityData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Infodive' ? 'var(--primary)' : 'var(--success)'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
</AccessibleChart>
                    </div>
                </div>
            </div>

            {/* TERTIARY INSIGHTS Row */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* Receivables Heatmap Area */}
                <div className="md:col-span-2 rounded-[var(--radius-panel)] border border-border bg-card p-8 flex flex-col shadow-control-ui transition-all hover:shadow-card-ui">
                     <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-warning-subtle">
                            <Calendar className="w-4 h-4 text-warning-readable" />
                        </div>
                        <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Heatmap de Recebíveis (8 Semanas)</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2 h-full">
                        {heatmapWeeks.map((week, idx) => (
                            <div 
                                key={idx}
                                className="group relative rounded-[var(--radius-panel)] border border-border/50 p-3 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-overlay-ui"
                                style={{ 
                                    background: `rgba(245, 158, 11, ${0.05 + week.intensity * 0.2})`,
                                    borderColor: week.intensity > 0.5 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                <div className="text-metadata-ui font-black uppercase tracking-tighter text-foreground">{week.label}</div>
                                <div className="text-metadata-ui font-black text-foreground bg-card inline-block rounded px-1 mt-1">{formatCurrency(week.amount)}</div>
                                
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-background flex items-center justify-center p-2 rounded-[var(--radius-panel)] transition-opacity pointer-events-none border border-warning/30">
                                    <span className="text-metadata-ui font-black text-foreground leading-tight text-center">
                                        {week.dateRange}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Health Indicator */}
                <div className="rounded-[var(--radius-panel)] border border-border bg-card p-8 space-y-4 shadow-control-ui transition-all hover:shadow-card-ui">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-success-subtle">
                            <Target className="w-4 h-4 text-success-readable" />
                        </div>
                        <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Saúde do Pipeline</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-metadata-ui text-muted-foreground">Ciclo Completo</span>
                            <span className="text-body-ui font-bold text-foreground">{completedOrdersCount} / {orders.length}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                                className="ds-gradient-context from-primary to-success-subtle h-full rounded-full transition-all duration-700"
                                style={{ width: orders.length > 0 ? `${(completedOrdersCount / orders.length) * 100}%` : '0%' }}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-metadata-ui text-muted-foreground text-metadata-ui font-bold">VENCIDAS:</span>
                            <span className="text-metadata-ui font-black text-foreground">{overdueInstallments}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-[var(--radius-panel)] border border-border bg-card p-8 space-y-4 shadow-control-ui transition-all hover:shadow-card-ui">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-warning-subtle">
                            <Zap className="w-4 h-4 text-warning-readable" />
                        </div>
                        <h3 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Ações Rápidas</h3>
                    </div>
                    <div className="space-y-2">
                        {pendingInvoicesCount > 0 && (
                            <button
                                onClick={() => onNavigateToOrders('pedido_gerado')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-panel)] bg-warning-subtle border border-border hover:bg-muted transition-all text-left"
                            >
                                <span className="text-metadata-ui font-bold text-foreground">{pendingInvoicesCount} NF PEN.</span>
                                <ArrowUpRight className="w-3 h-3 text-warning-readable" />
                            </button>
                        )}
                        {overdueInstallments > 0 && (
                            <button
                                onClick={() => onNavigateToOrders()}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-panel)] bg-destructive-subtle border border-border hover:bg-muted transition-all text-left"
                            >
                                <span className="text-metadata-ui font-bold text-foreground">{overdueInstallments} VENCIDOS</span>
                                <ArrowUpRight className="w-3 h-3 text-destructive-readable" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Deep Analysis Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card w-full max-w-lg rounded-[var(--radius-panel)] border border-border shadow-overlay-ui overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-[var(--radius-panel)] bg-primary/10">
                                    <Brain className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-body-ui font-black uppercase tracking-widest leading-none">Análise de Risco IA</h3>
                                    <p className="text-metadata-ui font-bold text-muted-foreground mt-1">Investigação inteligente de gargalo</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedAlert(null)}
                                className="p-1 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="p-4 rounded-[var(--radius-panel)] border border-border bg-muted/20">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-metadata-ui font-black uppercase tracking-tight text-primary">{selectedAlert.customer}</p>
                                    <span className={`text-metadata-ui font-black px-2 py-0.5 rounded-full border ${
                                        selectedAlert.severity === 'high' ? 'bg-destructive-subtle text-destructive-readable border-destructive/20' :
                                        'bg-warning-subtle text-warning-readable border-warning/20'
                                    }`}>
                                        {selectedAlert.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-body-ui font-bold">{selectedAlert.title}</p>
                                <p className="text-metadata-ui text-muted-foreground mt-1">{selectedAlert.message}</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Zap className="w-3 h-3" /> Resultado da IA
                                </h4>
                                
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-3 opacity-50">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-metadata-ui font-bold uppercase tracking-tighter">Gemini processando dados do pedido...</p>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="space-y-1.5 border-l-2 border-primary pl-4 py-1">
                                            <p className="text-metadata-ui font-black text-primary uppercase">Diagnóstico</p>
                                            <p className="text-metadata-ui font-medium leading-relaxed">{aiAnalysis.analysis}</p>
                                        </div>
                                        <div className="space-y-1.5 border-l-2 border-success pl-4 py-1">
                                            <p className="text-metadata-ui font-black text-success-readable uppercase">Sugestão de Ação</p>
                                            <p className="text-metadata-ui font-bold bg-success-subtle p-2 rounded-[var(--radius-panel)] border border-success/10">{aiAnalysis.suggestion}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-metadata-ui text-muted-foreground italic">Clique em analisar para obter insights.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="px-5 py-2.5 rounded-[var(--radius-panel)] text-metadata-ui font-black uppercase tracking-widest hover:bg-muted transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                onClick={() => toast.info('Ação registrada no CRM')}
                                className="px-5 py-2.5 rounded-[var(--radius-panel)] bg-primary text-primary-foreground text-metadata-ui font-black uppercase tracking-widest shadow-overlay-ui shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Executar Sugestão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
