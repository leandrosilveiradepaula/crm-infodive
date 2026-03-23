import React from 'react';
import { Layout } from 'lucide-react';
import { formatCurrency } from '@/utils/analytics';

interface ProposalProductsTableProps {
    productsList: any[];
}

export function ProposalProductsTable({ productsList }: ProposalProductsTableProps) {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <Layout className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Escopo do Investimento</h4>
            </div>

            {productsList && productsList.length > 0 ? (
                <div className="space-y-3">
                    {productsList.map((product: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border border-border/50 hover:border-blue-200 transition-colors">
                            <div className="flex-1">
                                <p className="text-sm font-bold text-foreground">{product.name || 'Produto'}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Qty: {product.quantity || 1}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-base font-black text-primary">
                                    {formatCurrency(
                                        (typeof product.unit_price === 'number' ? product.unit_price : 0) *
                                        (typeof product.quantity === 'number' ? product.quantity : 1)
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Nenhum produto detalhado nesta proposta.</p>
            )}
        </div>
    );
}
