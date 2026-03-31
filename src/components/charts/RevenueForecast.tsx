import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface RevenueForecastProps {
    forecast: number[];
}

export const RevenueForecast = ({ forecast }: RevenueForecastProps) => {

    const months = ['Mês 1', 'Mês 2', 'Mês 3'];
    const chartData = forecast.map((value, index) => ({
        month: months[index],
        value,
        optimistic: value * 1.2,
        pessimistic: value * 0.8
    }));

    const totalForecast = forecast.reduce((sum, val) => sum + val, 0);
    const avgMonthly = totalForecast / forecast.length;

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Previsão de Receita</h3>
                <p className="text-sm text-muted-foreground">Projeção para os próximos 3 meses</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Total Previsto</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalForecast, { compact: true })}</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Média Mensal</p>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(avgMonthly, { compact: true })}</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-teal-50 to-pink-50 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-teal-600" />
                        <p className="text-xs text-muted-foreground font-bold uppercase">Crescimento</p>
                    </div>
                    <p className="text-2xl font-bold text-teal-600">+10%</p>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
                                        <p className="font-bold text-foreground mb-2">{data.month}</p>
                                        <p className="text-sm text-green-600">Otimista: <span className="font-bold">{formatCurrency(data.optimistic, { compact: true })}</span></p>
                                        <p className="text-sm text-primary">Realista: <span className="font-bold">{formatCurrency(data.value, { compact: true })}</span></p>
                                        <p className="text-sm text-orange-600">Pessimista: <span className="font-bold">{formatCurrency(data.pessimistic, { compact: true })}</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="optimistic"
                        stroke="var(--success)"
                        fill="none"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        strokeWidth={3}
                    />
                    <Area
                        type="monotone"
                        dataKey="pessimistic"
                        stroke="var(--warning)"
                        fill="none"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                    />
                </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">Cenário Otimista (+20%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">Cenário Realista</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-muted-foreground">Cenário Pessimista (-20%)</span>
                </div>
            </div>
        </div>
    );
};
