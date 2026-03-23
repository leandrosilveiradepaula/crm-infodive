import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

export function ConversionFunnel({ data, onBarClick }: { data: any[], onBarClick?: (stage: string) => void }) {

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" />
                    <YAxis dataKey="stage" type="category" stroke="var(--muted-foreground)" width={100} />
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
        </div>
    );
}

export function SalesPerformance({ data, onBarClick }: { data: any[], onBarClick?: (seller: string) => void }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="seller" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
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
        </div>
    );
}

export function RevenueForecast({ forecast }: { forecast: number[] }) {
    const data = forecast.map((val, i) => ({ month: `Mês ${i + 1}`, value: val }));

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} name="Previsão" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function LossReasonChart({ data, onPieClick }: { data: any[], onPieClick?: (reason: string) => void }) {
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
        <div className="glass-card p-6 rounded-2xl bg-card border border-border">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground">Produtos mais vendidos por receita</p>
            </div>

            {/* Top Product */}
            {topProduct && (
                <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Mais Vendido</p>
                            <p className="text-lg font-bold text-foreground">{topProduct.productName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(topProduct.revenue, { compact: true })}</p>
                            <p className="text-xs text-muted-foreground">{topProduct.quantitySold} unidades</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis type="number" stroke="var(--muted-foreground)" />
                        <YAxis dataKey="productName" type="category" width={150} stroke="var(--muted-foreground)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                        />
                        <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Product List */}
            <div className="mt-6 space-y-3">
                {data.map((product, index) => (
                    <div key={product.productName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-bold text-foreground text-sm">{product.productName}</p>
                                <p className="text-xs text-muted-foreground">{product.quantitySold} unidades vendidas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(product.revenue, { compact: true })}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(product.avgPrice)}/un</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

