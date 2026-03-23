'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target } from 'lucide-react';

interface SeasonalityChartProps {
    yearlyRevenueGoal: number;
    qPct: { q1: number; q2: number; q3: number; q4: number };
}

export const SeasonalityChart = ({ yearlyRevenueGoal, qPct }: SeasonalityChartProps) => {
    const months = [
        { name: 'Jan', q: 'q1' }, { name: 'Fev', q: 'q1' }, { name: 'Mar', q: 'q1' },
        { name: 'Abr', q: 'q2' }, { name: 'Mai', q: 'q2' }, { name: 'Jun', q: 'q2' },
        { name: 'Jul', q: 'q3' }, { name: 'Ago', q: 'q3' }, { name: 'Set', q: 'q3' },
        { name: 'Out', q: 'q4' }, { name: 'Nov', q: 'q4' }, { name: 'Dez', q: 'q4' }
    ];

    const data = months.map(m => {
        const pct = qPct[m.q as keyof typeof qPct] / 3; // Divide quarter pct by 3 months
        const target = yearlyRevenueGoal * (pct / 100);
        return {
            month: m.name,
            target,
            pct: pct.toFixed(1)
        };
    });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value);

    return (
        <div className="w-full h-[300px] bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <Target className="h-4 w-4" /> Distribuição Sazonal (Ano)
            </h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        dataKey="month"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--popover-foreground))',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number | undefined) => [
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0),
                            'Meta do Mês'
                        ]}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar dataKey="target" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
