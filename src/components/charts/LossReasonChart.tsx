import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LossReasonChartProps {
    data: { name: string; value: number }[];
}

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
];

export const LossReasonChart = ({ data }: LossReasonChartProps) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de perda disponível
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="glass-card p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{payload[0].name}</p>
                                        <div className="flex justify-between gap-8 items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Frequência:</span>
                                            <span className="text-sm font-black text-foreground">{payload[0].value}</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
