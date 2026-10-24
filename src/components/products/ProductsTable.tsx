'use client';

import { type Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Package, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

interface ProductsTableProps {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onDuplicate: (product: Product) => void;
}

const formatBRL = (value: number | undefined) => formatCurrency(value ?? 0);

export function ProductsTable({ products, onEdit, onDelete, onDuplicate }: ProductsTableProps) {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Produto</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">SKU</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Fabricante</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Categoria</th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, i) => (
                        <tr
                            key={product.id}
                            className={cn(
                                'border-b border-border/50 hover:bg-muted/20 transition-colors',
                                i === products.length - 1 && 'border-b-0'
                            )}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                        {product.icon ? (
                                            <span className="text-base">{product.icon}</span>
                                        ) : (
                                            <Package className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm leading-tight truncate max-w-[200px]">{product.name}</p>
                                        {product.description && (
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">
                                {product.sku || '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                                {product.brand || '—'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                                {product.category ? (
                                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                                        {product.category}
                                    </span>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(product)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onDuplicate(product)}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => onDelete(product.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum produto encontrado.</div>
            )}
        </div>
    );
}
