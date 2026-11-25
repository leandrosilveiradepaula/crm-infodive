import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { AccessibleChart } from '@/components/charts/AccessibleChart';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

function EmptyChartState({ message = 'Sem dados para os filtros selecionados.' }: { message?: string }) {
    return (
        <div className="flex h-full items-center justify-center rounded-[var(--radius-control)] border border-dashed border-border bg-muted/20 px-6 text-center ds-type-body text-muted-foreground">
            {message}
        </div>
    );
}

export function ConversionFunnel({ data, onBarClick }: { data: any[], onBarClick?: (stage: string) => void }) {

    return (
        <div className="h-[300px] w-full">
            {data.every((point) => point.count === 0) ? <EmptyChartState /> : (
            <AccessibleChart label="Conversão por etapa comercial" entries={data.map((point) => `${point.stage}: ${point.count} oportunidades`)} onSelect={onBarClick ? (index) => onBarClick(data[index].stageCode || data[index].stage) : undefined}>
<ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={false} />
                    <YAxis dataKey="stage" type="category" tick={false} width={100} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    />
                    <Bar 
                        dataKey="count" 
                        fill="var(--primary)" 
                        radius={[0, 4, 4, 0]} 
                        className="cursor-pointer"
                        onClick={(entry: any) => {
                            if (onBarClick && entry && entry.payload) {
                                onBarClick(entry.payload.stageCode || entry.payload.stage);
                            }
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
</AccessibleChart>
            )}
        </div>
    );
}

export function SalesPerformance({ data, onBarClick }: { data: any[], onBarClick?: (seller: string) => void }) {
    return (
        <div className="h-[300px] w-full">
            {data.length === 0 ? <EmptyChartState /> : (
            <AccessibleChart label="Receita por vendedor" entries={data.map((point) => `${point.seller}: ${formatCurrency(point.totalRevenue)}`)} onSelect={onBarClick ? (index) => onBarClick(data[index].seller) : undefined}>
<ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="seller" tick={false} />
                    <YAxis tick={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                    />
                    <Bar 
                        dataKey="totalRevenue" 
                        fill="var(--success)" 
                        radius={[4, 4, 0, 0]} 
                        name="Receita" 
                        className="cursor-pointer"
                        onClick={(entry: any) => {
                            if (onBarClick && entry && entry.payload && entry.payload.seller) {
                                onBarClick(entry.payload.seller);
                            }
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>
</AccessibleChart>
            )}
        </div>
    );
}

export function RevenueForecast({ forecast }: { forecast: number[] }) {
    const data = forecast.map((val, i) => ({ month: `Mês ${i + 1}`, value: val }));

    return (
        <div className="h-[300px] w-full">
            {data.every((point) => point.value === 0) ? <EmptyChartState message="Não há histórico suficiente para projetar receita nos filtros selecionados." /> : (
            <AccessibleChart label="Previsão de receita mensal" entries={data.map((point) => `${point.month}: ${formatCurrency(point.value)}`)}>
<ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={false} />
                    <YAxis tick={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} name="Previsão" />
                </LineChart>
            </ResponsiveContainer>
</AccessibleChart>
            )}
        </div>
    );
}

export function LossReasonChart({ data, onPieClick }: { data: any[], onPieClick?: (reason: string) => void }) {
    return (
        <div className="h-[300px] w-full">
            {data.length === 0 ? <EmptyChartState message="Não há motivos de perda nos filtros selecionados." /> : (
            <AccessibleChart label="Motivos de perda" entries={data.map((point) => `${point.name}: ${point.value} ocorrências`)} onSelect={onPieClick ? (index) => onPieClick(data[index].name) : undefined}>
<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="var(--primary)"
                        paddingAngle={5}
                        dataKey="value"
                        className="cursor-pointer"
                        onClick={(entry) => {
                            if (onPieClick && entry && entry.name) {
                                onPieClick(entry.name);
                            }
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                </PieChart>
            </ResponsiveContainer>
</AccessibleChart>
            )}
        </div>
    );
}

interface ProductAnalysisProps {
    data: Array<{
        productName: string;
        quantitySold: number;
        revenue: number;
        avgPrice: number;
    }>;
}

export const ProductAnalysis = ({ data }: ProductAnalysisProps) => {

    const topProduct = data[0];

    return (
        <div className="glass-card p-6 rounded-[var(--radius-panel)] bg-card border border-border">
            <div className="mb-6">
                <p className="ds-type-body text-muted-foreground">Produtos mais vendidos por receita</p>
            </div>

            {data.length === 0 ? <EmptyChartState message="Não há produtos ganhos para os filtros selecionados." /> : <>

            {/* Top Product */}
            {topProduct && (
                <div className="mb-6 p-4 bg-primary/5 rounded-[var(--radius-control)] border border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="ds-type-label text-muted-foreground font-bold uppercase">Mais Vendido</p>
                            <p className="ds-type-section-title font-bold text-foreground">{topProduct.productName}</p>
                        </div>
                        <div className="text-right">
                            <p className="ds-type-metric font-bold text-primary">{formatCurrency(topProduct.revenue, { compact: true })}</p>
                            <p className="ds-type-label text-muted-foreground">{topProduct.quantitySold} unidades</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-[250px] w-full">
                <AccessibleChart label="Receita por produto" entries={data.map((point) => `${point.productName}: ${formatCurrency(point.revenue)}, ${point.quantitySold} unidades`)}>
<ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis type="number" tick={false} />
                        <YAxis dataKey="productName" type="category" width={150} tick={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                        />
                        <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                </ResponsiveContainer>
</AccessibleChart>
            </div>

            {/* Product List */}
            <div className="mt-6 space-y-3">
                {data.map((product, index) => (
                    <div key={product.productName} className="flex items-center justify-between p-3 bg-muted/30 rounded-[var(--radius-control)] hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center ds-type-label font-bold">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-bold text-foreground ds-type-body">{product.productName}</p>
                                <p className="ds-type-label text-muted-foreground">{product.quantitySold} unidades vendidas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(product.revenue, { compact: true })}</p>
                            <p className="ds-type-label text-muted-foreground">{formatCurrency(product.avgPrice)}/un</p>
                        </div>
                    </div>
                ))}
            </div>
            </>}
        </div>
    );
};

