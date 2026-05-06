import React from 'react';
import {
    GripVertical, ArrowUp, ArrowDown, ChevronUp, ChevronDown, ChevronRight,
    DollarSign, Trash2, Link, Link2Off, Eye, EyeOff
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ProductItem } from '../SortableProductRow';

interface ProductRowHeaderProps {
    product: ProductItem;
    isEditing: boolean;
    isFirst: boolean;
    isLast: boolean;
    selectedProducts: Set<string>;
    toggleSelectProduct: (productId: string) => void;
    toggleProductExpansion: (productId: string) => void;
    expandedProducts: Set<string>;
    handleUpdateProduct: (prodId: string, field: keyof ProductItem, value: any) => void;
    handleRemoveProduct: (prodId: string) => void;
    moveProduct: (id: string, direction: 'up' | 'down') => void;
    previousProduct?: ProductItem;
    onLink?: (childId: string, parentId: string) => void;
    onUnlink?: (childId: string) => void;

    // DnD kit props
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
    attributes: any;
    listeners: any;
    isDragging: boolean;
    handleInputKeyDown: (e: React.KeyboardEvent) => void;
}

export function ProductRowHeader({
    product,
    isEditing,
    isFirst,
    isLast,
    selectedProducts,
    toggleSelectProduct,
    toggleProductExpansion,
    expandedProducts,
    handleUpdateProduct,
    handleRemoveProduct,
    moveProduct,
    previousProduct,
    onLink,
    onUnlink,
    setNodeRef,
    style,
    attributes,
    listeners,
    isDragging,
    handleInputKeyDown
}: ProductRowHeaderProps) {

    // Formatting helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const rowClasses = `hover:bg-accent/30 transition-colors group cursor-pointer ${isDragging ? 'bg-primary/10' : ''}`;

    return (
        <tr 
            ref={setNodeRef as any} 
            style={style} 
            className={rowClasses}
            onClick={() => toggleProductExpansion(product.id)}
        >
            <td className="pl-4 w-10 text-center align-middle">
                {isEditing && (
                    <div className="flex flex-col items-center gap-1">
                        <button
                            {...attributes}
                            {...listeners}
                            className="p-1 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing"
                            title="Arraste para reordenar"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); moveProduct(product.id, 'up'); }}
                                disabled={isFirst}
                                className={`p-0.5 rounded hover:bg-muted ${isFirst ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); moveProduct(product.id, 'down'); }}
                                disabled={isLast}
                                className={`p-0.5 rounded hover:bg-muted ${isLast ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <ArrowDown className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}
            </td>
            <td className="pl-6 py-4 w-16 text-center align-middle">
                {isEditing && (
                    <input
                        type="checkbox"
                        onClick={(e) => e.stopPropagation()}
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="h-4 w-4 text-primary bg-background rounded border-input focus:ring-2 focus:ring-primary cursor-pointer accent-primary"
                    />
                )}
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-4 items-center">
                    {product.parent_id && (
                        <div className="w-8 flex items-center justify-center">
                            <div className="h-8 w-px bg-border/50 relative">
                                <div className="absolute top-1/2 left-0 w-4 h-px bg-border/50"></div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleProductExpansion(product.id); }}
                        className="p-1.5 rounded-md hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                    >
                        {expandedProducts.has(product.id) ? (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                            <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="min-w-0 flex-1">
                                {/* Show display_name (proposal name) if set, otherwise show IBM name */}
                                {product.display_name ? (
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground text-sm leading-tight uppercase tracking-tight truncate">{product.display_name}</p>
                                        <p className="text-[10px] text-muted-foreground/50 font-mono truncate leading-tight mt-0.5" title={product.name}>{product.name}</p>
                                    </div>
                                ) : isEditing && !product.product_id ? (
                                    <Input
                                        value={product.name || ''}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdateProduct(product.id, 'name', e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="h-7 py-0 px-2 text-sm font-bold uppercase tracking-tight bg-amber-500/5 border-amber-500/30 focus:border-amber-500 text-foreground"
                                        placeholder="Nome do produto..."
                                    />
                                ) : (
                                    <p className="font-bold text-foreground text-sm leading-tight uppercase tracking-tight truncate shrink-0">{product.name}</p>
                                )}
                            </div>

                            {product.duration && product.duration_unit ? (
                                <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 uppercase tracking-wider">
                                    Válido por {product.duration} {product.duration_unit}
                                </Badge>
                            ) : isEditing && (product.category === 'Software' || product.category === 'Licenciamento') && (
                                <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase tracking-wider animate-pulse">
                                    Definir Duração
                                </Badge>
                            )}
                            {isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {product.parent_id ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); onUnlink?.(product.id); }}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                            title="Desvincular item"
                                        >
                                            <Link2Off className="h-3 w-3" />
                                        </Button>
                                    ) : previousProduct && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); onLink?.(product.id, previousProduct.id); }}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                            title={`Vincular a ${previousProduct.name}`}
                                        >
                                            <Link className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Display Name (Proposal Name) input — shown in edit mode */}
                        {isEditing && (
                            <div className="mt-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider whitespace-nowrap">📄</span>
                                <Input
                                    placeholder={product.name}
                                    value={product.display_name || ''}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleUpdateProduct(product.id, 'display_name', e.target.value || null)}
                                    className="h-6 py-0 px-2 text-[11px] flex-1 bg-primary/5 border-primary/30 focus:border-primary placeholder:text-muted-foreground/40 placeholder:italic font-medium"
                                    title="Nome que aparece na proposta para o cliente"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                            <p className={`text-[10px] font-bold uppercase tracking-wide transition-all ${product.show_sku_on_proposal === false ? 'text-muted-foreground/40 line-through' : 'text-muted-foreground'}`}>
                                {product.sku}
                            </p>
                            {isEditing && product.sku && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateProduct(product.id, 'show_sku_on_proposal', product.show_sku_on_proposal === false ? true : false);
                                    }}
                                    className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                    title={product.show_sku_on_proposal === false ? "Oculto no PDF (Clique para exibir)" : "Visível no PDF (Clique para ocultar)"}
                                >
                                    {product.show_sku_on_proposal === false ? <EyeOff className="h-3 w-3 text-destructive/70" /> : <Eye className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                    </div>
                    {product.is_bid && (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[9px] font-bold uppercase border-blue-500/20">
                            BID
                        </Badge>
                    )}
                    {product.is_usd && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[9px] font-bold uppercase border-emerald-500/20 flex items-center gap-1">
                            <DollarSign className="h-2 w-2" /> USD
                        </Badge>
                    )}
                    {product.is_optional && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-[9px] font-bold uppercase border-amber-500/20">
                            Opcional
                        </Badge>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                {isEditing ? (
                    <div className="flex items-center justify-center">
                        <Input
                            type="number"
                            min="1"
                            className="w-20 px-2 text-center bg-background border-input rounded-xl h-9 text-sm font-black text-foreground focus:ring-primary"
                            value={product.quantity ?? ''}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateProduct(product.id, 'quantity', e.target.value === '' ? undefined : parseInt(e.target.value))}
                            onKeyDown={(e) => { e.stopPropagation(); handleInputKeyDown(e); }}
                            onFocus={(e) => { e.stopPropagation(); e.target.select(); }}
                        />
                    </div>
                ) : (
                    <div className="h-9 flex items-center justify-center">
                        <span className="text-sm font-bold text-muted-foreground">x{product.quantity}</span>
                    </div>
                )}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="h-9 flex items-center justify-end">
                    <p className="text-sm font-bold text-muted-foreground">
                        {formatCurrency(product.unit_price || 0)}
                    </p>
                </div>
            </td>
            <td className="px-6 py-3 text-right">
                <div className="h-9 flex items-center justify-end">
                    <p className={`text-sm font-bold ${product.is_optional ? 'text-muted-foreground/50 line-through' : 'text-primary'}`}>
                        {formatCurrency((product.unit_price || 0) * (product.quantity || 0))}
                    </p>
                </div>
            </td>
            <td className="px-4 py-3 text-center">
                <div className="h-9 flex items-center justify-center">
                    {isEditing && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveProduct(product.id); }} 
                            className="p-2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors bg-muted/30 rounded-xl border border-transparent hover:border-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}
