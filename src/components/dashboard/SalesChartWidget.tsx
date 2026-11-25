'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AccessibleChart } from '@/components/charts/AccessibleChart';
import { useTheme } from '../providers/ThemeProvider';

interface SalesChartWidgetProps {
    data: { name: string; revenue: number; deals: number }[];
}

export const SalesChartWidget = ({ data }: SalesChartWidgetProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const displayData = data.map(m => ({
        name: m.name,
        sales: m.revenue,
        deals: m.deals
    }));

    return (
        <div className="bg-card rounded-[var(--radius-panel)] p-4 h-full flex flex-col border border-border">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-body-ui font-bold text-foreground">Performance de Vendas</h2>
                    <div className="flex items-center space-x-4 mt-1 text-body-ui">
                        <span className="flex items-center text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-primary mr-2 shadow-card-ui shadow-primary/40"></div>Vendas</span>
                        <span className="flex items-center text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-surface-subtle border border-border mr-2"></div>Projeção</span>
                    </div>
                </div>

            </div>

            <div className="flex-1" style={{ minHeight: 300 }}>
                <AccessibleChart label="Vendas e negócios por período" entries={displayData.map((point) => `${point.name}: vendas ${point.sales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, ${point.deals} negócios`)}>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={false}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={false}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass-card p-4 shadow-card-ui rounded-[var(--radius-panel)] animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-metadata-ui font-bold text-muted-foreground uppercase">Volume (R$):</span>
                                                    <span className="text-body-ui font-black text-foreground">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-metadata-ui font-bold text-primary uppercase">Oportunidades:</span>
                                                    <span className="text-body-ui font-black text-primary">{payload[0].payload.deals}</span>
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
                            dataKey="sales"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="var(--surface-subtle)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                </AccessibleChart>
            </div>
        </div>
    );
};
