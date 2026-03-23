import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface SalesPerformanceProps {
    data: Array<{
        seller: string;
        dealsWon: number;
        dealsLost: number;
        totalRevenue: number;
        conversionRate: number;
        avgDealSize: number;
    }>;
}

export const SalesPerformance = ({ data }: SalesPerformanceProps) => {

    const topPerformer = data[0];

    return (
        <div className="glass-card p-6 rounded-2xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Performance por Vendedor</h3>
                <p className="text-sm text-muted-foreground">Ranking de vendedores por receita gerada</p>
            </div>

            {/* Top Performer Highlight */}
            {topPerformer && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                            <Award className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Top Performer</p>
                            <p className="text-lg font-bold text-foreground">{topPerformer.seller}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(topPerformer.totalRevenue)}</p>
                            <p className="text-xs text-muted-foreground">{topPerformer.dealsWon} deals fechados</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="seller" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
                                        <p className="font-bold text-foreground mb-2">{data.seller}</p>
                                        <p className="text-sm text-muted-foreground">Receita: <span className="font-bold text-primary">{formatCurrency(data.totalRevenue, { compact: true })}</span></p>
                                        <p className="text-sm text-muted-foreground">Deals Ganhos: <span className="font-bold text-success">{data.dealsWon}</span></p>
                                        <p className="text-sm text-muted-foreground">Deals Perdidos: <span className="font-bold text-destructive">{data.dealsLost}</span></p>
                                        <p className="text-sm text-muted-foreground">Taxa de Conversão: <span className="font-bold">{data.conversionRate.toFixed(1)}%</span></p>
                                        <p className="text-sm text-muted-foreground">Ticket Médio: <span className="font-bold">{formatCurrency(data.avgDealSize, { compact: true })}</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? 'var(--primary)' : index === 1 ? 'var(--warning)' : 'var(--muted-foreground)'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Performance Table */}
            <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 font-bold text-muted-foreground uppercase text-xs">Vendedor</th>
                            <th className="text-right py-2 font-bold text-muted-foreground uppercase text-xs">Ganhos</th>
                            <th className="text-right py-2 font-bold text-muted-foreground uppercase text-xs">Perdidos</th>
                            <th className="text-right py-2 font-bold text-muted-foreground uppercase text-xs">Taxa</th>
                            <th className="text-right py-2 font-bold text-muted-foreground uppercase text-xs">Receita</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((seller, index) => (
                            <tr key={seller.seller} className="border-b border-border/50 hover:bg-muted/50">
                                <td className="py-3 font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        {index < 3 && (
                                            <span className={`
                                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                                ${index === 0 ? 'bg-yellow-400 text-white' : ''}
                                                ${index === 1 ? 'bg-gray-300 text-foreground' : ''}
                                                ${index === 2 ? 'bg-orange-300 text-orange-900' : ''}
                                            `}>
                                                {index + 1}
                                            </span>
                                        )}
                                        {seller.seller}
                                    </div>
                                </td>
                                <td className="py-3 text-right">
                                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                                        <TrendingUp className="h-3 w-3" />
                                        {seller.dealsWon}
                                    </span>
                                </td>
                                <td className="py-3 text-right">
                                    <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                                        <TrendingDown className="h-3 w-3" />
                                        {seller.dealsLost}
                                    </span>
                                </td>
                                <td className="py-3 text-right font-bold text-foreground">
                                    {seller.conversionRate.toFixed(1)}%
                                </td>
                                <td className="py-3 text-right font-bold text-primary">
                                    {formatCurrency(seller.totalRevenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
