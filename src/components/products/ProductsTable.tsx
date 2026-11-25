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
        <div role="region" aria-label="Tabela de produtos" tabIndex={0} data-qa-region="directory-table" className="min-w-0 max-w-full overflow-x-auto focus-ring bg-card border border-border rounded-[var(--radius-panel)]">
            <table aria-label="Produtos" className="w-full min-w-[var(--ds-directory-table-min-width)] text-body-ui">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Produto</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">SKU</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Fabricante</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Categoria</th>
                        <th scope="col" className="px-4 py-3 text-right text-label-ui font-semibold text-foreground">Ações</th>
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
                                    <div className="h-8 w-8 rounded-[var(--radius-control)] bg-info-subtle dark:bg-info/30 flex items-center justify-center shrink-0">
                                        {product.icon ? (
                                            <span className="text-body-ui">{product.icon}</span>
                                        ) : (
                                            <Package className="h-4 w-4 text-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-body-ui leading-tight truncate max-w-[200px]">{product.name}</p>
                                        {product.description && (
                                            <p className="text-metadata-ui text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-metadata-ui text-muted-foreground">
                                {product.sku || '—'}
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground">
                                {product.brand || '—'}
                            </td>
                            <td className="px-4 py-3">
                                {product.category ? (
                                    <span className="px-2 py-0.5 bg-muted rounded-full text-metadata-ui font-bold text-muted-foreground">
                                        {product.category}
                                    </span>
                                ) : <span className="text-metadata-ui text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label={`Editar produto ${product.name}`} onClick={() => onEdit(product)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label={`Duplicar produto ${product.name}`} onClick={() => onDuplicate(product)}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable" aria-label={`Excluir produto ${product.name}`} onClick={() => onDelete(product.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-body-ui">Nenhum produto encontrado.</div>
            )}
        </div>
    );
}
