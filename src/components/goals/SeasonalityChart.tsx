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
        <div className="w-full h-[300px] bg-card rounded-[var(--radius-panel)] border border-border p-5 shadow-control-ui">
            <h3 className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                <Target className="h-4 w-4" /> Distribuição Sazonal (Ano)
            </h3>
            <ResponsiveContainer width="100%" height="80%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                        dataKey="month"
                        stroke="var(--muted-foreground)"
                        fontSize="var(--ds-type-metadata-size)"
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        stroke="var(--muted-foreground)"
                        fontSize="var(--ds-type-metadata-size)"
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'color-mix(in oklab, var(--muted) 50%, transparent)' }}
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            borderColor: 'var(--border)',
                            color: 'var(--popover-foreground)',
                            borderRadius: 'var(--radius-panel)',
                            boxShadow: 'var(--ds-shadow-overlay)'
                        }}
                        formatter={(value: number | undefined) => [
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0),
                            'Meta do Mês'
                        ]}
                        labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'var(--ds-type-label-weight)', marginBottom: '4px' }}
                    />
                    <Bar dataKey="target" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="var(--primary)" fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
