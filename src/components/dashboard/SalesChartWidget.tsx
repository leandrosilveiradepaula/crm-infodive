'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
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
        <div className="bg-card rounded-2xl p-6 h-full flex flex-col border border-border">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Performance de Vendas</h2>
                    <div className="flex items-center space-x-4 mt-1 text-sm">
                        <span className="flex items-center text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-primary mr-2 shadow-lg shadow-primary/40"></div>Vendas</span>
                        <span className="flex items-center text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-primary/20 mr-2"></div>Projeção</span>
                    </div>
                </div>
                <button className="p-2 hover:bg-muted/50 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
                            tickFormatter={(value) => `R$${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass-card p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Volume (R$):</span>
                                                    <span className="text-sm font-black text-foreground">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-8 items-center">
                                                    <span className="text-[10px] font-bold text-primary uppercase">Oportunidades:</span>
                                                    <span className="text-sm font-black text-primary">{payload[0].payload.deals}</span>
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
                            fill="url(#colorSales)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
