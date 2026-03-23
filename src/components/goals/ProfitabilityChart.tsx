'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfitabilityChartProps {
    fixedCosts: number;
    variableCostPercent: number;
    targetRevenue: number;
    breakEvenPoint: number;
    comparison?: {
        name: string;
        fixedCosts: number;
        variableCostPercent: number;
        targetRevenue: number;
    };
}

export const ProfitabilityChart = ({ fixedCosts, variableCostPercent, targetRevenue, breakEvenPoint, comparison }: ProfitabilityChartProps) => {
    // Generate data points
    // We want to show a range from 0 to 120% of the Target Revenue target
    const maxRev1 = targetRevenue * 1.2;
    const maxRev2 = comparison ? comparison.targetRevenue * 1.2 : 0;
    const maxRevenue = Math.max(maxRev1, maxRev2) || 10000;
    const steps = 10;
    const stepSize = maxRevenue / steps;

    const data = Array.from({ length: steps + 1 }, (_, i) => {
        const revenue = i * stepSize;
        const totalVariableCost = revenue * (variableCostPercent / 100);
        const totalCost = fixedCosts + totalVariableCost;
        const profit = revenue - totalCost;

        const point: any = {
            revenue,
            totalCost,
            profit,
            sales: revenue // Alias for X Axis
        };

        if (comparison) {
            const compTotalVariableCost = revenue * (comparison.variableCostPercent / 100);
            point.compTotalCost = comparison.fixedCosts + compTotalVariableCost;
        }

        return point;
    });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value);

    return (
        <div className="w-full h-[300px] bg-card rounded-2xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 ml-2">
                Análise de Ponto de Equilíbrio
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                        dataKey="sales"
                        tickFormatter={formatCurrency}
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tick={{ fill: 'var(--muted-foreground)' }}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        stroke="var(--muted-foreground)"
                        fontSize={10}
                        tick={{ fill: 'var(--muted-foreground)' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--popover)',
                            borderColor: 'var(--border)',
                            color: 'var(--popover-foreground)',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number | undefined) => {
                            if (value === undefined) return ['R$ 0,00', ''];
                            return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), ''];
                        }}
                        labelFormatter={(label) => `Faturamento: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(label))}`}
                    />

                    {/* Revenue Line (Green) */}
                    <Line
                        type="monotone"
                        dataKey="sales"
                        name="Faturamento"
                        stroke="var(--success)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: 'var(--success)' }}
                    />

                    {/* Total Cost Line (Red/Orange) */}
                    <Line
                        type="monotone"
                        dataKey="totalCost"
                        name="Custo Total"
                        stroke="var(--warning)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: 'var(--warning)' }}
                    />

                    {/* Comparison Cost Line (Dashed Blue) */}
                    {comparison && (
                        <Line
                            type="monotone"
                            dataKey="compTotalCost"
                            name={`Custo Total (${comparison.name})`}
                            stroke="var(--primary)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 6, fill: 'var(--primary)' }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
