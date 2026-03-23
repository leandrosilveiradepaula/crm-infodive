import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

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
        <div className="glass-card p-6 rounded-2xl">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Top 5 Produtos</h3>
                <p className="text-sm text-muted-foreground">Produtos mais vendidos por receita</p>
            </div>

            {/* Top Product */}
            {topProduct && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Mais Vendido</p>
                            <p className="text-lg font-bold text-foreground">{topProduct.productName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{formatCurrency(topProduct.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{topProduct.quantitySold} unidades</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" />
                    <YAxis dataKey="productName" type="category" width={150} stroke="var(--muted-foreground)" />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-card p-4 rounded-lg shadow-xl border border-border">
                                        <p className="font-bold text-foreground mb-2">{data.productName}</p>
                                        <p className="text-sm text-muted-foreground">Receita: <span className="font-bold text-primary">{formatCurrency(data.revenue, { compact: true })}</span></p>
                                        <p className="text-sm text-muted-foreground">Quantidade: <span className="font-bold">{data.quantitySold}</span></p>
                                        <p className="text-sm text-muted-foreground">Preço Médio: <span className="font-bold">{formatCurrency(data.avgPrice, { compact: true })}</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 8, 8, 0]} />
                </BarChart>
            </ResponsiveContainer>

            {/* Product List */}
            <div className="mt-6 space-y-3">
                {data.map((product, index) => (
                    <div key={product.productName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </span>
                            <div>
                                <p className="font-bold text-foreground text-sm">{product.productName}</p>
                                <p className="text-xs text-muted-foreground">{product.quantitySold} unidades vendidas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(product.avgPrice)}/un</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
