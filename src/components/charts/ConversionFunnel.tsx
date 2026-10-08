import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '@/utils/format';

interface ConversionFunnelProps {
    data: Array<{
        stage: string;
        count: number;
        value: number;
        conversionRate: number;
    }>;
}

export const ConversionFunnel = ({ data }: ConversionFunnelProps) => {
    // IBM Blue Palette
    const colors = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)'
    ];


    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="stage"
                        type="category"
                        width={100}
                        tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="glass-card p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">{data.stage}</p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between gap-8 items-center">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Quantidade:</span>
                                                <span className="text-sm font-black text-foreground">{data.count}</span>
                                            </div>
                                            <div className="flex justify-between gap-8 items-center">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">Valor:</span>
                                                <span className="text-sm font-black text-foreground">{formatCurrency(data.value, { compact: true })}</span>
                                            </div>
                                            <div className="flex justify-between gap-8 items-center py-1 border-t border-border mt-1">
                                                <span className="text-xs font-bold text-primary uppercase">Conversão:</span>
                                                <span className="text-xs font-black text-primary">{data.conversionRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Conversion Path Visual */}
            <div className="mt-8 grid grid-cols-4 gap-2">
                {data.map((stage, index) => (
                    <div key={stage.stage} className="relative text-center">
                        <div className="text-xs text-muted-foreground font-bold uppercase mb-1 truncate px-1">
                            {stage.stage}
                        </div>
                        <div
                            className="h-1.5 rounded-full mb-2"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <div className="text-sm font-bold text-foreground">
                            {stage.count}
                        </div>
                        {index > 0 && (
                            <div className="absolute -left-1 top-6 text-xs font-bold text-primary bg-primary/10 px-1 rounded border border-primary/20">
                                {stage.conversionRate.toFixed(0)}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
